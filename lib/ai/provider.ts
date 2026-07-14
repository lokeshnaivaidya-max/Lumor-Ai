// Lumora AI service — provider-agnostic interface backed by Groq.
//
// The rest of the application imports ONLY the functions below and never learns
// which model provider is in use. Swapping providers means editing this file
// alone. All calls run server-side; the API key is never exposed to the browser.
//
// Hard rules baked into every prompt:
//   - Analyze ONLY the real data passed in (Yahoo Finance quotes, computed
//     technical indicators, real news headlines).
//   - Never hallucinate prices, financial figures, or news.

export const DISCLAIMER = "For research and educational purposes only. Not financial advice."

const SECRET_PATTERN = /(api[_-]?key|secret|token|password|authorization|bearer)/i

const BASE_URL = "https://api.groq.com/openai/v1/chat/completions"
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
const MODEL_FAST = process.env.GROQ_MODEL_FAST || "llama-3.3-70b-versatile"

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

function getApiKey(): string {
  const key = process.env.GROQ_API_KEY?.trim()
  if (!key) throw new AiConfigError("GROQ_API_KEY is not configured.")
  return key
}

const FALLBACK_MODEL = "deepseek-r1-distill-llama-70b"

const GROQ_PERMANENT_CODES = new Set([401, 403])

async function groqChat(
  model: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts?: { temperature?: number; responseFormat?: { type: "json_object" }; timeout?: number },
): Promise<string> {
  const key = getApiKey()
  const modelsToTry = model !== FALLBACK_MODEL ? [model, FALLBACK_MODEL] : [model]
  let lastError: unknown

  for (const currentModel of modelsToTry) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), opts?.timeout ?? 30000)

    try {
      console.log(`[Groq] Request started, Model: ${currentModel}`)
      const res = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
          temperature: opts?.temperature ?? 0.4,
          ...(opts?.responseFormat ? { response_format: opts.responseFormat } : {}),
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const body = await res.text()
        if (GROQ_PERMANENT_CODES.has(res.status)) {
          throw new AiConfigError(`Groq auth error (${res.status}): ${body}`)
        }
        if (res.status === 429) {
          throw new AiBillingError(`Groq quota exceeded: ${body}`)
        }
        throw new Error(`Groq API error (${res.status}): ${body}`)
      }

      const json = await res.json() as { choices: { message: { content: string } }[]; error?: { message: string } }
      if (json.error) throw new Error(json.error.message)
      if (!json.choices?.[0]?.message?.content) throw new Error("Groq returned an empty response.")
      console.log(`[Groq] Success, Model: ${currentModel}`)
      return json.choices[0].message.content
    } catch (err) {
      lastError = err
      if (GROQ_PERMANENT_CODES.has((err as { status?: number })?.status ?? 0)) {
        console.error(`[Groq] Error:`, (err as Error).message)
        throw err
      }
      if (currentModel === modelsToTry[modelsToTry.length - 1]) {
        console.error(`[Groq] Error:`, (err as Error).message)
        throw err
      }
      console.log(`[Groq] Model ${currentModel} failed (${(err as Error).message}), trying fallback...`)
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError instanceof Error ? lastError : new Error("All Groq models failed.")
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

export async function* streamChat(
  messages: ChatMessageInput[],
  opts?: { model?: string; system?: string },
): AsyncGenerator<ChatStreamEvent> {
  const key = getApiKey()
  const model = opts?.model || MODEL
  const groqMessages: { role: "system" | "user" | "assistant"; content: string }[] = []
  if (opts?.system || CHAT_SYSTEM) {
    groqMessages.push({ role: "system", content: opts?.system || CHAT_SYSTEM })
  }
  for (const m of messages) {
    groqMessages.push({ role: m.role === "assistant" || m.role === "model" ? "assistant" : "user", content: m.content })
  }

  let promptTokens = 0
  let completionTokens = 0
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages: groqMessages, temperature: 0.4, stream: true }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const body = await res.text()
      if (res.status === 429) throw new AiBillingError(`Groq quota exceeded: ${body}`)
      if (res.status === 401 || res.status === 403) throw new AiConfigError(`Groq auth error (${res.status}): ${body}`)
      throw new Error(`Groq API error (${res.status}): ${body}`)
    }

    const reader = res.body?.getReader()
    if (!reader) throw new Error("Groq returned no response body for streaming.")

    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith("data: ")) continue
        const data = trimmed.slice(6)
        if (data === "[DONE]") break

        try {
          const parsed = JSON.parse(data) as {
            choices?: { delta?: { content?: string }; finish_reason?: string }[]
            usage?: { prompt_tokens?: number; completion_tokens?: number }
          }
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) yield { type: "delta", text: delta }
          if (parsed.usage) {
            promptTokens = parsed.usage.prompt_tokens ?? promptTokens
            completionTokens = parsed.usage.completion_tokens ?? completionTokens
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    clearTimeout(timeout)
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
  if (/\bquota\b|\bbilling\b|\bpayment\b|\bexceeded\b|\bRESOURCE_EXHAUSTED\b|\b429\b/i.test(combined)) {
    return new AiBillingError(msg, { cause: err })
  }
  if (/\bapi[_-]?key\b|\bpermission\b|\bunauthenticated\b|\bunauthorized\b|\b403\b|\b401\b|\bAPI_KEY_INVALID\b|\bnot configured\b/i.test(combined)) {
    return new AiConfigError(msg, { cause: err })
  }
  return err instanceof Error ? err : new Error(msg, { cause: err })
}

function parseJsonResponse<T>(text: string | undefined, operation: string): T {
  const value = text?.trim()
  if (!value) throw new Error(`AI returned an empty response for ${operation}.`)
  try {
    return JSON.parse(value) as T
  } catch (cause) {
    throw new Error(`AI returned invalid JSON for ${operation}.`, { cause })
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

const GROUNDING = `You must analyze ONLY the real data provided in the prompt (Yahoo Finance quotes, computed technical indicators, and real news headlines). NEVER invent, estimate, or hallucinate prices, financial figures, or news events. If a value is marked "n/a", state that the data is unavailable rather than guessing. Every conclusion must reference specific data points from the prompt.`

/* ------------------------------- Functions ------------------------------- */

/** Deep, structured instrument analysis grounded strictly in the supplied data. */
export async function generateAnalysis(input: { name: string; horizon: string; context: string }): Promise<Analysis> {
  const system = `You are Lumora, a senior equity research analyst. Your analysis must feel like a real institutional note — grounded in the specific numbers provided, never generic.

MANDATORY RULES:
1. Read EVERY data point in the context: price, change%, volume vs avg, market cap, P/E, EPS, Beta, trend regime, ADX, RSI, MACD, EMAs, Bollinger, ATR, support/resistance, Fibonacci, and every headline.
2. Every conclusion must reference an actual value from the data. Never write a sentence that could apply to any stock.
3. If a stock has RSI 72 and ADX 28, say so and explain what that combination means. If another stock has RSI 45 and ADX 12, say something completely different.
4. The confidenceScore must be uniquely calculated per stock: start from 50, then adjust up/down based on trend alignment (+8 if bullish + EMAs aligned), RSI zone (+4 if 40-60, -4 if >70 or <30), MACD (+4 if positive), ADX (+4 if >25), volume vs avg (+3 if >1.5x), support/resistance proximity, P/E reasonableness, and Beta stability. No two stocks should get the same score unless their data is truly identical.
5. recommendationReason must explain the specific data-driven case for THIS stock, referencing actual indicator values.
6. entry must be derived from current price relative to support/resistance/EMAs. target from resistance or Fibonacci levels. stopLoss from support or ATR. Never make up a price.
7. quickSummary must contain 3 unique data points about THIS stock (e.g. actual RSI value, actual volume pattern, actual trend strength).
8. Beginner fields (beginnerExplanation, isGoodToday, biggestRisk, safestWay, waitOrBuyNow, smallBudgetPlan, largeBudgetPlan, actionToday, actionNext3Days, actionNextWeek, ownMoneyView) must reference the actual numbers but explain them plainly — e.g. "The RSI is 72, which means many people have already bought recently, so the price might pause a bit."
9. "proInvestorView" is the ONLY field where raw technical terms are used. Every other field must explain any technical concept in brackets.
10. If the context says "No recent headlines available." explicitly state that there are no major news catalysts driving this stock right now. If news exists, reference actual headlines and explain their sentiment impact.
11. NEVER use the same reasoning for different stocks. A tech stock with high P/E, strong momentum, and positive news is different from a bank stock with low P/E, neutral RSI, and no news.

DATA-DRIVEN CONFIDENCE SCORING (use this framework):
- Start at 50
- Trend: +8 if bullish with EMA alignment (price > EMA20 > EMA50 > EMA200), +4 if mildly bullish, -4 if bearish
- RSI: +4 if 40-60 (healthy), -4 if >70 (overbought) or <30 (oversold)
- MACD histogram: +4 if positive and rising, -3 if negative
- ADX: +4 if >=25 (strong trend), +2 if >=20, -2 if <15 (weak trend)
- Volume: +3 if >1.5x average, -2 if <0.5x average
- Beta: +2 if 0.8-1.3 (stable), -3 if >2 (volatile)
- P/E: +2 if positive and <=25 (reasonable), -2 if >50 or negative
- Clamp final score between 10 and 95
- If score < 60, recommendation MUST be "Wait" or "Hold"

GROUNDING: ${GROUNDING}`
  try {
    const userPrompt = `Analyze the following instrument for a ${input.horizon} trader. Use the specific values below — every statement must reference actual data points. Do NOT write generic analysis. Each stock must get a unique, data-grounded treatment.

${input.context}

Respond with ONLY valid JSON. No markdown, no code blocks, no explanation outside the JSON. The JSON must follow this exact structure: {"recommendation":"Strong Buy"|"Buy"|"Hold"|"Wait"|"Sell"|"Strong Sell","recommendationReason":"explain which specific indicators drove this decision and why","confidenceScore":0-100,"confidenceNote":"what the confidence number means for THIS stock","quickSummary":["string","string","string"],"entry":"derived from price vs support/EMA levels","target":"derived from resistance or Fibonacci levels","stopLoss":"derived from support or ATR","holdingPeriod":"string","riskReward":"e.g. 1:2.5","probabilityOfProfit":0-100,"probabilityOfLoss":0-100,"probabilityReason":"explain using actual trend strength, ADX, and RSI values","bestTimeframe":"string","suitableFor":["string","string","string"],"scenarioBest":"with actual target price and percentage","scenarioLikely":"with actual price range and percentage","scenarioWorst":"with actual stop loss level and percentage","maxDownside":"e.g. -4% derived from stop loss vs entry","expectedUpside":"e.g. +10% derived from target vs entry","riskRewardNote":"plain English explaining the risk-reward for THIS stock","positionVerySafe":"percent of capital","positionModerate":"percent of capital","positionAggressive":"percent of capital NEVER above 30%","positionNote":"simple position sizing advice","bestHoldingTime":"Intraday"|"1 Week"|"1 Month"|"3 Months"|"Long Term","holdingReason":"explain why this timeframe fits THIS stock data","whyBuy":["string","string","string","string"],"whatCouldGoWrong":["string","string","string","string"],"support":"from actual support level in the data","supportNote":"plain English reference the actual price level","resistance":"from actual resistance level in the data","resistanceNote":"plain English reference the actual price level","riskLevel":"Low"|"Medium"|"High","riskNote":"explain using actual Beta ATR and volatility data","marketMood":"Bullish"|"Bearish"|"Neutral","marketMoodNote":"reference actual trend volume and price action","beginnerExplanation":"max 60 words plain English reference 2-3 actual data points and explain them simply","isGoodToday":"clear yes/no/partly based on actual data not generic","biggestRisk":"explain the single biggest risk using actual data","safestWay":"plain advice based on actual volatility and setup","waitOrBuyNow":"clear recommendation based on confidenceScore and data","smallBudgetPlan":"actionable plan in the instrument currency","largeBudgetPlan":"actionable plan in the instrument currency","actionToday":"specific action for today based on actual price levels","actionNext3Days":"specific levels to watch from the data","actionNextWeek":"specific levels to watch from the data","investmentStyle":"Intraday"|"Swing"|"Positional"|"Long Term","investmentStyleReason":"explain using ATR trend strength and volatility","dataUsed":["string","string","string"],"aiCannotKnow":["string","string","string","string","string"],"whoCanConsider":["string","string","string"],"whoShouldAvoid":["string","string","string"],"worstMistake":"specific to THIS stock setup","simpleExample":"concrete money split in the instrument currency","ownMoneyView":"2-3 natural lines in first person data-grounded","proInvestorView":"full technical summary with ALL indicator values from the data","aiVerdict":"single honest sentence in first person grounded in this stock actual data"}`

    const text = await groqChat(MODEL, [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ], { temperature: 0.35, responseFormat: { type: "json_object" }, timeout: 25000 })

    const parsed = parseJsonResponse<Omit<Analysis, "disclaimer">>(text, "instrument analysis")
    return { ...parsed, disclaimer: DISCLAIMER }
  } catch (err) {
    console.error("[Provider] generateAnalysis error:", (err as Error).name, (err as Error).message)
    throw classify(err)
  }
}

/** Classify real news headlines by investor-impact sentiment. */
export async function generateNewsSentiment(input: { name: string; headlines: string[] }): Promise<NewsSentiment> {
  const list = input.headlines.map((h, i) => `${i}. "${h}"`).join("\n")
  const system = `You are a financial news sentiment analyst. Classify each headline's likely impact on ${input.name} from an investor's perspective as "positive", "negative", or "neutral", based ONLY on the headline text. Do not invent headlines or facts.`
  try {
    const text = await groqChat(MODEL_FAST, [
      { role: "system", content: system },
      { role: "user", content: `Headlines:\n${list}\n\nReturn JSON with "overall" ("positive"/"negative"/"neutral"), "summary" (string), and "items" (array of {index, sentiment, reason}).` },
    ], { temperature: 0.2, responseFormat: { type: "json_object" } })
    return parseJsonResponse<NewsSentiment>(text, "news sentiment")
  } catch (err) {
    throw classify(err)
  }
}

/** Concise market-wide brief from a set of real index/instrument quotes. */
export async function generateMarketSummary(input: { region: string; movers: string }): Promise<string> {
  const system = `You are Lumora's markets desk. Write a single tight paragraph (max 3 sentences) summarizing the current market tone for the ${input.region} region. ${GROUNDING} Do not use markdown headers or bullet points.`
  return cached(`summary:${input.region}:${input.movers}`, 60_000, async () => {
    try {
      const text = await groqChat(MODEL_FAST, [
        { role: "system", content: system },
        { role: "user", content: `Current snapshot of key instruments (symbol: price, % change):\n${input.movers}\n\nSummarize the market tone in plain prose.` },
      ], { temperature: 0.4 })
      const summary = text.trim()
      if (!summary) throw new Error("Groq returned an empty response for market summary.")
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
    const text = await groqChat(input.model || MODEL_FAST, [
      { role: "system", content: input.system },
      { role: "user", content: input.prompt },
    ], { temperature: input.temperature ?? 0.4 })
    if (!text.trim()) throw new Error("Empty AI response")
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
    const text = await groqChat(MODEL, [
      { role: "system", content: system },
      { role: "user", content: `Produce an investment research note for the following instrument. Ground every statement in these figures and headlines.\n\n${input.context}\n\nRespond with valid JSON.` },
    ], { temperature: 0.4, responseFormat: { type: "json_object" } })
    const parsed = parseJsonResponse<Omit<InvestmentResearch, "disclaimer">>(text, "investment research")
    return { ...parsed, disclaimer: DISCLAIMER }
  } catch (err) {
    throw classify(err)
  }
}


