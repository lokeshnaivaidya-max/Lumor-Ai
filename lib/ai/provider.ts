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

/** Detect option contracts by name pattern. */
function isOptionName(name: string): boolean {
  return /\b(CE|PE)\b/i.test(name)
}

/** Deep, structured instrument analysis grounded strictly in the supplied data. */
export async function generateAnalysis(input: { name: string; horizon: string; context: string }): Promise<Analysis> {
  const isOption = isOptionName(input.name)

  const system = isOption
    ? `You are Lumora, a professional options trader and institutional derivatives analyst. Your job is NOT to explain Greeks or indicators. Your job is to identify where smart money is positioning and whether a trade has edge.

ANALYZE THIS OPTION CONTRACT using this priority:
1. Overall market trend and index trend
2. Open Interest shifts and Put-Call ratio
3. Max Pain level
4. VWAP and price action relative to it
5. Support and resistance on the underlying
6. Option Greeks: Delta, Theta, Gamma, Vega (if available)
7. Implied Volatility and whether premium is fairly priced
8. Momentum indicators (lowest priority)

OUTPUT RULES:
- Direction: Bullish / Bearish / Sideways
- Best Trade: Buy CE / Buy PE / Wait / Avoid Trade
- Entry, Target 1, Target 2, Stop Loss with specific price levels and reasoning
- Confidence: 20-95 based on OI data, IV, Greeks, and market structure
- Probability of Success: realistic estimate
- Risk Level: Low / Medium / High

WARNINGS:
- If Theta decay is high, warn the user explicitly about time decay.
- If IV is elevated, warn that premium is expensive and a move must happen quickly.
- If premium is overpriced relative to historical IV, flag it.
- Never recommend buying options with poor probability. If no edge exists, clearly say "No Trade is better than a bad trade."

Write like a professional derivatives desk analyst. Focus on edge, probability, and risk.

GROUNDING: ${GROUNDING}`
    : `You are Lumora, a hedge fund analyst. Your job is NOT to explain indicators. Your job is to explain the STORY of the market.

Tell me who is controlling this instrument right now: buyers or sellers? Is accumulation happening or distribution? Is momentum building or fading? Is the trend strengthening or weakening? Where is liquidity sitting? Where would smart money enter?

RULES:
1. Every analysis must be completely unique. Never reuse sentence structures. Never start consecutive analyses the same way.
2. Indicators are evidence, NOT the analysis. Never say "RSI is 56. MACD is positive." Instead say "Buyers are slowly regaining control after defending the recent support zone. Momentum is improving, supported by strengthening RSI and a positive MACD crossover."
3. Entry must be a practical level with a human reason: "Entry near 2180 where buyers previously absorbed selling pressure." Never say "Derived from..."
4. Target must explain why: "Target 2310 near the previous resistance where profit booking is likely."
5. Stop loss must explain invalidation: "Stop below 2140 because a break below this level would invalidate the bullish setup."
6. Confidence must be a realistic score between 20 and 95, based on: trend strength, momentum, volume conviction, news sentiment, risk-reward quality, and market structure clarity. If indicators disagree, confidence drops.
7. Risk reward must be a simple ratio like "1:2.4" or "1:3". Never explain the formula.
8. Use institutional language naturally: accumulation, distribution, liquidity, breakout, pullback, demand zone, supply zone, trend exhaustion, momentum shift, smart money, institutional buying, profit booking, higher high, lower low.
9. If recent news supports the trend, mention it naturally. If no meaningful news exists, do NOT invent news.
10. If data is unavailable, say "Insufficient data" instead of inventing.
11. Every instrument must sound different. Reliance must not sound like Infosys.
12. Write like Bloomberg, Goldman Sachs, or Morgan Stanley research -- never like ChatGPT.
13. Never list indicators. Tell the market story. Indicators are only supporting evidence.

Before writing, silently ask yourself: What is the dominant trend? What is the biggest risk? What would an institutional trader notice first? Would I personally deploy capital here? Why?

CONFIDENCE SCORING (compute dynamically):
- Start at 50
- Trend alignment: +8 if price > EMA20 > EMA50 > EMA200, +4 if mildly bullish, -4 if bearish
- RSI zone: +4 if 40-60, -4 if >70 or <30
- MACD: +4 if positive and rising, -3 if negative/fading
- ADX: +4 if >=25, +2 if >=20, -2 if <15
- Volume: +3 if >1.5x average, -2 if <0.5x average
- News: +3 if positive headlines, -3 if negative headlines
- Indicator agreement: +5 if all point same direction, -5 if conflicted
- Clamp between 20 and 95

VERDICT MAPPING:
- 85-95: Strong Buy
- 70-84: Buy
- 60-69: Buy on Dip or Accumulate
- 50-59: Hold or Neutral
- 40-49: Wait for Confirmation
- 30-39: Reduce Exposure or Book Partial Profit
- 20-29: Avoid Fresh Entries
- Below 20: Strong Sell

GROUNDING: ${GROUNDING}`
  try {
    const userPrompt = isOption
      ? `Analyze this option contract: ${input.name} for a ${input.horizon} trader. Evaluate the option chain, implied volatility, Greeks, and market structure to determine if there is a trading edge.

${input.context}

Respond with ONLY valid JSON. No markdown, no code blocks. The JSON must follow this exact structure:
{"recommendation":"Strong Buy"|"Buy"|"Buy on Dip"|"Accumulate"|"Hold"|"Neutral"|"Wait for Confirmation"|"Reduce Exposure"|"Book Partial Profit"|"Avoid Fresh Entries"|"Strong Sell","recommendationReason":"explain the option market structure -- OI shifts, IV, premium pricing, and whether smart money is positioned for a move","confidenceScore":0-100,"confidenceNote":"what this confidence means given the option pricing and market conditions","quickSummary":["unique observation about OI or IV","unique observation about Greeks or premium","unique observation about index trend level"],"entry":"specific entry price with reasoning based on premium, IV, and support/resistance","target":"target 1 price","holdingPeriod":"expected holding time for this option","riskReward":"actual risk-reward ratio as 1:X","probabilityOfProfit":0-100,"probabilityOfLoss":0-100,"probabilityReason":"explain using IV, theta decay, and market structure","bestTimeframe":"string","suitableFor":["string","string","string"],"scenarioBest":"best case price move and premium gain","scenarioLikely":"most probable scenario given Greeks and time decay","scenarioWorst":"worst case -- premium decay or direction failure","maxDownside":"maximum premium loss percentage","expectedUpside":"expected premium gain percentage","riskRewardNote":"whether this option trade is worth the premium risk","positionVerySafe":"percent of capital for this option trade","positionModerate":"percent of capital","positionAggressive":"percent of capital NEVER above 30%","positionNote":"option sizing advice considering theta decay","bestHoldingTime":"Intraday"|"1 Week"|"1 Month"|"3 Months"|"Long Term","holdingReason":"why this timeframe fits the option Greeks and expected move","whyBuy":["option-specific reason 1","option-specific reason 2","option-specific reason 3","option-specific reason 4"],"whatCouldGoWrong":["theta decay risk","IV crush risk","direction failure risk","liquidity risk"],"support":"nearest support on underlying","supportNote":"what happens to option premium if underlying hits support","resistance":"nearest resistance on underlying","resistanceNote":"what happens to option premium if underlying hits resistance","riskLevel":"Low"|"Medium"|"High","riskNote":"explain option-specific risks -- theta, IV, liquidity","marketMood":"Bullish"|"Bearish"|"Neutral","marketMoodNote":"describe the options market tone and positioning","beginnerExplanation":"max 60 words explaining this option trade in plain language","isGoodToday":"whether this option has edge today based on IV and OI","biggestRisk":"the single biggest risk to this option position","safestWay":"the safest way to trade this option setup","waitOrBuyNow":"should the trader enter now or wait for better premium","smallBudgetPlan":"option buying plan with specific premium","largeBudgetPlan":"option buying plan with scaling","actionToday":"specific action for today on this option","actionNext3Days":"what levels to watch on the underlying","actionNextWeek":"what levels to watch on the underlying","investmentStyle":"Intraday"|"Swing"|"Positional"|"Long Term","investmentStyleReason":"explain based on theta decay and expected move timing","dataUsed":["string","string","string"],"aiCannotKnow":["future IV movement","unexpected news","market maker positioning","early exercise decisions","pin risk at expiry"],"whoCanConsider":["option trader profile suited to this risk","trader profile suited to this timeframe","trader profile suited to this IV environment"],"whoShouldAvoid":["trader who cannot monitor theta decay","trader with low risk tolerance for options","trader不适合 this timeframe"],"worstMistake":"the most common mistake traders make with this option setup","simpleExample":"concrete premium allocation example","ownMoneyView":"2-3 lines in first person on whether you would trade this option","proInvestorView":"full options analysis -- OI, IV, Greeks, max pain, VWAP, market maker positioning, and edge assessment","aiVerdict":"single sentence in first person on whether to take this option trade"}`
      : `Analyze ${input.name} for a ${input.horizon} trader. Tell the market story. Never list indicators. Every sentence must be specific to this instrument and this data.

${input.context}

Respond with ONLY valid JSON. No markdown, no code blocks. The JSON must follow this exact structure:
{"recommendation":"Strong Buy"|"Buy"|"Buy on Dip"|"Accumulate"|"Hold"|"Neutral"|"Wait for Confirmation"|"Reduce Exposure"|"Book Partial Profit"|"Avoid Fresh Entries"|"Strong Sell","recommendationReason":"tell the market story -- who is controlling price, what is the dominant trend phase, where is liquidity, what would an institutional analyst notice first","confidenceScore":20-95,"confidenceNote":"what makes this setup confident or uncertain in one sentence","quickSummary":["unique observation 1 about the current market phase","unique observation 2 about buyer/seller behavior","unique observation 3 about a key level or catalyst"],"entry":"practical entry level with a human reason -- e.g. Entry near X where buyers previously absorbed selling pressure","target":"realistic target with reasoning -- e.g. Target X near previous resistance where profit booking is likely","stopLoss":"invalidation level with reasoning -- e.g. Stop below X because a break below invalidates the setup","holdingPeriod":"string","riskReward":"simple ratio like 1:2.4 -- never explain the formula","probabilityOfProfit":0-100,"probabilityOfLoss":0-100,"probabilityReason":"explain using market structure, trend conviction, and risk-reward quality","bestTimeframe":"string","suitableFor":["string","string","string"],"scenarioBest":"conditions that drive price to target and the percentage gain","scenarioLikely":"most probable outcome given current structure and percentage range","scenarioWorst":"what breaks the thesis and percentage loss","maxDownside":"percentage from entry to stop","expectedUpside":"percentage from entry to target","riskRewardNote":"one sentence on whether this specific risk-reward is worth taking","positionVerySafe":"percent of capital","positionModerate":"percent of capital","positionAggressive":"percent of capital NEVER above 30%","positionNote":"position sizing advice specific to this instruments volatility","bestHoldingTime":"Intraday"|"1 Week"|"1 Month"|"3 Months"|"Long Term","holdingReason":"why this timeframe matches the current market phase","whyBuy":["specific reason this opportunity exists right now","technical or fundamental catalyst","risk-reward observation","institutional flow angle"],"whatCouldGoWrong":["support break scenario","headline or macro risk","momentum failure","liquidity risk"],"support":"nearest support level from the data","supportNote":"describe buyer behavior at this level -- where have they stepped in before","resistance":"nearest resistance level from the data","resistanceNote":"describe seller behavior at this level -- where has selling emerged before","riskLevel":"Low"|"Medium"|"High","riskNote":"specific risk factors using actual volatility and market conditions","marketMood":"Bullish"|"Bearish"|"Neutral","marketMoodNote":"describe the tone of price action and who is in control","beginnerExplanation":"max 60 words telling the market story plainly -- focus on what is happening, not indicators","isGoodToday":"yes/no/partly based on entry proximity to support and confidence score","biggestRisk":"the single most important thing that could go wrong right now","safestWay":"the lowest-risk way to participate given current conditions","waitOrBuyNow":"clear actionable recommendation given confidence and entry level","smallBudgetPlan":"actionable plan with specific price level in the instruments currency","largeBudgetPlan":"actionable entry plan with scaling","actionToday":"specific action based on where price is relative to key levels","actionNext3Days":"levels to watch that would confirm or invalidate","actionNextWeek":"levels to watch that would confirm or invalidate","investmentStyle":"Intraday"|"Swing"|"Positional"|"Long Term","investmentStyleReason":"explain using market phase, volatility, and trend duration","dataUsed":["string","string","string"],"aiCannotKnow":["unknown future catalysts","company insider intentions","unannounced macro events","institutional order flow details","retail sentiment extremes"],"whoCanConsider":["trader profile suited to this risk","trader profile suited to this timeframe","trader profile suited to this setup"],"whoShouldAvoid":["trader profile this setup does not fit","trader profile this risk level excludes","trader profile this timeframe does not suit"],"worstMistake":"the single most common error traders make with this specific setup","simpleExample":"concrete money split example in the instruments currency","ownMoneyView":"2-3 natural lines in first person -- would you deploy capital here and why","proInvestorView":"full institutional analysis -- market structure, key levels, order flow, smart money positioning, and risk framework -- use proper technical terms freely here","aiVerdict":"single honest sentence in first person grounded in this instruments actual setup"}`

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


