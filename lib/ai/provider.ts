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

// Latest officially supported Gemini 3 Flash Preview model (Developer API).
const MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview"
const MODEL_FAST = process.env.GEMINI_MODEL_FAST || "gemini-3-flash-preview"

export class AiConfigError extends Error {}
export class AiBillingError extends Error {}

let client: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY
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

function classify(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err)
  if (/quota|billing|payment|exceeded|RESOURCE_EXHAUSTED|429/i.test(msg)) {
    return new AiBillingError(msg)
  }
  if (/API key|permission|unauthenticated|unauthorized|403|401|API_KEY_INVALID/i.test(msg)) {
    return new AiConfigError(msg)
  }
  return err instanceof Error ? err : new Error(msg)
}

/* --------------------------------- Types --------------------------------- */

export type Bias = "Bullish" | "Bearish" | "Neutral"
export type SentimentLabel = "Positive" | "Negative" | "Neutral"
export type RiskLevel = "Low" | "Medium" | "High"

export type Analysis = {
  executiveSummary: string
  bullCase: string[]
  bearCase: string[]
  technicalAnalysis: string
  fundamentalAnalysis: string
  riskAnalysis: string
  support: string
  resistance: string
  swingView: string
  longTermView: string
  sentiment: SentimentLabel
  bias: Bias
  riskLevel: RiskLevel
  confidenceScore: number
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
    executiveSummary: { type: Type.STRING, description: "2-3 sentence high-level takeaway grounded in the data." },
    bullCase: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 bullish points, each citing a concrete data point." },
    bearCase: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 bearish points, each citing a concrete data point." },
    technicalAnalysis: { type: Type.STRING, description: "Trend, momentum (RSI/MACD/StochRSI/ADX), moving-average structure, VWAP. Cite the numbers." },
    fundamentalAnalysis: { type: Type.STRING, description: "Valuation (P/E, EPS), market cap, dividend, sector. If none apply, say so and focus on macro." },
    riskAnalysis: { type: Type.STRING, description: "Specific downside risks and negative factors, tied to data/headlines." },
    support: { type: Type.STRING, description: "Support level value + brief reasoning." },
    resistance: { type: Type.STRING, description: "Resistance level value + brief reasoning." },
    swingView: { type: Type.STRING, description: "Weeks-horizon view with trigger levels." },
    longTermView: { type: Type.STRING, description: "Months+ horizon view with reasoning." },
    sentiment: { type: Type.STRING, enum: ["Positive", "Negative", "Neutral"] },
    bias: { type: Type.STRING, enum: ["Bullish", "Bearish", "Neutral"] },
    riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
    confidenceScore: { type: Type.NUMBER, description: "Integer 0-100 confidence in the stated bias." },
  },
  required: [
    "executiveSummary",
    "bullCase",
    "bearCase",
    "technicalAnalysis",
    "fundamentalAnalysis",
    "riskAnalysis",
    "support",
    "resistance",
    "swingView",
    "longTermView",
    "sentiment",
    "bias",
    "riskLevel",
    "confidenceScore",
  ],
  propertyOrdering: [
    "executiveSummary",
    "bullCase",
    "bearCase",
    "technicalAnalysis",
    "fundamentalAnalysis",
    "riskAnalysis",
    "support",
    "resistance",
    "swingView",
    "longTermView",
    "sentiment",
    "bias",
    "riskLevel",
    "confidenceScore",
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
  const system = `You are Lumora, an elite buy-side market intelligence analyst producing institutional-grade, quantitative analysis. ${GROUNDING}`
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
    const parsed = JSON.parse((res.text ?? "").trim()) as Omit<Analysis, "disclaimer">
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
    return JSON.parse((res.text ?? "").trim()) as NewsSentiment
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
      return (res.text ?? "").trim()
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
    const parsed = JSON.parse((res.text ?? "").trim()) as Omit<InvestmentResearch, "disclaimer">
    return { ...parsed, disclaimer: DISCLAIMER }
  } catch (err) {
    throw classify(err)
  }
}
