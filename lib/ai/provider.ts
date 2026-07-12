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

const SECRET_PATTERN = /(AIza[\w-]{20,}|(?:api[_-]?key|authorization|token)\s*[=:]\s*["']?[^\s,"'}]+)/gi

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
  bestTimeframe: string
  suitableFor: string[]
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
  // 11. Pro investor view
  proInvestorView: string
  // 12. AI verdict
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
    bestTimeframe: { type: Type.STRING, description: "The single best timeframe for this idea in plain words, e.g. 'Swing (a few weeks)'." },
    suitableFor: {
      type: Type.ARRAY,
      items: { type: Type.STRING, enum: ["Intraday", "Swing", "Long Term", "Dividend Investors", "Beginners", "Experienced Traders"] },
      description: "Who this idea suits best. Pick only the ones that genuinely fit the data.",
    },
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
      description: "Max 120 words. Explain like talking to a family member who never studied finance. Very short sentences. No technical words. Warm, honest, like a trusted elder brother.",
    },
    proInvestorView: {
      type: Type.STRING,
      description: "Technical section for advanced users. Cover trend, momentum, RSI, MACD, ADX, volume, moving averages, and institutional view, citing the numbers.",
    },
    aiVerdict: { type: Type.STRING, description: "ONE honest, simple sentence — what you would do if it were your own money." },
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
    "bestTimeframe",
    "suitableFor",
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
    "bestTimeframe",
    "suitableFor",
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
- "proInvestorView" is the ONLY field where you may use full technical terms and numbers for advanced users.

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
