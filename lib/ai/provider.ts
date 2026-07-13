// Lumora AI service — provider-agnostic interface backed by Google Gemini.
//
// The rest of the application imports ONLY the functions below and never learns
// which model provider is in use. Swapping providers means editing this file
// alone. All calls run server-side; GEMINI_API_KEY is never exposed to the
// browser.
//
// Hard rules baked into every prompt:
//   - Analyze ONLY the real data passed in (Yahoo Finance quotes, computed
//     technical indicators, real news headlines).
//   - Never hallucinate prices, financial figures, or news.

import { GoogleGenAI, Type } from "@google/genai"

console.log("PROVIDER FILE LOADED")

export const DISCLAIMER = "For research and educational purposes only. Not financial advice."

const SECRET_PATTERN = /(api[_-]?key|secret|token|password|authorization|bearer)/i

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash"
const MODEL_FAST = process.env.GEMINI_MODEL_FAST || "gemini-2.0-flash-lite"

type ErrorWithDetails = Error & {
  status?: unknown
  statusCode?: unknown
  code?: unknown
  response?: unknown
  body?: unknown
  error?: unknown
}

export class AiConfigError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "AiConfigError"
  }
}

export class AiBillingError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "AiBillingError"
  }
}

let client: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new AiConfigError("GEMINI_API_KEY is not configured.")
  }
  if (!client) client = new GoogleGenAI({ apiKey })
  return client
}

/* --------------------------- Lightweight TTL cache -------------------------- */
// In-memory cache to avoid re-running expensive model calls for the same input
// within a short window (per warm server instance).

type CacheEntry<T> = { value: T; at: number }
const cache = new Map<string, CacheEntry<unknown>>()

async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as CacheEntry<T> | undefined
  if (hit && Date.now() - hit.at < ttlMs) return hit.value
  const value = await fn()
  cache.set(key, { value, at: Date.now() })
  if (cache.size > 500) {
    // Evict the oldest entries to keep the map bounded.
    const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at).slice(0, 100)
    for (const [k] of oldest) cache.delete(k)
  }
  return value
}

const CHAT_SYSTEM = `You are Lumora, a knowledgeable, calm market-intelligence assistant. You help users understand stocks, indices, crypto, indicators, portfolio strategy, and financial concepts in plain, honest language.

Rules:
- Answer the user's question directly. Keep responses focused and useful.
- Never invent prices, figures, or news. If you need live market data, say so and explain how the user can get it inside Lumora.
- Do not give personalized financial advice that guarantees outcomes. Add a short reminder that this is educational, not financial advice, when the user asks for buy/sell decisions.
- Use markdown: headings, lists, bold, and fenced code blocks when showing code or structured data.
- Be concise but complete.`

export type ChatMessageInput = { role: "user" | "assistant" | "model"; content: string }

export type ChatStreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; usage: { promptTokens: number; completionTokens: number } }
  | { type: "error"; message: string }

/**
 * Streams a multi-turn chat completion from Gemini. Yields token deltas and a
 * final `done` event carrying token usage. Throws on configuration/billing
 * errors so the caller can surface a proper message.
 */
export async function* streamChat(
  messages: ChatMessageInput[],
  opts?: { model?: string; system?: string },
): AsyncGenerator<ChatStreamEvent> {
  const client = getClient()
  const contents = messages.map((m) => ({
    role: m.role === "assistant" || m.role === "model" ? "model" : "user",
    parts: [{ text: m.content }],
  }))
  let promptTokens = 0
  let completionTokens = 0
  try {
    const res = await client.models.generateContentStream({
      model: opts?.model || MODEL,
      contents,
      config: {
        systemInstruction: opts?.system || CHAT_SYSTEM,
        temperature: 0.4,
      },
    })
    for await (const chunk of res) {
      const text = (chunk as { text?: string }).text
      if (text) yield { type: "delta", text }
      const u = (chunk as { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } })
        .usageMetadata
      if (u) {
        promptTokens = u.promptTokenCount ?? promptTokens
        completionTokens = u.candidatesTokenCount ?? completionTokens
      }
    }
    yield { type: "done", usage: { promptTokens, completionTokens } }
  } catch (err) {
    const classified = classify(err)
    yield { type: "error", message: classified.message }
  }
}


function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === "string") return value.replace(SECRET_PATTERN, "[REDACTED]")
  if (value === null || typeof value !== "object") return value
  if (seen.has(value)) return "[Circular]"
  seen.add(value)

  if (Array.isArray(value)) return value.map((item) => redact(item, seen))

  const output: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    output[key] = /api.?key|authorization|token|credential|secret/i.test(key)
      ? "[REDACTED]"
      : redact(item, seen)
  }
  return output
}

export function getAiErrorDiagnostic(err: unknown): Record<string, unknown> {
  if (!(err instanceof Error)) {
    return { thrownValue: redact(err) }
  }

  const detailed = err as ErrorWithDetails
  const diagnostic: Record<string, unknown> = {
    name: err.name,
    message: redact(err.message),
    stack: redact(err.stack),
  }

  for (const key of ["status", "statusCode", "code", "response", "body", "error"] as const) {
    if (detailed[key] !== undefined) diagnostic[key] = redact(detailed[key])
  }
  if (err.cause !== undefined) diagnostic.cause = getAiErrorDiagnostic(err.cause)

  return diagnostic
}

function classify(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err)
  const diagnostic = JSON.stringify(getAiErrorDiagnostic(err))
  const combined = `${msg} ${diagnostic}`
  const matchQuota = /quota|billing|payment|exceeded|RESOURCE_EXHAUSTED|429/i.exec(combined)
  const matchConfig = /api[_-]?key|permission|unauthenticated|unauthorized|403|401|API_KEY_INVALID|not.configured/i.exec(combined)
  console.log("[classify] combined full:", combined)
  console.log("[classify] matchQuota:", matchQuota?.[0], "at index", matchQuota?.index)
  console.log("[classify] matchConfig:", matchConfig?.[0], "at index", matchConfig?.index)
  if (matchQuota) {
    return new AiBillingError(msg, { cause: err })
  }
  if (matchConfig) {
    return new AiConfigError(msg, { cause: err })
  }
  return err instanceof Error ? err : new Error(msg, { cause: err })
}

function parseJsonResponse<T>(text: string | undefined, operation: string): T {
  const value = text?.trim()
  if (!value) throw new Error(`Gemini returned an empty response for ${operation}.`)
  try {
    return JSON.parse(value) as T
  } catch (cause) {
    throw new Error(`Gemini returned invalid JSON for ${operation}.`, { cause })
  }
}

/* --------------------------------- Types --------------------------------- */

export type Bias = "Bullish" | "Bearish" | "Neutral"
export type SentimentLabel = "Positive" | "Negative" | "Neutral"
export type RiskLevel = "Low" | "Medium" | "High"
export type Recommendation = "Strong Buy" | "Buy" | "Hold" | "Wait" | "Sell" | "Strong Sell"

export type Analysis = {
  // 1. Final recommendation
  recommendation: Recommendation
  recommendationReason: string
  // 2. Confidence
  confidenceScore: number
  confidenceNote: string
  // 3. Quick summary
  quickSummary: string[]
  // 4. If you buy today
  entry: string
  target: string
  stopLoss: string
  holdingPeriod: string
  riskReward: string
  // New features
  probabilityOfProfit: number
  probabilityOfLoss: number
  probabilityReason: string
  bestTimeframe: string
  suitableFor: string[]
  // Possible scenarios
  scenarioBest: string
  scenarioLikely: string
  scenarioWorst: string
  // Risk vs reward
  maxDownside: string
  expectedUpside: string
  riskRewardNote: string
  // Position size advice (percent of capital, never above 30%)
  positionVerySafe: string
  positionModerate: string
  positionAggressive: string
  positionNote: string
  // Holding time
  bestHoldingTime: string
  holdingReason: string
  // 5 / 6
  whyBuy: string[]
  whatCouldGoWrong: string[]
  // 7. Price levels
  support: string
  supportNote: string
  resistance: string
  resistanceNote: string
  // 8. Risk level
  riskLevel: RiskLevel
  riskNote: string
  // 9. Market mood
  marketMood: Bias
  marketMoodNote: string
  // 10. Beginner explanation
  beginnerExplanation: string
  // Direct answers to the questions a beginner actually asks
  isGoodToday: string
  biggestRisk: string
  safestWay: string
  waitOrBuyNow: string
  smallBudgetPlan: string
  largeBudgetPlan: string
  // Simple action plan
  actionToday: string
  actionNext3Days: string
  actionNextWeek: string
  // Advisor-grade trust & guidance
  investmentStyle: "Intraday" | "Swing" | "Positional" | "Long Term"
  investmentStyleReason: string
  dataUsed: string[]
  aiCannotKnow: string[]
  whoCanConsider: string[]
  whoShouldAvoid: string[]
  worstMistake: string
  simpleExample: string
  // Honest personal take — "If this was my family member"
  ownMoneyView: string
  // 11. Pro investor view
  proInvestorView: string
  // 12. Final advice in one sentence
  aiVerdict: string
  disclaimer: string
}

export type NewsSentimentItem = {
  index: number
  sentiment: "positive" | "negative" | "neutral"
  reason: string
}

export type NewsSentiment = {
  overall: "positive" | "negative" | "neutral"
  summary: string
  items: NewsSentimentItem[]
}

export type InvestmentResearch = {
  investmentThesis: string
  catalysts: string[]
  riskFactors: string[]
  shortTermView: string
  swingView: string
  longTermView: string
  confidenceScore: number
  disclaimer: string
}

/* -------------------------------- Schemas -------------------------------- */

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    recommendation: {
      type: Type.STRING,
      enum: ["Strong Buy", "Buy", "Hold", "Wait", "Sell", "Strong Sell"],
      description: "The final call, grounded strictly in the supplied data.",
    },
    recommendationReason: { type: Type.STRING, description: "ONE simple sentence explaining the recommendation in plain everyday English." },
    confidenceScore: { type: Type.NUMBER, description: "Integer 0-100 confidence in the recommendation." },
    confidenceNote: { type: Type.STRING, description: "One simple sentence explaining what this confidence means. Remind that no prediction is guaranteed." },
    quickSummary: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Max 3 very short, simple bullet points. No jargon.",
    },
    entry: { type: Type.STRING, description: "Suggested entry price with currency symbol, drawn from the data. If not derivable, 'Data not available.'" },
    target: { type: Type.STRING, description: "Target price with currency symbol, based on resistance/levels in the data." },
    stopLoss: { type: Type.STRING, description: "Stop loss price with currency symbol, based on support/ATR in the data." },
    holdingPeriod: { type: Type.STRING, description: "Expected holding time in plain words, e.g. '2-6 weeks'." },
    riskReward: { type: Type.STRING, description: "Risk to reward ratio, e.g. '1 : 2.7'." },
    probabilityOfProfit: { type: Type.NUMBER, description: "Integer 0-100 estimated probability the trade is profitable, based on the data. probabilityOfProfit + probabilityOfLoss must equal 100." },
    probabilityOfLoss: { type: Type.NUMBER, description: "Integer 0-100 estimated probability of loss. Must equal 100 minus probabilityOfProfit." },
    probabilityReason: { type: Type.STRING, description: "One simple sentence explaining WHY these probabilities, in plain English tied to the data. No jargon." },
    bestTimeframe: { type: Type.STRING, description: "The single best timeframe for this idea in plain words, e.g. 'Swing (a few weeks)'." },
    suitableFor: {
      type: Type.ARRAY,
      items: { type: Type.STRING, enum: ["Intraday", "Swing", "Long Term", "Dividend Investors", "Beginners", "Experienced Traders"] },
      description: "Who this idea suits best. Pick only the ones that genuinely fit the data.",
    },
    scenarioBest: { type: Type.STRING, description: "Best case: what happens if everything goes well. One or two short plain sentences, ideally with a rough % or price move." },
    scenarioLikely: { type: Type.STRING, description: "Most likely / realistic outcome. One or two short plain sentences, ideally with a rough % or price move." },
    scenarioWorst: { type: Type.STRING, description: "Worst case: what can go wrong. One or two short plain sentences, ideally with a rough % or price move." },
    maxDownside: { type: Type.STRING, description: "Maximum likely downside as a percent, e.g. '-4%'. Derived from stop-loss/support vs entry." },
    expectedUpside: { type: Type.STRING, description: "Expected upside as a percent, e.g. '+10%'. Derived from target vs entry." },
    riskRewardNote: { type: Type.STRING, description: "ONE simple sentence explaining the risk-reward in plain English (e.g. 'You risk about 4% to try to make about 10%.')." },
    positionVerySafe: { type: Type.STRING, description: "Percent of capital to invest for a very safe approach, e.g. '10%'. Never above 30%." },
    positionModerate: { type: Type.STRING, description: "Percent of capital for a moderate approach, e.g. '20%'. Never above 30%." },
    positionAggressive: { type: Type.STRING, description: "Percent of capital for an aggressive approach, e.g. '30%'. NEVER above 30%." },
    positionNote: { type: Type.STRING, description: "One simple sentence reminding never to put all money into one stock, and to size based on comfort with risk." },
    bestHoldingTime: { type: Type.STRING, enum: ["Intraday", "1 Week", "1 Month", "3 Months", "Long Term"], description: "The single best holding time for this idea, chosen from the options." },
    holdingReason: { type: Type.STRING, description: "One simple sentence explaining why that holding time is best, tied to the data." },
    whyBuy: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Max 4 simple reasons to buy, each in plain English tied to the data." },
    whatCouldGoWrong: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Max 4 simple risks in plain English tied to the data/headlines." },
    support: { type: Type.STRING, description: "Support price level with currency symbol." },
    supportNote: { type: Type.STRING, description: "One simple sentence: this is the area where buyers usually start buying." },
    resistance: { type: Type.STRING, description: "Resistance price level with currency symbol." },
    resistanceNote: { type: Type.STRING, description: "One simple sentence: this is the area where selling pressure may appear." },
    riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
    riskNote: { type: Type.STRING, description: "One simple sentence explaining the risk level." },
    marketMood: { type: Type.STRING, enum: ["Bullish", "Bearish", "Neutral"] },
    marketMoodNote: { type: Type.STRING, description: "One simple sentence explaining the mood. Avoid the words bullish/bearish in the explanation." },
    beginnerExplanation: {
      type: Type.STRING,
      description: "Max 60 words. Explain like talking to a family member who never studied finance. Very short sentences. No technical words. Warm and honest. Do NOT repeat facts already covered in other fields.",
    },
    isGoodToday: { type: Type.STRING, description: "One plain sentence answering 'Is this stock good to buy today?' — a clear yes/no/partly with the single main reason." },
    biggestRisk: { type: Type.STRING, description: "The ONE biggest risk, explained like to a parent who knows nothing about markets. Say what could happen and what it means for their money. Do not just name a term." },
    safestWay: { type: Type.STRING, description: "One plain sentence on the safest way to invest here (e.g. buy a little at a time, keep a stop-loss)." },
    waitOrBuyNow: { type: Type.STRING, description: "One plain sentence: should they wait or buy now, and why. If confidenceScore is below 60, this MUST recommend waiting." },
    smallBudgetPlan: { type: Type.STRING, description: "What to do with a SMALL starter budget in the instrument's own currency (e.g. ₹5,000 for INR stocks, $100 for USD). One or two short sentences." },
    largeBudgetPlan: { type: Type.STRING, description: "What to do with a LARGER budget in the instrument's own currency (e.g. ₹50,000 for INR stocks, $1,000 for USD). One or two short sentences. Stress spreading out purchases." },
    actionToday: { type: Type.STRING, description: "Simple action for today. Short. May start with 'Buy small', 'Wait', etc." },
    actionNext3Days: { type: Type.STRING, description: "Simple thing to watch over the next 3 days, referencing a real price level from the data." },
    actionNextWeek: { type: Type.STRING, description: "Simple action for next week, referencing a real price level from the data." },
    investmentStyle: { type: Type.STRING, enum: ["Intraday", "Swing", "Positional", "Long Term"], description: "The single best investment style for this idea based on the data." },
    investmentStyleReason: { type: Type.STRING, description: "One simple sentence explaining why that style fits, tied to the data." },
    dataUsed: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "'Why should I trust this?' — the exact data checked, ONLY items truly present in the supplied context. Use short labels like 'Live Price', 'RSI', 'MACD', 'Volume', 'Moving Averages', 'News Headlines', 'Company Fundamentals'. Do NOT list data that was not provided.",
    },
    aiCannotKnow: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "'Things AI cannot know' — 4-5 honest short items, e.g. tomorrow's news, sudden government decisions, company fraud, global conflicts, surprise earnings.",
    },
    whoCanConsider: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "'Who can consider this stock' — 3-4 short plain phrases, e.g. 'Long-term investors', 'SIP investors', 'Beginners', 'Moderate-risk investors'. Fit them to the data.",
    },
    whoShouldAvoid: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "'Who should avoid this stock' — 3-4 short plain phrases, e.g. 'You panic easily', 'You need the money within a week', 'You cannot tolerate temporary losses'.",
    },
    worstMistake: { type: Type.STRING, description: "'Worst mistake to avoid' — one clear, simple sentence, e.g. 'Do not put all your money in at one price.'" },
    simpleExample: { type: Type.STRING, description: "A concrete money split example in the instrument's own currency. Give 2-3 short lines, e.g. 'If your budget is ₹10,000: buy ₹3,000 today, ₹3,000 if price falls near support, keep ₹4,000 in cash.' Use \\n between lines." },
    ownMoneyView: { type: Type.STRING, description: "'If this was my family member...' — 2-3 natural, human lines in first person. No AI/chatbot language, no jargon. Give a concrete stance (e.g. buy a little now, keep cash ready). Do NOT repeat wording from other fields." },
    proInvestorView: {
      type: Type.STRING,
      description: "Technical section for advanced users. Cover trend, momentum, RSI, MACD, ADX, volume, moving averages, and institutional view, citing the numbers.",
    },
    aiVerdict: { type: Type.STRING, description: "Final Advice in ONE honest sentence, e.g. 'If this was my family's money, I would wait for a better buying opportunity.'" },
  },
  required: [
    "recommendation",
    "recommendationReason",
    "confidenceScore",
    "confidenceNote",
    "quickSummary",
    "entry",
    "target",
    "stopLoss",
    "holdingPeriod",
    "riskReward",
    "probabilityOfProfit",
    "probabilityOfLoss",
    "probabilityReason",
    "bestTimeframe",
    "suitableFor",
    "scenarioBest",
    "scenarioLikely",
    "scenarioWorst",
    "maxDownside",
    "expectedUpside",
    "riskRewardNote",
    "positionVerySafe",
    "positionModerate",
    "positionAggressive",
    "positionNote",
    "bestHoldingTime",
    "holdingReason",
    "whyBuy",
    "whatCouldGoWrong",
    "support",
    "supportNote",
    "resistance",
    "resistanceNote",
    "riskLevel",
    "riskNote",
    "marketMood",
    "marketMoodNote",
    "beginnerExplanation",
    "isGoodToday",
    "biggestRisk",
    "safestWay",
    "waitOrBuyNow",
    "smallBudgetPlan",
    "largeBudgetPlan",
    "actionToday",
    "actionNext3Days",
    "actionNextWeek",
    "investmentStyle",
    "investmentStyleReason",
    "dataUsed",
    "aiCannotKnow",
    "whoCanConsider",
    "whoShouldAvoid",
    "worstMistake",
    "simpleExample",
    "ownMoneyView",
    "proInvestorView",
    "aiVerdict",
  ],
  propertyOrdering: [
    "recommendation",
    "recommendationReason",
    "confidenceScore",
    "confidenceNote",
    "quickSummary",
    "entry",
    "target",
    "stopLoss",
    "holdingPeriod",
    "riskReward",
    "probabilityOfProfit",
    "probabilityOfLoss",
    "probabilityReason",
    "bestTimeframe",
    "suitableFor",
    "scenarioBest",
    "scenarioLikely",
    "scenarioWorst",
    "maxDownside",
    "expectedUpside",
    "riskRewardNote",
    "positionVerySafe",
    "positionModerate",
    "positionAggressive",
    "positionNote",
    "bestHoldingTime",
    "holdingReason",
    "whyBuy",
    "whatCouldGoWrong",
    "support",
    "supportNote",
    "resistance",
    "resistanceNote",
    "riskLevel",
    "riskNote",
    "marketMood",
    "marketMoodNote",
    "beginnerExplanation",
    "isGoodToday",
    "biggestRisk",
    "safestWay",
    "waitOrBuyNow",
    "smallBudgetPlan",
    "largeBudgetPlan",
    "actionToday",
    "actionNext3Days",
    "actionNextWeek",
    "ownMoneyView",
    "proInvestorView",
    "aiVerdict",
  ],
}

const newsSchema = {
  type: Type.OBJECT,
  properties: {
    overall: { type: Type.STRING, enum: ["positive", "negative", "neutral"] },
    summary: { type: Type.STRING, description: "One-sentence overall read of the news flow." },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          index: { type: Type.NUMBER },
          sentiment: { type: Type.STRING, enum: ["positive", "negative", "neutral"] },
          reason: { type: Type.STRING, description: "Max 12 words explaining the classification." },
        },
        required: ["index", "sentiment", "reason"],
      },
    },
  },
  required: ["overall", "summary", "items"],
}

const researchSchema = {
  type: Type.OBJECT,
  properties: {
    investmentThesis: { type: Type.STRING, description: "The core investment thesis in 3-5 sentences, grounded in the supplied fundamentals, technicals, and news. Explain WHY." },
    catalysts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 concrete potential catalysts (earnings, macro, sector, technical breakouts) drawn from the data/headlines." },
    riskFactors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 specific downside risks tied to data or headlines." },
    shortTermView: { type: Type.STRING, description: "Days-horizon outlook with trigger levels and reasoning." },
    swingView: { type: Type.STRING, description: "Weeks-horizon outlook with trigger levels and reasoning." },
    longTermView: { type: Type.STRING, description: "Months+ horizon outlook with reasoning." },
    confidenceScore: { type: Type.NUMBER, description: "Integer 0-100 confidence in the thesis." },
  },
  required: ["investmentThesis", "catalysts", "riskFactors", "shortTermView", "swingView", "longTermView", "confidenceScore"],
  propertyOrdering: ["investmentThesis", "catalysts", "riskFactors", "shortTermView", "swingView", "longTermView", "confidenceScore"],
}

const GROUNDING = `You must analyze ONLY the real data provided in the prompt (Yahoo Finance quotes, computed technical indicators, and real news headlines). NEVER invent, estimate, or hallucinate prices, financial figures, or news events. If a value is marked "n/a", state that the data is unavailable rather than guessing. Every conclusion must reference specific data points from the prompt.`

/* ------------------------------- Functions ------------------------------- */

/** Deep, structured instrument analysis grounded strictly in the supplied data. */
export async function generateAnalysis(input: { name: string; horizon: string; context: string }): Promise<Analysis> {
  console.log("GA_ENTERED:" + input.name)
  const system = `You are Lumora, a trusted, warm market guide who explains stocks like a caring elder brother talking to a family member who has NEVER studied finance and has never heard words like RSI, MACD, EMA, P/E, Fibonacci, momentum, support, resistance, or volatility.

STYLE RULES (apply to every field EXCEPT "proInvestorView"):
- Use very simple, everyday English. Short sentences.
- Never assume the reader knows any financial word. If a concept is needed, explain its meaning in plain words instead of naming it.
- Instead of "RSI is overbought" say something like "Many people have already bought this recently, so the price may pause or dip a little before rising again."
- Instead of "MACD crossover / momentum improving" say "More buyers are entering than before, which is usually a good sign."
- Instead of "support is X" say "If the price falls near X, buyers often step in, so it usually stops falling around there."
- Instead of "resistance is X" say "Near X many people tend to sell, so it can be hard for the price to climb higher."
- Be honest and calm. Never hype. Sound human, never like a report or a chatbot.
- Whenever a technical idea is unavoidable, immediately explain it in one simple sentence in brackets, e.g. "Many people bought recently (so the price may slow down for a while)."
- "proInvestorView" is the ONLY field where you may use full technical terms and numbers for advanced users.

QUALITY RULES:
- Write as if Warren Buffett is patiently explaining to a beginner: simple, honest, no marketing, no hype, no emojis anywhere.
- Keep the whole plain-language analysis SHORT — under 350 words TOTAL across all beginner fields (everything except proInvestorView).
- NEVER repeat the same fact in more than one field. Each field must add something new.
- Every sentence must add real value. No filler, no generic lines like "do your own research" beyond the disclaimer.
- EXPLAIN EVERY NUMBER. Never state a raw metric like "RSI 71" on its own; always follow it with a plain-English meaning in brackets, e.g. "RSI 71 (this means many people already bought recently)". This applies even in short fields.
- Explain every risk like you are talking to your parents who know nothing about the stock market: say what could physically happen and how it affects their money.
- NEVER exaggerate and NEVER promise profits. Always be clear that outcomes are uncertain.
- PROBABILITIES: give a real probability of profit and loss (they must sum to 100) and explain in one simple sentence why.
- SCENARIOS: give best case, most likely, and worst case outcomes with rough percentage moves.
- RISK VS REWARD: give maximum likely downside %, expected upside %, and a risk-reward ratio, then explain it in one plain sentence.
- POSITION SIZE: recommend a percentage of capital for very safe / moderate / aggressive approaches. NEVER recommend more than 30% into a single purchase, and never tell the user to invest everything.
- HOLDING TIME: choose the single best holding time (Intraday, 1 Week, 1 Month, 3 Months, or Long Term) and explain why.
- CONFIDENCE SCORE: derive it dynamically from the supplied technical indicators, fundamentals, and news. Every instrument must get a different confidenceScore based on its own data. Never default to 55 or any fixed number. If confidenceScore is below 60, do NOT push a Buy. The recommendation must be "Wait" or "Hold", and waitOrBuyNow, ownMoneyView and aiVerdict must clearly advise waiting for a better/confirmed opportunity.
- ONE-LINE DECISION: aiVerdict must be a single honest sentence in first person, e.g. "If I were investing today, I would wait for a small price drop before buying."
- Answer the reader's real questions clearly across the fields: Is it good today? Why? What is the biggest risk? What is the safest way in? Wait or buy now? What to do with a small budget vs a larger budget?

GROUNDING: ${GROUNDING}`
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim()
    const effectiveModel = process.env.GEMINI_MODEL || "gemini-2.0-flash"
    console.log("[Provider] generateAnalysis called:", {
      name: input.name,
      horizon: input.horizon,
      contextLength: input.context.length,
      model: effectiveModel,
      modelSource: process.env.GEMINI_MODEL ? "GEMINI_MODEL" : "default",
      hasApiKey: !!apiKey,
      keyPreview: apiKey ? apiKey.slice(0, 8) + "********" : "(none)",
      keySource: "GEMINI_API_KEY",
      keyLength: apiKey ? apiKey.length : 0,
    })

    const client = getClient()
    const contents = `Analyze the following instrument for a ${input.horizon} trader. Ground every statement in these figures.\n\n${input.context}\n\nRespond with ONLY valid JSON. No markdown, no code blocks, no explanation outside the JSON. The JSON must follow this structure exactly: {\n  "recommendation": "Strong Buy" | "Buy" | "Hold" | "Wait" | "Sell" | "Strong Sell",\n  "recommendationReason": "string",\n  "confidenceScore": 0-100,\n  "confidenceNote": "string",\n  "quickSummary": ["string", "string", "string"],\n  "entry": "string",\n  "target": "string",\n  "stopLoss": "string",\n  "holdingPeriod": "string",\n  "riskReward": "string",\n  "probabilityOfProfit": 0-100,\n  "probabilityOfLoss": 0-100,\n  "probabilityReason": "string",\n  "bestTimeframe": "string",\n  "suitableFor": ["string"],\n  "scenarioBest": "string",\n  "scenarioLikely": "string",\n  "scenarioWorst": "string",\n  "maxDownside": "string",\n  "expectedUpside": "string",\n  "riskRewardNote": "string",\n  "positionVerySafe": "string",\n  "positionModerate": "string",\n  "positionAggressive": "string",\n  "positionNote": "string",\n  "bestHoldingTime": "Intraday" | "1 Week" | "1 Month" | "3 Months" | "Long Term",\n  "holdingReason": "string",\n  "whyBuy": ["string"],\n  "whatCouldGoWrong": ["string"],\n  "support": "string",\n  "supportNote": "string",\n  "resistance": "string",\n  "resistanceNote": "string",\n  "riskLevel": "Low" | "Medium" | "High",\n  "riskNote": "string",\n  "marketMood": "Bullish" | "Bearish" | "Neutral",\n  "marketMoodNote": "string",\n  "beginnerExplanation": "string",\n  "isGoodToday": "string",\n  "biggestRisk": "string",\n  "safestWay": "string",\n  "waitOrBuyNow": "string",\n  "smallBudgetPlan": "string",\n  "largeBudgetPlan": "string",\n  "actionToday": "string",\n  "actionNext3Days": "string",\n  "actionNextWeek": "string",\n  "investmentStyle": "Intraday" | "Swing" | "Positional" | "Long Term",\n  "investmentStyleReason": "string",\n  "dataUsed": ["string"],\n  "aiCannotKnow": ["string"],\n  "whoCanConsider": ["string"],\n  "whoShouldAvoid": ["string"],\n  "worstMistake": "string",\n  "simpleExample": "string",\n  "ownMoneyView": "string",\n  "proInvestorView": "string",\n  "aiVerdict": "string"\n}`
    console.log("[Provider] Sending Gemini request:", { model: effectiveModel, contentsLength: contents.length })

    const res = await client.models.generateContent({
      model: effectiveModel,
      contents,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        temperature: 0.35,
        httpOptions: { timeout: 25000 },
      },
    })

    console.log("[Provider] Gemini raw response received:", {
      hasText: !!res.text,
      textLength: res.text?.length,
      candidatesCount: res.candidates?.length,
      promptFeedback: res.promptFeedback?.blockReason,
      usage: res.usageMetadata ? { prompt: res.usageMetadata.promptTokenCount, candidates: res.usageMetadata.candidatesTokenCount } : null,
    })

    if (res.text) {
      console.log("[Provider] Gemini raw text (first 500 chars):", res.text.slice(0, 500))
    }

    if (!res.text) {
      throw new Error(`Gemini returned empty text. blockReason: ${res.promptFeedback?.blockReason ?? "none"}, candidates: ${res.candidates?.length ?? 0}`)
    }

    const parsed = parseJsonResponse<Omit<Analysis, "disclaimer">>(res.text, "instrument analysis")
    console.log("[Provider] Parsed analysis:", { recommendation: parsed.recommendation, confidenceScore: parsed.confidenceScore })
    return { ...parsed, disclaimer: DISCLAIMER }
  } catch (err) {
    console.error("[Provider] generateAnalysis error:", {
      name: (err as Error).name,
      message: (err as Error).message,
      cause: (err as Record<string, unknown>).cause ? String((err as Record<string, unknown>).cause) : undefined,
      stack: (err as Error).stack?.split("\n").slice(0, 4).join("\n"),
    })
    throw classify(err)
  }
}

/** Classify real news headlines by investor-impact sentiment. */
export async function generateNewsSentiment(input: { name: string; headlines: string[] }): Promise<NewsSentiment> {
  const list = input.headlines.map((h, i) => `${i}. "${h}"`).join("\n")
  const system = `You are a financial news sentiment analyst. Classify each headline's likely impact on ${input.name} from an investor's perspective as "positive", "negative", or "neutral", based ONLY on the headline text. Do not invent headlines or facts.`
  try {
    const res = await getClient().models.generateContent({
      model: MODEL_FAST,
      contents: `Headlines:\n${list}\n\nReturn the overall read, a one-sentence summary, and per-headline classifications keyed by their index.`,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseSchema: newsSchema,
        temperature: 0.2,
      },
    })
    return parseJsonResponse<NewsSentiment>(res.text, "news sentiment")
  } catch (err) {
    throw classify(err)
  }
}

/** Concise market-wide brief from a set of real index/instrument quotes. */
export async function generateMarketSummary(input: { region: string; movers: string }): Promise<string> {
  const system = `You are Lumora's markets desk. Write a single tight paragraph (max 3 sentences) summarizing the current market tone for the ${input.region} region. ${GROUNDING} Do not use markdown headers or bullet points.`
  return cached(`summary:${input.region}:${input.movers}`, 60_000, async () => {
    try {
      const res = await getClient().models.generateContent({
        model: MODEL_FAST,
        contents: `Current snapshot of key instruments (symbol: price, % change):\n${input.movers}\n\nSummarize the market tone in plain prose.`,
        config: {
          systemInstruction: system,
          temperature: 0.4,
        },
      })
      const summary = res.text?.trim()
      if (!summary) throw new Error("Gemini returned an empty response for market summary.")
      return summary
    } catch (err) {
      throw classify(err)
    }
  })
}

/** Simple text generation for lightweight AI tasks (trade planner, etc.). */
export async function generateText(input: {
  model?: string
  system: string
  prompt: string
  temperature?: number
}): Promise<{ text: string }> {
  try {
    const res = await getClient().models.generateContent({
      model: input.model || MODEL_FAST,
      contents: input.prompt,
      config: {
        systemInstruction: input.system,
        temperature: input.temperature ?? 0.4,
      },
    })
    const text = res.text?.trim()
    if (!text) throw new Error("Empty AI response")
    return { text }
  } catch (err) {
    throw classify(err)
  }
}

/** Long-form investment research (thesis, catalysts, risks, multi-horizon) grounded in real data. */
export async function generateInvestmentResearch(input: {
  name: string
  context: string
}): Promise<InvestmentResearch> {
  const system = `You are Lumora, a senior equity/asset research analyst writing a concise institutional research note. Always explain WHY. ${GROUNDING}`
  try {
    const res = await getClient().models.generateContent({
      model: MODEL,
      contents: `Produce an investment research note for the following instrument. Ground every statement in these figures and headlines.\n\n${input.context}`,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseSchema: researchSchema,
        temperature: 0.4,
      },
    })
    const parsed = parseJsonResponse<Omit<InvestmentResearch, "disclaimer">>(res.text, "investment research")
    return { ...parsed, disclaimer: DISCLAIMER }
  } catch (err) {
    throw classify(err)
  }
}

/* -------------------------------------------------------------------------- */
/* Fallback analysis — data-driven when Gemini is unavailable                  */
/* -------------------------------------------------------------------------- */

function findNum(v: string): number | null {
  const m = v.replace(/[,₹$€£¥]/g, "").match(/[-+]?\d+(?:\.\d+)?/)
  return m ? parseFloat(m[0]) : null
}

function isBuy(r: string) { return r === "Strong Buy" || r === "Buy" }
function isSell(r: string) { return r === "Sell" || r === "Strong Sell" }
function isHoldWait(r: string) { return r === "Hold" || r === "Wait" }

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]
}



function quickSummaryPoints(name: string, price: number, trend: string, rsiVal: number | null, macdHist: number | null, vol: number | null, avgVol: number | null): string[] {
  const points: string[] = []
  points.push(`${name} is trading near ${price >= 1000 ? (price / 1000).toFixed(2) + "K" : price.toFixed(2)} with a ${trend.toLowerCase().includes("bullish") ? "positive" : trend.toLowerCase().includes("bearish") ? "cautious" : "neutral"} outlook.`)
  if (rsiVal !== null) points.push(`RSI at ${rsiVal.toFixed(1)} suggests ${rsiVal > 70 ? "the stock may be due for a pause" : rsiVal < 30 ? "the stock may be undervalued" : "balanced momentum with no extreme signals"}.`)
  if (macdHist !== null) points.push(macdHist > 0 ? `Momentum indicators are improving, which often precedes upward movement.` : `Momentum is declining, suggesting the current push may be losing force.`)
  if (vol !== null && avgVol !== null && avgVol > 0) points.push(vol > avgVol * 1.3 ? `Trading volume is above average, indicating strong market interest.` : `Volume is in line with normal levels, showing no unusual activity.`)
  return points.slice(0, 3)
}

function scenarioText(name: string, price: number, sl: string, tgt: string, direction: "up" | "down" | "mixed"): { best: string; likely: string; worst: string } {
  const slNum = parseFloat(sl)
  const tgtNum = parseFloat(tgt)
  const upPct = tgtNum && price > 0 ? `+${((tgtNum - price) / price * 100).toFixed(1)}%` : "+5-8%"
  const downPct = slNum && price > 0 ? `-${((price - slNum) / price * 100).toFixed(1)}%` : "-5-8%"

  if (direction === "up") return {
    best: `If buying momentum continues, ${name} could push toward ${tgt}, for a potential gain of ${upPct}.`,
    likely: `Gradual upward movement within the current range is the most realistic outcome — the trend is supportive but steady.`,
    worst: `If sentiment shifts suddenly, ${name} could fall toward ${sl}, a drop of ${downPct}. This would likely be temporary if fundamentals remain sound.`,
  }
  if (direction === "down") return {
    best: `A recovery bounce from current levels could take ${name} back toward ${tgt}, recovering ${upPct}.`,
    likely: `The predominant direction is down — the most likely outcome is continued weakness toward ${sl}, a decline of ${downPct}.`,
    worst: `If sellers intensify, ${name} could break below ${sl} and extend losses significantly beyond ${downPct}.`,
  }
  return {
    best: `If buyers step in, ${name} could rally toward ${tgt}, a gain of ${upPct}.`,
    likely: `The most likely path is sideways movement between ${sl} and ${tgt} as the market decides on a direction.`,
    worst: `If sellers take control, ${name} could slip to ${sl}, a drop of ${downPct}.`,
  }
}

export function generateFallbackAnalysis(input: {
  name: string
  horizon: string
  context: string
}): Analysis {
  const ctx = input.context
  const name = input.name
  const lines = ctx.split("\n").filter(Boolean)

  const get = (key: string): string => {
    for (const l of lines) {
      if (l.toLowerCase().includes(key.toLowerCase())) {
        const after = l.split(":")[1]?.trim() ?? ""
        return after || "n/a"
      }
    }
    return "n/a"
  }

  const priceStr = get("Last:")
  const price = findNum(priceStr) ?? 0

  const prevClose = findNum(get("Previous close:"))
  const dayLow = findNum(get("Day range:"))
  const dayHigh = dayLow !== null ? (() => {
    const parts = get("Day range:").split("–")
    return parts.length > 1 ? findNum(parts[1]) : null
  })() : null

  const rsiVal = findNum(get("RSI(14):"))
  const macdVal = get("MACD:")
  const macdHist = macdVal.includes("hist") ? findNum(macdVal.split("hist")[1]) : null
  const ema20 = findNum(get("EMA 20"))
  const ema50 = findNum(get("EMA 50"))
  const ema200 = findNum(get("EMA 200"))
  const supportVal = findNum(get("Support / Resistance"))
  const resistanceVal = supportVal !== null ? (() => {
    const parts = get("Support / Resistance:").split("/")
    return parts.length > 1 ? findNum(parts[1]) : null
  })() : null
  const trend = get("Trend regime:").split("(")[0]?.trim() || "neutral"
  const mCap = get("Market cap:")
  const pe = get("Trailing P/E:")
  const beta = get("Beta:")

  const rsiSignal = rsiVal !== null ? (rsiVal > 70 ? "overbought" : rsiVal < 30 ? "oversold" : "neutral") : "neutral"

  const isBullishTrend = trend.toLowerCase().includes("bullish")
  const isBearishTrend = trend.toLowerCase().includes("bearish")
  const trendUp = ema20 !== null && ema50 !== null && ema20 > ema50

  // Dynamic confidence from multiple factors
  let confidence = 50

  if (rsiVal !== null) {
    if (rsiVal >= 40 && rsiVal <= 60) confidence += 4
    else if (rsiVal > 70 || rsiVal < 30) confidence -= 4
    else if (rsiVal > 60 || rsiVal < 40) confidence += 2
  }

  if (isBullishTrend && trendUp) confidence += 8
  else if (isBearishTrend && !trendUp) confidence += 4
  else if (isBullishTrend !== isBearishTrend) confidence += 2
  else confidence -= 4

  if (macdHist !== null) {
    if (macdHist > 0) confidence += 4
    else if (macdHist < 0) confidence -= 3
  }

  const adxVal = findNum(get("ADX"))
  if (adxVal !== null) {
    if (adxVal >= 25) confidence += 4
    else if (adxVal >= 20) confidence += 2
    else if (adxVal < 15) confidence -= 2
  }

  if (ema20 !== null && ema50 !== null && ema200 !== null && price > 0) {
    const aligned = price > ema20 && ema20 > ema50 && ema50 > ema200
    if (aligned) confidence += 4
    else if (price < ema20 && ema20 < ema50) confidence -= 3
  }

  const volStr = get("Volume:")
  const avgVolStr = get("avg")
  const vol = findNum(volStr)
  const avgVol = findNum(avgVolStr)
  if (vol !== null && avgVol !== null && avgVol > 0) {
    if (vol > avgVol * 1.5) confidence += 3
    else if (vol < avgVol * 0.5) confidence -= 2
  }

  const betaStr = get("Beta:")
  const betaVal = betaStr !== "n/a" ? findNum(betaStr) : null
  if (betaVal !== null) {
    if (betaVal >= 0.8 && betaVal <= 1.3) confidence += 2
    else if (betaVal > 2) confidence -= 3
    else if (betaVal < 0.5) confidence -= 1
  }

  const peVal = pe !== "n/a" ? findNum(pe) : null
  if (peVal !== null) {
    if (peVal > 0 && peVal <= 25) confidence += 2
    else if (peVal > 50) confidence -= 2
  }

  confidence = Math.max(10, Math.min(95, confidence))

  let direction: "up" | "down" | "mixed" = "mixed"
  if (isBullishTrend && trendUp && (rsiVal === null || rsiVal < 70)) direction = "up"
  else if (isBearishTrend || (rsiVal !== null && rsiVal > 70)) direction = "down"
  else direction = "mixed"

  let recommendation: Recommendation = "Hold"
  if (confidence >= 80) recommendation = "Strong Buy"
  else if (confidence >= 68) recommendation = "Buy"
  else if (confidence >= 55) recommendation = "Hold"
  else if (confidence >= 40) recommendation = "Wait"
  else if (confidence >= 25) recommendation = "Sell"
  else recommendation = "Strong Sell"

  let mood: Bias = "Neutral"
  if (isBullishTrend && rsiSignal !== "overbought") mood = "Bullish"
  else if (isBearishTrend || rsiSignal === "overbought") mood = "Bearish"

  let risk: RiskLevel = "Medium"
  if (beta !== "n/a") {
    const b = findNum(beta.split(",")[0])
    if (b !== null) risk = b > 1.5 ? "High" : b < 0.8 ? "Low" : "Medium"
  }

  const entry = price > 0 ? `${price.toFixed(2)}` : "Not computed"
  const tgt = resistanceVal !== null ? resistanceVal.toFixed(2) : price > 0 ? (price * 1.05).toFixed(2) : "Not computed"
  const sl = supportVal !== null ? supportVal.toFixed(2) : prevClose !== null ? (prevClose * 0.95).toFixed(2) : "Not computed"

  const horizonLabel = input.horizon === "day" ? "1-3 days" : input.horizon === "swing" ? "1-4 weeks" : "1-6 months"
  const scen = scenarioText(name, price, sl, tgt, direction)

  const recReasonText = recommendation === "Strong Buy" || recommendation === "Buy"
    ? `${name} shows a favorable setup — the trend is supportive and most indicators align positively, suggesting conditions may be right for entry.`
    : recommendation === "Sell" || recommendation === "Strong Sell"
    ? `${name} faces headwinds — the trend is weak or deteriorating, and risk management should be the priority right now.`
    : confidence >= 55
    ? `The data for ${name} is balanced with mixed signals — holding off for clearer direction is reasonable while watching key price levels.`
    : `The setup for ${name} lacks clear conviction — waiting for a better-defined entry point is the conservative call.`

  const probOfProfit = isBuy(recommendation) ? Math.round(50 + confidence * 0.15) : isSell(recommendation) ? Math.round(100 - confidence * 0.2) : Math.round(45 + confidence * 0.08)

  const probReasonText = isBuy(recommendation)
    ? `Trend strength and positive momentum indicators give ${name} a higher probability of moving higher, though no prediction is guaranteed.`
    : isSell(recommendation)
    ? `Weak technical structure and negative momentum suggest the probability of further downside is elevated for ${name}.`
    : `The mixed signals in ${name}'s data make the outcome uncertain — probabilities are roughly balanced between profit and loss.`

  const rsiExplanation = rsiVal !== null
    ? rsiVal > 70 ? `RSI at ${rsiVal.toFixed(1)} means many buyers have already entered, often leading to a pause.`
      : rsiVal < 30 ? `RSI at ${rsiVal.toFixed(1)} means many sellers have exited, sometimes creating a buying opportunity.`
        : `RSI at ${rsiVal.toFixed(1)} shows no extreme buying or selling pressure.`
    : "RSI data is currently unavailable."

  const entryText = price > 0
    ? direction === "up"
      ? `A reasonable entry range is near ${price.toFixed(2)}, with the option to add on dips toward support at ${sl}.`
      : `Consider waiting for a pullback toward ${sl} before entering. A hurried entry at ${price.toFixed(2)} carries extra risk.`
    : "Not computed"

  const beginnerText = direction === "up"
    ? `Think of ${name} like a shop that's getting more customers each day — the trend is positive. But even good shops have quiet days. The price may dip sometimes before continuing upward. A smart way to invest is to buy a little now and keep some money aside to buy more if the price drops.`
    : direction === "down"
    ? `${name} is like a shop with fewer customers lately — the trend is down. This doesn't mean it's a bad shop forever, but it's usually smarter to wait until customers start returning before jumping in.`
    : `${name} is like a shop where the number of customers is steady — no boom, no bust. This stability can be good for patient investors, but waiting for a clearer direction before buying may be prudent.`

  const confidenceNoteText = confidence >= 70
    ? `The confidence of ${confidence}% reflects that multiple indicators point in the same direction for ${name}.`
    : confidence >= 50
    ? `The confidence of ${confidence}% indicates mixed but leaning signals for ${name}. Markets can change direction quickly, so this is not a guarantee.`
    : `The confidence of ${confidence}% for ${name} reflects conflicting signals across indicators — outcomes are more uncertain than usual.`

  return {
    recommendation,
    recommendationReason: recReasonText,
    confidenceScore: confidence,
    confidenceNote: confidenceNoteText,
    quickSummary: quickSummaryPoints(name, price, trend, rsiVal, macdHist, vol, avgVol),
    entry: entryText,
    target: `~${tgt}`,
    stopLoss: `~${sl}`,
    holdingPeriod: horizonLabel,
    riskReward: sl !== "Not computed" && tgt !== "Not computed" && price > 0
      ? `1 : ${((parseFloat(tgt) - price) / (price - parseFloat(sl))).toFixed(1)}` : "Not computed",
    probabilityOfProfit: Math.min(100, Math.max(0, probOfProfit)),
    probabilityOfLoss: Math.min(100, Math.max(0, 100 - probOfProfit)),
    probabilityReason: probReasonText,
    bestTimeframe: input.horizon === "day" ? "Intraday" : input.horizon === "swing" ? "Swing (1-4 weeks)" : "Positional (1-6 months)",
    suitableFor: ["Swing", "Long Term"] as Analysis["suitableFor"],
    scenarioBest: scen.best,
    scenarioLikely: scen.likely,
    scenarioWorst: scen.worst,
    maxDownside: sl !== "Not computed" && price > 0 ? `-${((price - parseFloat(sl)) / price * 100).toFixed(1)}%` : "Not computed",
    expectedUpside: tgt !== "Not computed" && price > 0 ? `+${((parseFloat(tgt) - price) / price * 100).toFixed(1)}%` : "Not computed",
    riskRewardNote: direction === "up"
      ? `The potential upside to ${tgt} appears larger than the downside to ${sl} at current levels, but always plan for both outcomes.`
      : direction === "down"
      ? `The risk of further decline to ${sl} currently outweighs the upside potential — capital preservation may be more important than chasing gains.`
      : `The risk and reward are relatively balanced near current levels — a clear direction has not yet emerged.`,
    positionVerySafe: "10%",
    positionModerate: "20%",
    positionAggressive: "30%",
    positionNote: "Never invest more than you can afford to lose. Start small and add on confirmation.",
    bestHoldingTime: input.horizon === "day" ? "Intraday" as const : input.horizon === "swing" ? "1 Month" as const : "3 Months" as const,
    holdingReason: `The ${horizonLabel} horizon aligns with the current technical setup for ${name}.`,
    whyBuy: [
      direction === "up"
        ? `${name} is in a confirmed ${trend} direction with supportive momentum readings.`
        : direction === "down"
        ? `A potential contrarian opportunity if ${name} shows signs of reversal from its current downtrend.`
        : `${name} offers stability — the neutral trend suggests no extreme moves in either direction.`,
      ...(rsiVal !== null && rsiVal < 70 && rsiVal > 30 ? [`RSI at ${rsiVal.toFixed(1)} suggests a balanced risk-reward entry.`] : rsiVal !== null && rsiVal < 30 ? [`RSI at ${rsiVal.toFixed(1)} in oversold territory may present a value entry for patient investors.`] : []),
      ...(mCap ? [`Market cap of ${mCap}.`] : []),
    ].slice(0, 4),
    whatCouldGoWrong: [
      risk === "High" ? `${name} has high volatility — price swings of 3-5% in a single week are possible.` : `Markets can reverse direction quickly based on news or sentiment shifts.`,
      ...(rsiVal !== null && rsiVal > 70 ? [`RSI at ${rsiVal.toFixed(1)} suggests the stock is overbought — a pullback is historically more likely in this zone.`] : []),
      ...(peVal !== null && peVal > 30 ? [`The P/E ratio of ${peVal.toFixed(1)} is elevated — the market has priced in high growth expectations which may not materialize.`] : peVal !== null && peVal < 0 ? [`A negative P/E ratio indicates the company is not currently profitable.`] : []),
      `Unexpected earnings results or macro events could impact ${name}.`,
    ].slice(0, 4),
    support: `~${sl}`,
    supportNote: `Near ${sl}, buyers have stepped in previously, making it a level to watch for potential bounces.`,
    resistance: `~${tgt}`,
    resistanceNote: `Near ${tgt}, sellers have historically appeared, making it a level where upward moves may pause.`,
    riskLevel: risk,
    riskNote: risk === "Low" ? `${name} shows lower volatility than the broader market — price movements tend to be more predictable.` : risk === "High" ? `${name} has elevated volatility — price can move sharply in either direction, requiring wider stop-losses and stronger conviction for positions.` : `${name} shows average volatility — price moves are neither unusually calm nor excessively wild.`,
    marketMood: mood,
    marketMoodNote: mood === "Bullish" ? `The overall weight of evidence suggests more participants are buying ${name} than selling.` : mood === "Bearish" ? `The prevailing sentiment for ${name} is cautious — selling pressure outweighs buying interest.` : `Neither bullish nor bearish forces have clear control over ${name} at this time.`,
    beginnerExplanation: beginnerText,
    isGoodToday: isBuy(recommendation) && confidence >= 65
      ? `${name} appears reasonably positioned for entry based on current data, though timing any purchase carries risk.`
      : isHoldWait(recommendation) || confidence < 65
      ? `The picture for ${name} is not yet clear enough to recommend buying today. Watching for a better-defined setup is the safer choice.`
      : `The data for ${name} suggests caution — waiting for a clearer signal is prudent.`,
    biggestRisk: direction === "up"
      ? `The biggest risk is that the upward momentum fails and ${name} reverses direction unexpectedly. A stop-loss near ${sl} can help limit downside if this happens.`
      : direction === "down"
      ? `The biggest risk is that the decline accelerates. Without a clear support level, losses could exceed expectations.`
      : `The biggest risk is that ${name} breaks out of its current range in either direction unexpectedly — being positioned before the breakout is risky without confirmation.`,
    safestWay: isHoldWait(recommendation)
      ? `The safest approach is to stay in cash and wait for a clearer signal. There is no penalty for waiting.`
      : `The safest approach is to buy a small portion now and add gradually if the price moves in your favor.`,
    waitOrBuyNow: isBuy(recommendation) && confidence >= 65
      ? `Starting a small position with a stop-loss at ${sl} is reasonable for those comfortable with the risk.`
      : `Waiting is the better choice — the data isn't aligned strongly enough to justify entering ${name} today.`,
    smallBudgetPlan: `With a limited budget, consider a small initial purchase and set a reminder to add if ${name} dips toward ${sl}.`,
    largeBudgetPlan: `With a larger budget, divide your total into 3-4 equal parts and invest one part now — deploy the rest if the price moves favorably or dips toward support.`,
    actionToday: isBuy(recommendation) && confidence >= 65
      ? `A small starter position with a stop-loss at ${sl} can be considered for those comfortable with the risk profile.`
      : `No action needed today — waiting for confirmation is the disciplined move.`,
    actionNext3Days: `Watch whether ${name} holds above ${sl} on any dips — if it does, the short-term structure remains intact.`,
    actionNextWeek: `If ${name} approaches ${tgt}, reassess — near resistance, it may be wise to take partial profits or tighten stops.`,
    investmentStyle: input.horizon === "day" ? "Intraday" as const : input.horizon === "swing" ? "Swing" as const : "Positional" as const,
    investmentStyleReason: direction === "up"
      ? `The trending nature of ${name} suits a ${input.horizon} approach, allowing the trend to develop.`
      : `The uncertain direction of ${name} means shorter timeframes carry higher whipsaw risk — a ${input.horizon} approach with patience is appropriate.`,
    dataUsed: ["Live Price", "Trend", "RSI", "MACD", "Moving Averages", "Support/Resistance", ...(mCap !== "n/a" ? ["Market Cap", "P/E Ratio"] : [])],
    aiCannotKnow: ["Tomorrow's unexpected news", "Sudden government decisions or policy changes", "Company-specific events (fraud, management changes)", "Global conflicts or black swan events", "Surprise earnings results"],
    whoCanConsider: [
      direction === "up" ? "Investers comfortable with trend-following strategies" : "Patient investors willing to wait for reversal confirmation",
      "Those who can hold through short-term volatility",
      risk === "Low" ? "Conservative investors seeking stability" : risk === "High" ? "Experienced traders comfortable with volatility" : "Balanced investors with moderate risk tolerance",
    ],
    whoShouldAvoid: [
      "You need the money within a month",
      "You panic when prices drop temporarily",
      "You cannot tolerate short-term losses in your portfolio",
    ],
    worstMistake: `The worst mistake would be investing all your money at once at the current price without a plan for if it drops.`,
    simpleExample: `Split your budget: put 30% now, keep 30% to add if price dips near ${sl}, and hold 40% in cash for opportunities.`,
    ownMoneyView: `If I were investing my own savings in ${name} today, I would not go all-in. I would start with a modest position — roughly 25-30% of what I ultimately want to invest — and observe how the next few trading sessions develop before committing more capital. This approach keeps me in the game without exposing my full portfolio to any single entry point.`,
    proInvestorView: `Technical structure for ${name}: ${trend} bias with RSI at ${rsiVal !== null ? rsiVal.toFixed(1) : "n/a"}${rsiVal !== null ? (rsiVal > 70 ? " (overbought)" : rsiVal < 30 ? " (oversold)" : "") : ""}. ${ema20 !== null && ema50 !== null ? `EMAs show ${trendUp ? "a bullish alignment (20 > 50)" : "a bearish or mixed alignment"}.` : ""} ${macdHist !== null ? `MACD histogram at ${macdHist.toFixed(2)} suggests ${macdHist > 0 ? "expanding" : "contracting"} momentum.` : ""} Key technical levels: support ${sl}, resistance ${tgt}. ${adxVal !== null ? `ADX at ${adxVal.toFixed(1)} indicates ${adxVal >= 25 ? "a trending" : "a ranging"} market.` : ""}`,
    aiVerdict: isBuy(recommendation) && confidence >= 65
      ? `If this were my decision, I would start a small position with a stop-loss at ${sl} and add on confirmation.`
      : isSell(recommendation)
      ? `If I held ${name}, I would evaluate whether the current risk level justifies staying in, with a stop-loss at ${sl}.`
      : `If I were deciding today, I would wait for a clearer entry signal in ${name} before committing capital.`,
    disclaimer: DISCLAIMER,
  }
}
