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
export type Recommendation = "Strong Buy" | "Buy" | "Buy on Dip" | "Accumulate" | "Hold" | "Neutral" | "Wait for Confirmation" | "Reduce Exposure" | "Book Partial Profit" | "Avoid Fresh Entries" | "Strong Sell" | "Strong Buy CE" | "Buy CE" | "Buy PE" | "Strong Buy PE" | "No Trade"

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
  // Option-specific fields (only populated in options mode)
  entryAggressive?: string
  entryConservative?: string
  entryBreakout?: string
  target2?: string
  target3?: string
  bullishScenario?: string
  neutralScenario?: string
  bearishScenario?: string
  tradeQuality?: string
  optionRisk?: string
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

/* ---------------------------- Options Detection --------------------------- */

type OptionDetails = {
  underlying: string
  strike: string
  expiry: string
  type: "CALL" | "PUT"
  raw: string
}

const INDEX_NAMES = /\b(NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY|SENSEX|BANKEX|NIFTYMIDCAP)\b/i

function parseOptionName(name: string): OptionDetails | null {
  // Pattern 1: "NIFTY JUL 24000 CE" — spaced format
  const spaced = name.match(/^(.+?)\s+([A-Z]{3}\d*)\s+([\d,.]+)\s+(CE|PE)\s*$/i)
  if (spaced) {
    const [, underlying, expiry, strikeStr, type] = spaced
    const strike = strikeStr.replace(/[,.]/g, "").replace(/^0+/, "") || strikeStr
    return {
      underlying: underlying.toUpperCase(),
      strike,
      expiry: expiry.toUpperCase(),
      type: type.toUpperCase() === "CE" ? "CALL" : "PUT",
      raw: name,
    }
  }

  // Pattern 2: "NIFTY24072424000CE" — Yahoo Finance compact format (underlying + YYMMDD + strike + CE/PE)
  const yahooCompact = name.match(/^([A-Z]+)(\d{2})(\d{2})(\d{2})(\d+)(CE|PE)\s*$/i)
  if (yahooCompact) {
    const [, underlying, year, month, day, strikeStr, type] = yahooCompact
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
    const monthIdx = parseInt(month, 10)
    const expiry = monthIdx >= 1 && monthIdx <= 12 ? `${day} ${monthNames[monthIdx - 1]} ${year}` : `${day}/${month}/${year}`
    return {
      underlying: underlying.toUpperCase(),
      strike: strikeStr.replace(/^0+/, "") || strikeStr,
      expiry,
      type: type.toUpperCase() === "CE" ? "CALL" : "PUT",
      raw: name,
    }
  }

  // Pattern 3: "NIFTY Jul 24 2025 24000.00 C" — Yahoo Finance verbose format
  const verbose = name.match(/^(.+?)\s+([A-Z][a-z]{2})\s+(\d+)\s+(\d{4})\s+([\d,.]+)\s+(C|P)\s*$/i)
  if (verbose) {
    const [, underlying, month, day, year, strikeStr, type] = verbose
    return {
      underlying: underlying.toUpperCase(),
      strike: strikeStr.replace(/[,.]/g, "").replace(/^0+/, "") || strikeStr,
      expiry: `${month.toUpperCase()} ${year}`,
      type: type.toUpperCase() === "C" ? "CALL" : "PUT",
      raw: name,
    }
  }

  return null
}

function isOptionName(name: string): boolean {
  // Direct CE/PE check
  if (/\b(CE|PE)\b/i.test(name)) return true
  // Index option names without explicit CE/PE but containing index + number + C/P
  if (INDEX_NAMES.test(name) && /\b(C|P)\b/i.test(name)) return true
  // Parse attempt as final check
  return parseOptionName(name) !== null
}

/** Deep, structured instrument analysis grounded strictly in the supplied data. */
export async function generateAnalysis(input: { name: string; horizon: string; context: string }): Promise<Analysis> {
  const isOption = isOptionName(input.name)
  const optionDetails = isOption ? parseOptionName(input.name) : null

  const grounding = GROUNDING
  const contractLine = isOption && optionDetails
    ? `CONTRACT: ${optionDetails.underlying} ${optionDetails.strike} ${optionDetails.type} expiring ${optionDetails.expiry}`
    : ""

  const system = isOption
    ? `You are a derivatives strategist at an institutional trading desk. Your research must match the calibre of a Goldman Sachs or Morgan Stanley options note.

${contractLine}

Before producing any recommendation, you must run through every stage below. If a dataset is unavailable, state it explicitly. Never invent data. Never assume numbers. Never hallucinate.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. UNDERLYING ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Study the underlying first, never the option in isolation.

Price action: trend, structure, key levels, who is in control.
Multi-timeframe: daily, 4H, 1H. Identify direction, momentum, volatility regime.
Volume: is volume confirming or diverging from price? Delivery %, participation.
Key levels: support, resistance, liquidity zones, order blocks, fair value gaps.
Market structure: higher highs/lows, lower highs/lows, breaks of structure, change of character.
Indicators as supporting evidence: EMAs, RSI, MACD, ADX, Bollinger Bands, VWAP. Never lead with them.
Institutional footprint: accumulation or distribution? Where is smart money positioned?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. OPTIONS CHAIN ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyse every available field. If a field is unavailable, say exactly "Option-chain data unavailable for [field]." Never fabricate.

Open Interest and change in OI: build-up or unwinding? Calls or puts?
PCR: directional bias from put/call ratio.
Max Pain: where the most options expire worthless.
IV, IV rank, IV percentile: expensive or cheap premium?
Greeks: delta (directional exposure), gamma (acceleration risk), theta (time decay cost), vega (volatility exposure).
Premium behaviour: decaying or expanding?
Liquidity: bid-ask spread, open interest concentration.
Institutional positioning: OI build-up at specific strikes, writers vs buyers.
Expiry risks: time decay acceleration, pin risk, gap risk.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. MARKET REGIME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Identify current regime: bullish, bearish, sideways, accumulation, distribution, high volatility, low volatility.
Index correlation, sector rotation, institutional flow, global correlation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. INTERNAL REASONING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before writing output, answer internally:
- Who controls this market right now?
- Are institutions buying or selling?
- Where is the clearest edge?
- What is the biggest risk?
- Would I trade this with institutional capital?
- Why or why not?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. RECOMMENDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Possible outputs: Strong Buy CE | Buy CE | Strong Buy PE | Buy PE | Wait | No Trade.
Never "Hold". Below 50% probability → No Trade.

Provide three entry levels with conviction reasoning:
- Aggressive (near current price)
- Conservative (on confirmation)
- Breakout (on level break)

Three targets: nearest, moderate, stretch.
One invalidation stop with clear reasoning.

Scenarios: Bullish % + Neutral % + Bearish % ≈ 100%.
Trade quality: 1-5 stars based on trend, momentum, liquidity, risk-reward, IV environment, probability.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. CONFIDENCE SCORING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score 20-95 based only on: fundamentals, technicals, news, macro, options data, volume, trend quality, liquidity, institutional activity.
Never random. Never fixed. If data is insufficient, confidence should be low.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Explain WHY, not WHAT.
Do not say "RSI is 52". Say "Momentum is improving because buyers defended support for multiple sessions."
Do not sound like a chatbot. Sound like a senior derivatives strategist.
Never use: "The current market structure indicates", "Based on the technical setup", "The data suggests", "The RSI indicates", "The MACD shows".
No fake data. No hallucinations. No invented numbers. No fabricated news. No guessing.
If insufficient option data exists, say exactly: "Insufficient option market data to produce a high-confidence recommendation."

GROUNDING: ${grounding}`
    : `You are an institutional equity research analyst writing for a Goldman Sachs or J.P. Morgan morning meeting. Your audience is portfolio managers and seasoned traders. Your research must justify every conclusion with real evidence from the data provided.

Before producing any recommendation, you must systematically analyse all available information using the framework below. If a dataset is unavailable, state it explicitly. Never invent data. Never assume numbers. Never hallucinate.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. MARKET DATA ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyse: current price, OHLC, volume, VWAP, ATR, 52-week high/low, gap, bid-ask spread, market cap, sector, beta, volatility, average volume, delivery percentage, market breadth, index correlation, relative strength.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. TECHNICAL ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyse across multiple timeframes: 1m, 5m, 15m, 30m, 1H, 4H, daily, weekly, monthly.
Identify: trend direction, higher highs/lows, lower highs/lows, trendlines, channels, triangles, flags, pennants, cup and handle, double top/bottom, head and shoulders patterns.
Key levels: support, resistance, breakout/breakdown points, liquidity zones, demand zones, supply zones, fair value gaps, order blocks.
Volume profile, VWAP.
Indicators as supporting evidence: EMAs, SMAs, RSI, MACD, ADX, CCI, OBV, MFI, Stochastic RSI, Bollinger Bands, ATR, Ichimoku, Supertrend, Fibonacci retracement and extension.
Candlestick patterns, market structure, smart money concepts.
Never lead with indicators. They are supporting evidence, never the headline.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. FUNDAMENTAL ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyse company quality from available data: revenue growth, profit growth, operating margin, net margin, EBITDA, EPS, book value, cash flow, free cash flow, debt, debt/equity, ROE, ROCE, ROA.
Shareholding: promoter holding, FII holding, DII holding, pledged shares.
Dividend history, share buybacks.
Quarterly and annual results trends: last 5 years revenue, profit, EPS, cash flow.
Balance sheet strength, income statement quality, cash flow statement health.
Valuation: PE, PB, PEG, EV/EBITDA, intrinsic value versus current price.
Compare with sector averages where data permits.

If quarterly results or financial data is unavailable, state it clearly. Never invent numbers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. BUSINESS ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Understand the business: what does the company do? How does it earn money? Major products, major customers, major competitors, market share.
Competitive advantage and moat: what protects the business? Pricing power, brand, network effects, scale, regulation, switching costs.
Expansion plans, future growth drivers.
Risks: debt risk, legal risk, regulatory risk, management quality, corporate governance, recent acquisitions.

If business data is unavailable, state it clearly. Never fabricate.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. NEWS AND SENTIMENT ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyse only real news provided: last 24 hours, last 7 days, last month.
Quarterly earnings, management guidance, investor presentations, exchange filings.
Macro: government policy, central bank moves, inflation, interest rates, oil prices, currency, global events, sector news.
Ignore clickbait. Ignore fake news. Give higher importance to official filings.
Sentiment: financial news tone, analyst ratings, institutional reports, market mood, fear and greed index, institutional positioning.

If no meaningful news exists, say nothing about news. Never invent headlines.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. MARKET REGIME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Identify: bull market, bear market, sideways, accumulation, distribution, breakout, breakdown, high volatility, low volatility.
Consider sector rotation, FII/DII flows, global correlation, index correlation, market breadth.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. INTERNAL REASONING ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before writing output, internally answer every question:
- Who controls this stock/index right now?
- Are institutions accumulating or distributing?
- Is this fundamentally strong or weak?
- Is the technical setup aligned with the fundamentals?
- Is valuation expensive, fair, or cheap?
- What are the biggest risks?
- Would I invest institutional capital here?
- Would I trade this? Would I avoid it? Why?
- What is the single clearest edge in this setup?
- What is the one thing an institutional trader would notice first?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. FINAL DECISION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Recommend only after completing all analysis above.
Possible outputs: Strong Buy | Buy | Accumulate | Buy on Dip | Watch | Hold | Reduce | Sell | Strong Sell.
If available evidence is insufficient to form a confident view, return Hold or No Trade instead of pretending certainty.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. CONFIDENCE SCORING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score 20-95 based on: fundamentals, technicals, news, macro, volume, trend quality, liquidity, institutional activity.
Never random. Never fixed. A clean 72 backed by real evidence is more credible than a forced 88.
Low confidence (<50) when signals are mixed, data is thin, or the picture is unclear.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. OUTPUT PRINCIPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Explain WHY, not WHAT.
Do not say "RSI is 52". Say "Buyers defended support for multiple sessions. Momentum is building."
Do not list indicators. Describe what the price action and data mean.
Write like a senior research analyst at a bulge-bracket bank. Direct, opinionated, evidence-backed. Every sentence adds information.
Prohibited phrases (never use): "The current market structure indicates", "Based on the technical setup", "Derived from the analysis", "The RSI indicates", "The MACD indicates", "The data suggests", "This suggests that", "The market is showing".
No fake data. No hallucinations. No invented numbers. No fabricated news. No guessing.
Every conclusion must reference specific real data points from the context provided.
When evidence is insufficient, return Hold or No Trade.

GROUNDING: ${grounding}`
  try {
    const userPrompt = isOption
      ? `Instrument: ${input.name} | Underlying: ${optionDetails?.underlying ?? "N/A"} ${optionDetails?.strike ?? "N/A"} ${optionDetails?.type ?? "N/A"} exp ${optionDetails?.expiry ?? "N/A"} | Horizon: ${input.horizon}

Analyse the underlying first. Then assess the option chain data. Every conclusion must reference specific data points below.

━━ DATA ━━
${input.context}

Output the analysis as JSON using exactly this schema (no extra fields, no missing fields):
{"recommendation":"Strong Buy CE"|"Buy CE"|"Buy PE"|"Strong Buy PE"|"Wait"|"No Trade"|"Strong Buy"|"Buy"|"Buy on Dip"|"Accumulate"|"Hold"|"Neutral"|"Wait for Confirmation"|"Reduce Exposure"|"Book Partial Profit"|"Avoid Fresh Entries"|"Strong Sell","recommendationReason":"string","confidenceScore":20-95,"confidenceNote":"string","quickSummary":["string","string","string"],"entry":"string","holdingPeriod":"string","riskReward":"string","probabilityOfProfit":0-100,"probabilityOfLoss":0-100,"probabilityReason":"string","scenarioBest":"string","scenarioLikely":"string","scenarioWorst":"string","maxDownside":"string","expectedUpside":"string","riskRewardNote":"string","positionVerySafe":"string","positionModerate":"string","positionAggressive":"string","positionNote":"string","bestHoldingTime":"Intraday"|"1 Week"|"1 Month"|"3 Months"|"Long Term","holdingReason":"string","whyBuy":["string","string"],"whatCouldGoWrong":["string","string"],"support":"string","supportNote":"string","resistance":"string","resistanceNote":"string","riskLevel":"Low"|"Medium"|"High","riskNote":"string","marketMood":"Bullish"|"Bearish"|"Neutral","marketMoodNote":"string","beginnerExplanation":"string","isGoodToday":"string","biggestRisk":"string","safestWay":"string","waitOrBuyNow":"string","smallBudgetPlan":"string","largeBudgetPlan":"string","actionToday":"string","actionNext3Days":"string","actionNextWeek":"string","ownMoneyView":"string","proInvestorView":"string","aiVerdict":"string","entryAggressive":"string","entryConservative":"string","entryBreakout":"string","target2":"string","target3":"string","bullishScenario":"string","neutralScenario":"string","bearishScenario":"string","tradeQuality":"string","optionRisk":"string"}`
      : `Instrument: ${input.name} | Horizon: ${input.horizon}

Analyse every available data point below. Who controls this name? Where is the edge? What is the risk? Every conclusion must reference specific data.

━━ DATA ━━
${input.context}

Output the analysis as JSON using exactly this schema (no extra fields, no missing fields):
{"recommendation":"Strong Buy"|"Buy"|"Buy on Dip"|"Accumulate"|"Hold"|"Neutral"|"Wait for Confirmation"|"Reduce Exposure"|"Book Partial Profit"|"Avoid Fresh Entries"|"Strong Sell","recommendationReason":"string","confidenceScore":20-95,"confidenceNote":"string","quickSummary":["string","string","string"],"entry":"string","target":"string","stopLoss":"string","holdingPeriod":"string","riskReward":"string","probabilityOfProfit":0-100,"probabilityOfLoss":0-100,"probabilityReason":"string","bestTimeframe":"string","suitableFor":["string","string","string"],"scenarioBest":"string","scenarioLikely":"string","scenarioWorst":"string","maxDownside":"string","expectedUpside":"string","riskRewardNote":"string","positionVerySafe":"string","positionModerate":"string","positionAggressive":"string","positionNote":"string","bestHoldingTime":"Intraday"|"1 Week"|"1 Month"|"3 Months"|"Long Term","holdingReason":"string","whyBuy":["string","string","string"],"whatCouldGoWrong":["string","string","string"],"support":"string","supportNote":"string","resistance":"string","resistanceNote":"string","riskLevel":"Low"|"Medium"|"High","riskNote":"string","marketMood":"Bullish"|"Bearish"|"Neutral","marketMoodNote":"string","beginnerExplanation":"string","isGoodToday":"string","biggestRisk":"string","safestWay":"string","waitOrBuyNow":"string","smallBudgetPlan":"string","largeBudgetPlan":"string","actionToday":"string","actionNext3Days":"string","actionNextWeek":"string","ownMoneyView":"string","proInvestorView":"string","aiVerdict":"string"}`

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


