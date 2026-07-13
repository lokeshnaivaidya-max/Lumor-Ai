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

export const DISCLAIMER = "For research and educational purposes only. Not financial advice."

const SECRET_PATTERN = /(api[_-]?key|secret|token|password|authorization|bearer)/i

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash"
const MODEL_FAST = process.env.GEMINI_MODEL_FAST || "gemini-3.1-flash-lite"

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
  if (/quota|billing|payment|exceeded|RESOURCE_EXHAUSTED|429/i.test(`${msg} ${diagnostic}`)) {
    return new AiBillingError(msg, { cause: err })
  }
  if (/API key|permission|unauthenticated|unauthorized|403|401|API_KEY_INVALID/i.test(`${msg} ${diagnostic}`)) {
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
- CONFIDENCE RULE: if confidenceScore is below 60, do NOT push a Buy. The recommendation must be "Wait" or "Hold", and waitOrBuyNow, ownMoneyView and aiVerdict must clearly advise waiting for a better/confirmed opportunity.
- ONE-LINE DECISION: aiVerdict must be a single honest sentence in first person, e.g. "If I were investing today, I would wait for a small price drop before buying."
- Answer the reader's real questions clearly across the fields: Is it good today? Why? What is the biggest risk? What is the safest way in? Wait or buy now? What to do with a small budget vs a larger budget?

GROUNDING: ${GROUNDING}`
  try {
    const res = await getClient().models.generateContent({
      model: MODEL,
      contents: `Analyze the following instrument for a ${input.horizon} trader. Ground every statement in these figures.\n\n${input.context}`,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.35,
      },
    })
    const parsed = parseJsonResponse<Omit<Analysis, "disclaimer">>(res.text, "instrument analysis")
    return { ...parsed, disclaimer: DISCLAIMER }
  } catch (err) {
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
  const weekLow = findNum(get("52-week range:"))
  const weekHigh = weekLow !== null ? (() => {
    const parts = get("52-week range:").split("–")
    return parts.length > 1 ? findNum(parts[1]) : null
  })() : null

  const rsiVal = findNum(get("RSI(14):"))
  const macdVal = get("MACD:")
  const macdHist = macdVal.includes("hist") ? findNum(macdVal.split("hist")[1]) : null
  const ema20 = findNum(get("EMA 20"))
  const ema50 = findNum(get("EMA 50"))
  const ema200 = findNum(get("EMA 200"))
  const sma50 = findNum(get("SMA 50:"))
  const boll = get("Bollinger")
  const support = findNum(get("Support / Resistance"))
  const resistance = support !== null ? (() => {
    const parts = get("Support / Resistance:").split("/")
    return parts.length > 1 ? findNum(parts[1]) : null
  })() : null
  const trend = get("Trend regime:").split("(")[0]?.trim() || "neutral"
  const mCap = get("Market cap:")
  const pe = get("Trailing P/E:")
  const eps = get("EPS (TTM):")
  const div = get("Dividend yield:")
  const beta = get("Beta:")

  const positive = !priceStr.includes("-") && !get("today").includes("-")
  const rsiSignal = rsiVal !== null ? (rsiVal > 70 ? "overbought" : rsiVal < 30 ? "oversold" : "neutral") : "neutral"

  const isBullishTrend = trend.toLowerCase().includes("bullish")
  const isBearishTrend = trend.toLowerCase().includes("bearish")
  const trendUp = ema20 !== null && ema50 !== null && ema20 > ema50

  let recommendation: Recommendation = "Hold"
  let confidence = 55
  if (isBullishTrend && rsiSignal === "neutral" && trendUp) {
    recommendation = trend.toLowerCase().includes("strong") ? "Strong Buy" : "Buy"
    confidence = 65
  } else if (isBearishTrend || rsiSignal === "overbought") {
    recommendation = trend.toLowerCase().includes("strong") ? "Sell" : "Wait"
    confidence = 55
  } else if (rsiSignal === "oversold" && trendUp) {
    recommendation = "Buy"
    confidence = 60
  }

  let mood: Bias = "Neutral"
  if (isBullishTrend && rsiSignal !== "overbought") mood = "Bullish"
  else if (isBearishTrend || rsiSignal === "overbought") mood = "Bearish"

  let risk: RiskLevel = "Medium"
  if (beta !== "n/a") {
    const b = findNum(beta.split(",")[0])
    if (b !== null) risk = b > 1.5 ? "High" : b < 0.8 ? "Low" : "Medium"
  }

  const entry = price > 0 ? `~${price.toFixed(2)}` : "n/a"
  const tgt = resistance !== null ? resistance.toFixed(2) : price > 0 ? (price * 1.05).toFixed(2) : "n/a"
  const sl = support !== null ? support.toFixed(2) : prevClose !== null ? (prevClose * 0.95).toFixed(2) : "n/a"

  const horizonLabel = input.horizon === "day" ? "1-3 days" : input.horizon === "swing" ? "1-4 weeks" : "1-6 months"

  return {
    recommendation,
    recommendationReason: `${(["Strong Buy", "Buy"] as Recommendation[]).includes(recommendation) ? "The data suggests a favorable setup" : (["Sell", "Strong Sell"] as Recommendation[]).includes(recommendation) ? "The data suggests caution" : "The data is mixed — waiting for clearer signals is reasonable"} based on current technicals and market conditions for ${name}.`,
    confidenceScore: confidence,
    confidenceNote: `This analysis is based on technical indicators and market data. Market conditions can change rapidly.`,
    quickSummary: [
      `${name} is trading at ${priceStr} with a ${trend} trend.`,
      `RSI is ${rsiVal !== null ? rsiVal.toFixed(1) : "n/a"} (${rsiSignal.replace("neutral", "neutral range")}), indicating ${rsiSignal === "overbought" ? "the price may be due for a pause" : rsiSignal === "oversold" ? "the price may be undervalued" : "balanced momentum"}.`,
      `${macdHist !== null ? (macdHist > 0 ? "Momentum is building positively." : "Momentum is slowing down.") : "Momentum data is limited."}`,
    ],
    entry,
    target: tgt,
    stopLoss: sl,
    holdingPeriod: horizonLabel,
    riskReward: sl !== "n/a" && tgt !== "n/a" && price > 0
      ? `1 : ${((parseFloat(tgt) - price) / (price - parseFloat(sl))).toFixed(1)}` : "n/a",
    probabilityOfProfit: isBuy(recommendation) ? 58 : isSell(recommendation) ? 42 : 50,
    probabilityOfLoss: isBuy(recommendation) ? 42 : isSell(recommendation) ? 58 : 50,
    probabilityReason: `Based on the current technical setup and market conditions for ${name}, the estimated probability of a profitable outcome is derived from trend strength, momentum indicators, and support/resistance levels.`,
    bestTimeframe: input.horizon === "day" ? "Intraday" : input.horizon === "swing" ? "Swing (1-4 weeks)" : "Positional (1-6 months)",
    suitableFor: ["Swing", "Long Term"].filter(Boolean) as Analysis["suitableFor"],
    scenarioBest: `If bullish momentum continues, ${name} could test resistance near ${tgt}, representing a potential move of ${price > 0 && resistance !== null ? ((resistance - price) / price * 100).toFixed(1) : "5-8"}%.`,
    scenarioLikely: `The most likely scenario is gradual movement within the current range, with price oscillating between support near ${sl} and resistance near ${tgt} over the ${horizonLabel} horizon.`,
    scenarioWorst: `If support at ${sl} breaks, ${name} could decline further — potentially revisiting lower levels. A loss of ${price > 0 && parseFloat(sl) < price ? ((price - parseFloat(sl)) / price * 100).toFixed(1) : "5-10"}% is possible in this scenario.`,
    maxDownside: sl !== "n/a" && price > 0 ? `-${((price - parseFloat(sl)) / price * 100).toFixed(1)}%` : "-5%",
    expectedUpside: tgt !== "n/a" && price > 0 ? `+${((parseFloat(tgt) - price) / price * 100).toFixed(1)}%` : "+5%",
    riskRewardNote: `The estimated risk-reward ratio suggests the potential upside outweighs the downside risk at current levels.`,
    positionVerySafe: "10%",
    positionModerate: "20%",
    positionAggressive: "30%",
    positionNote: "Never invest more than you can afford to lose. Start small and add on confirmation.",
    bestHoldingTime: input.horizon === "day" ? "Intraday" as const : input.horizon === "swing" ? "1 Month" as const : "3 Months" as const,
    holdingReason: `The ${horizonLabel} horizon aligns with the current technical setup and typical market cycles for this instrument.`,
    whyBuy: [
      `Trend is ${trend} with${trendUp ? "" : "out"} clear momentum confirmation.`,
      ...(rsiVal !== null && rsiVal < 70 && rsiVal > 30 ? [`RSI at ${rsiVal.toFixed(1)} suggests balanced momentum with room to move.`] : []),
      ...(mCap !== "n/a" ? [`Market cap of ${mCap} indicates ${parseFloat(mCap) > 10 ? "a well-established" : "a growing"} company.`] : []),
    ].slice(0, 4),
    whatCouldGoWrong: [
      "Markets can reverse unexpectedly due to macro events or news.",
      ...(rsiVal !== null && rsiVal > 70 ? [`RSI above 70 suggests the stock may be overbought.`] : []),
      ...(pe !== "n/a" && parseFloat(pe) > 30 ? [`P/E of ${pe} is elevated — the market already expects strong growth.`] : []),
      "Earnings misses or guidance changes could impact sentiment.",
      "Broader economic conditions or sector rotation could affect price.",
    ].slice(0, 4),
    support: sl,
    supportNote: `Near ${sl}, buyers have historically stepped in, making it a potential floor.`,
    resistance: tgt,
    resistanceNote: `Near ${tgt}, selling pressure has historically increased, making it a potential ceiling.`,
    riskLevel: risk,
    riskNote: risk === "Low" ? "The stock shows relatively lower volatility compared to the market." : risk === "High" ? "The stock shows higher volatility — price swings can be significant." : "The stock shows average volatility with moderate price swings.",
    marketMood: mood,
    marketMoodNote: mood === "Bullish" ? "Buying pressure is currently dominant based on technical indicators." : mood === "Bearish" ? "Selling pressure is currently dominant based on technical indicators." : "Neither buyers nor sellers are in clear control.",
    beginnerExplanation: `${name} is currently trading at ${priceStr}. Think of it like a popular product — when many people want to buy, the price tends to go up. Right now, the trend is ${trend.toLowerCase()}, which means the price has been ${trend.toLowerCase() === "bearish" ? "moving down" : "moving up"} recently. Before investing, consider spreading your purchase over time instead of buying all at once — this reduces the risk of buying at a high point. Remember, all investments carry risk and prices can go down as well as up.`,
    isGoodToday: confidence >= 60 ? `${name} looks reasonably positioned based on current data, but consider waiting for a better entry if you are risk-averse.` : `The setup for ${name} is not yet clear — consider waiting for a better entry point.`,
    biggestRisk: `The biggest risk is that the price could drop below support at ${sl}, which might lead to further declines. No one can predict exactly where the bottom is, so it's important to only invest what you can afford to hold during temporary downturns.`,
    safestWay: `The safest approach is to buy in smaller amounts over time (like Rs.5,000 or $50 every week) instead of all at once — this way you don't risk buying at the highest price.`,
    waitOrBuyNow: confidence >= 60 && isBuy(recommendation) ? `You can consider starting a small position now, but keep some cash ready in case the price dips.` : `It's better to wait for a clearer signal — the data isn't pointing strongly in one direction yet.`,
    smallBudgetPlan: `With a small budget, buy a small amount now and add the same amount if the price drops near ${sl}.`,
    largeBudgetPlan: `With a larger budget, spread your purchase across 3-4 smaller buys over the next few weeks to average your entry price.`,
    actionToday: confidence >= 60 && isBuy(recommendation) ? `Consider a small initial position if you haven't entered yet.` : `Wait — no urgent action needed today.`,
    actionNext3Days: `Watch whether ${name} holds above ${sl} — if it does, the setup remains valid.`,
    actionNextWeek: `If the price approaches ${tgt} with strong volume, consider taking partial profits.`,
    investmentStyle: input.horizon === "day" ? "Intraday" as const : input.horizon === "swing" ? "Swing" as const : "Positional" as const,
    investmentStyleReason: `The current technical setup and market conditions are best suited for a ${input.horizon} approach.`,
    dataUsed: ["Live Price", "Trend", "RSI", "MACD", "Moving Averages", "Support/Resistance", ...(mCap !== "n/a" ? ["Market Cap", "P/E Ratio"] : [])],
    aiCannotKnow: ["Tomorrow's unexpected news", "Sudden government decisions or policy changes", "Company-specific events (fraud, management changes)", "Global conflicts or black swan events", "Surprise earnings results"],
    whoCanConsider: ["Long-term investors who can hold through volatility", "Investors comfortable with market fluctuations"],
    whoShouldAvoid: ["You need the money within a month", "You panic when prices drop temporarily", "You cannot tolerate short-term losses in your portfolio"],
    worstMistake: `The worst mistake would be investing all your money at once at the current price without a plan for if it drops.`,
    simpleExample: `If your budget is $1,000: buy $300 today, keep $300 to add if price dips near ${sl}, and hold $400 in cash for opportunities.`,
    ownMoneyView: `If I were putting my own money into ${name} today, I would start with a small position — about a third of what I plan to invest total — and wait to see how the next few days play out before adding more. This way I avoid the risk of buying at the wrong price.`,
    proInvestorView: `From a technical perspective, ${name} shows a ${trend} trend with RSI at ${rsiVal !== null ? rsiVal.toFixed(1) : "n/a"}${rsiVal !== null ? (rsiVal > 70 ? " (overbought territory — caution warranted)" : rsiVal < 30 ? " (oversold — potential bounce opportunity)" : " (neutral range)") : ""}.${ema20 !== null && ema50 !== null ? ` The 20-day EMA at ${ema20.toFixed(2)} and 50-day EMA at ${ema50.toFixed(2)} show ${trendUp ? "positive" : "mixed"} alignment.` : ""} Volume and momentum readings ${macdHist !== null ? (macdHist > 0 ? "confirm the current trend direction." : "suggest the trend may be losing steam.") : "are inconclusive."} Key levels to watch: support at ${sl}, resistance at ${tgt}. A break above ${tgt} with volume would be bullish, while a break below ${sl} would warrant reducing exposure.`,
    aiVerdict: confidence >= 60 && isBuy(recommendation) ? `If I were investing today, I would start a small position in ${name} with a disciplined stop-loss at ${sl}.` : `If I were investing today, I would wait for a clearer signal before entering ${name}.`,
    disclaimer: DISCLAIMER,
  }
}
