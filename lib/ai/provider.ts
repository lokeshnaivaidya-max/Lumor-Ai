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
export type Recommendation = "Strong Buy" | "Buy" | "Buy on Dip" | "Accumulate" | "Hold" | "Neutral" | "Wait for Confirmation" | "Reduce Exposure" | "Book Partial Profit" | "Avoid Fresh Entries" | "Strong Sell"

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
  const system = `You are Lumora, an institutional-grade market analyst. Your analysis must read like a Bloomberg terminal or a top-tier sell-side note — concise, authoritative, and entirely unique to each instrument. You never write templates. Every paragraph is written fresh based on what the data actually shows.

CORE PHILOSOPHY:
- Think like an experienced analyst: identify the dominant market structure first, then reference only the indicators that matter. Do NOT list indicators one by one. Do NOT start sentences with "The RSI..." or "The MACD...".
- Your reasoning must answer: What is happening? Why? What is the probability it continues? What invalidates the view? Where to enter, exit, and what risks exist?
- Use institutional language naturally: accumulation, distribution, liquidity zones, breakout confirmation, false breakout, trend exhaustion, momentum fading, consolidation, profit booking, buyers defending support.
- Never repeat sentence structures. Every analysis must feel like it was written fresh for this specific instrument.
- If indicators disagree, say so explicitly and reduce confidence. Never force a decisive view when the data is conflicting.
- If insufficient data exists to form a high-confidence view, state: "There isn't sufficient confirmation to produce a high-confidence recommendation."

ASSET-CLASS TAILORING:
- Stocks: Focus on trend structure, earnings context, sector dynamics, and news catalysts.
- Crypto: Prioritize momentum, volatility regime, BTC dominance, and social/news sentiment. Structure matters less.
- Indices: Discuss breadth, sector rotation, macro trend, and institutional flows.
- Forex: Macro backdrop, interest rate differentials, trend clarity, and support/resistance at key psychological levels.

CONFIDENCE SCORING FRAMEWORK (compute dynamically per instrument):
- Start at 50
- Trend alignment: +8 if price > EMA20 > EMA50 > EMA200 (fully aligned bullish), +4 if mild bullish, -4 if bearish
- RSI zone: +4 if 40-60 (neutral/healthy range), -4 if >70 (overbought/overextended) or <30 (oversold)
- MACD: +4 if histogram positive and rising, -3 if negative/fading
- ADX trend strength: +4 if >=25 (strong trend), +2 if >=20, -2 if <15 (weak/no trend)
- Volume conviction: +3 if >1.5x average, -2 if <0.5x average (low participation)
- Beta stability (stocks only): +2 if 0.8-1.3, -3 if >2
- P/E reasonableness (stocks only): +2 if positive and <=25, -2 if >50 or negative
- News sentiment: +3 if positive headlines exist, -3 if negative headlines exist
- Indicator agreement bonus: +5 if trend, momentum, volume, and volatility all point in the same direction
- Indicator conflict penalty: -5 if RSI and price diverge, or if trend direction conflicts with momentum
- Clamp final score between 10 and 95
- If score is 40-59, the verdict should be cautious: "Wait for Confirmation", "Neutral", or "Hold"
- If score is below 40, the verdict should be defensive: "Reduce Exposure", "Avoid Fresh Entries", or "Book Partial Profit"

RECOMMENDATION VERDICT MAPPING (use the most appropriate, not just Buy/Hold/Sell):
- 85-95: Strong Buy
- 70-84: Buy
- 60-69: Buy on Dip or Accumulate
- 50-59: Hold or Neutral
- 40-49: Wait for Confirmation
- 30-39: Reduce Exposure or Book Partial Profit
- 20-29: Avoid Fresh Entries
- Below 20: Strong Sell

ENTRY, TARGET, STOP LOSS RULES:
- entry: Derive from current price relative to support, EMAs, or swing low -- Explain WHY that level was chosen.
- target: Derive from resistance, Fibonacci extension, or prior swing high. Must be realistic given ATR and recent volatility.
- stopLoss: Derive from support, Fibonacci retracement, ATR-based volatility stop, or recent swing low. Explain invalidation logic.
- riskReward: Calculate the actual ratio from target and stop loss. Never default to 1:2. Compute it.

NEWS INTEGRATION:
- If positive news exists: increase confidence, reference the specific headline, and explain why the news strengthens the thesis.
- If negative news contradicts the technical setup: mention the conflict explicitly. Do not ignore bearish news just because the chart looks good.
- If no news: state that the move is technically driven without a clear catalyst.

WRITING STYLE:
- Each paragraph must add new information. Never repeat the same point.
- Avoid listing indicators. Instead, describe what the market is doing, then note which indicators support that observation.
- Use varied sentence openings. Never start two consecutive paragraphs the same way.
- Sound like an analyst who has been covering this specific instrument for years.

GROUNDING: ${GROUNDING}`
  try {
    const userPrompt = `Analyze this ${input.name} for a ${input.horizon} trader. This is NOT a generic instrument — tailor every sentence specifically to the data below. Each analysis must read like a fresh institutional note, never a template.

${input.context}

Respond with ONLY valid JSON. No markdown, no code blocks, no explanation outside the JSON. The JSON must follow this exact structure: {"recommendation":"Strong Buy"|"Buy"|"Buy on Dip"|"Accumulate"|"Hold"|"Neutral"|"Wait for Confirmation"|"Reduce Exposure"|"Book Partial Profit"|"Avoid Fresh Entries"|"Strong Sell","recommendationReason":"explain the market structure driving this instrument and the specific data points that support your thesis -- reference actual values, never generic phrases","confidenceScore":0-100,"confidenceNote":"explain in one sentence what the score reflects about this specific instrument setup","quickSummary":["unique observation about trend/momentum structure","unique observation about volume or volatility behavior","unique observation about support/resistance or news catalysts"],"entry":"derived from current price relative to nearest support, EMA, or swing low -- explain why this level","target":"derived from resistance, Fibonacci extension, or prior swing high -- must be realistic given ATR and recent volatility","stopLoss":"derived from support break level, Fibonacci retracement, or ATR-based volatility stop -- explain invalidation logic","holdingPeriod":"string","riskReward":"calculated as (target-entry)/(entry-stop) expressed as 1:X -- compute from actual numbers","probabilityOfProfit":0-100,"probabilityOfLoss":0-100,"probabilityReason":"explain using trend strength, indicator agreement, volume conviction, and news sentiment -- not just one indicator","bestTimeframe":"string","suitableFor":["string","string","string"],"scenarioBest":"describe the conditions that would drive the price to target and what percentage gain that represents","scenarioLikely":"describe the most probable outcome given current structure and percentage range","scenarioWorst":"describe what breaks the thesis and what percentage loss that represents","maxDownside":"percentage calculated from stop loss relative to entry","expectedUpside":"percentage calculated from target relative to entry","riskRewardNote":"one sentence explaining whether this specific risk-reward is worth taking for THIS instrument right now","positionVerySafe":"percent of capital","positionModerate":"percent of capital","positionAggressive":"percent of capital NEVER above 30%","positionNote":"position sizing advice specific to this instruments volatility and risk level","bestHoldingTime":"Intraday"|"1 Week"|"1 Month"|"3 Months"|"Long Term","holdingReason":"explain why this timeframe matches the current trend phase and volatility profile","whyBuy":["specific catalyst or structural reason","technical setup confirmation point","risk-reward asymmetry observation","institutional flow or sentiment angle"],"whatCouldGoWrong":["support break scenario","headline or macro risk","momentum failure scenario","liquidity or volatility risk"],"support":"from actual nearest support level in the data","supportNote":"describe why buyers have defended this level and what happens if it breaks","resistance":"from actual nearest resistance level in the data","resistanceNote":"describe what selling pressure exists at this level and what breakout confirmation looks like","riskLevel":"Low"|"Medium"|"High","riskNote":"explain the specific risk factors using actual Beta, ATR, volatility, and market conditions","marketMood":"Bullish"|"Bearish"|"Neutral","marketMoodNote":"describe the tone of price action, volume participation, and any institutional flow patterns","beginnerExplanation":"max 60 words describing what the instrument is doing right now in plain language -- focus on story not indicators","isGoodToday":"clear yes/no/partly based on entry proximity to support and confidenceScore","biggestRisk":"the single most important thing that could go wrong -- specific to this instruments current setup","safestWay":"the lowest-risk approach to participate given current volatility and setup quality","waitOrBuyNow":"clear actionable recommendation based on confidenceScore and whether entry is at a favorable level","smallBudgetPlan":"actionable entry plan in the instruments currency with specific price levels","largeBudgetPlan":"actionable entry plan in the instruments currency with specific price levels and scaling strategy","actionToday":"specific action based on where price sits relative to support and resistance right now","actionNext3Days":"specific levels to watch that would confirm or invalidate the thesis","actionNextWeek":"specific levels to watch that would confirm or invalidate the thesis","investmentStyle":"Intraday"|"Swing"|"Positional"|"Long Term","investmentStyleReason":"explain using ATR-based volatility, trend duration, and current market phase","dataUsed":["specific indicator or metric used","specific indicator or metric used","specific indicator or metric used"],"aiCannotKnow":["unknown future catalysts","company insider intentions","unannounced macro events","institutional order flow details","retail sentiment extremes"],"whoCanConsider":["trader profile suited to this risk","trader profile suited to this timeframe","trader profile suited to this setup"],"whoShouldAvoid":["trader profile this setup does not fit","trader profile this risk level excludes","trader profile this timeframe does not suit"],"worstMistake":"the single most common error traders make with this specific setup","simpleExample":"concrete money allocation example in the instruments currency","ownMoneyView":"2-3 natural lines in first person explaining honestly whether you would put your own capital here and why","proInvestorView":"full technical summary describing market structure, key levels, order flow interpretation, and institutional-grade reasoning -- use proper technical terms freely here","aiVerdict":"single honest sentence in first person grounded in this instruments actual data and setup quality"}`

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
  const system = `You are a financial news sentiment -- not invent headlines or facts.`
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


