// Real market data layer backed by Yahoo Finance public chart endpoints (v8).
// No API key required. Includes retry + graceful degradation.
// We derive quotes from the chart "meta" block because the v7 quote endpoint
// now requires an auth crumb, while the v8 chart endpoint remains open.

export type MarketState =
  | "PRE"
  | "REGULAR"
  | "POST"
  | "CLOSED"

export type Quote = {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  currency: string
  exchange: string
  marketState: MarketState
  previousClose: number
  dayHigh?: number
  dayLow?: number
  volume?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  timezone?: string
  nextEventAt?: number // ms timestamp of next session boundary
}

export type Candle = { t: number; c: number }

const YF_HOSTS = [
  "https://query1.finance.yahoo.com",
  "https://query2.finance.yahoo.com",
]
// Yahoo aggressively 429s verbose desktop-Chrome UA strings on shared/cloud IPs.
// Simple, minimal agents consistently pass. We rotate across attempts.
const UAS = [
  "Mozilla/5.0",
  "Mozilla/5.0 (compatible; Lumora/1.0)",
  "curl/8.4.0",
]

// path should start with "/" — we rotate the host across attempts to dodge
// per-host rate limits (Yahoo returns 429 aggressively on shared IPs).
async function fetchJson(
  path: string,
  revalidate = 30,
  retries = 3,
): Promise<any> {
  let lastErr: unknown
  for (let i = 0; i <= retries; i++) {
    const host = YF_HOSTS[i % YF_HOSTS.length]
    const ua = UAS[i % UAS.length]
    try {
      const res = await fetch(`${host}${path}`, {
        headers: { "User-Agent": ua, Accept: "application/json" },
        next: { revalidate },
      })
      if (res.ok) return await res.json()
      lastErr = new Error(`HTTP ${res.status}`)
      // backoff harder on rate limit
      const wait = res.status === 429 ? 500 * (i + 1) : 200 * (i + 1)
      await new Promise((r) => setTimeout(r, wait))
    } catch (err) {
      lastErr = err
      await new Promise((r) => setTimeout(r, 250 * (i + 1)))
    }
  }
  throw lastErr
}

type Meta = Record<string, unknown> & {
  currentTradingPeriod?: {
    pre?: { start: number; end: number }
    regular?: { start: number; end: number }
    post?: { start: number; end: number }
  }
}

function deriveState(meta: Meta): { state: MarketState; nextEventAt?: number } {
  const now = Math.floor(Date.now() / 1000)
  const p = meta.currentTradingPeriod
  if (!p?.regular) return { state: "CLOSED" }
  const { pre, regular, post } = p
  if (regular && now >= regular.start && now < regular.end) {
    return { state: "REGULAR", nextEventAt: regular.end * 1000 }
  }
  if (pre && now >= pre.start && now < pre.end) {
    return { state: "PRE", nextEventAt: regular.start * 1000 }
  }
  if (post && now >= post.start && now < post.end) {
    return { state: "POST", nextEventAt: post.end * 1000 }
  }
  // closed: next event is the next pre/regular start
  const next = (pre?.start ?? regular.start) * 1000
  return { state: "CLOSED", nextEventAt: next > Date.now() ? next : undefined }
}

async function fetchMeta(symbol: string): Promise<Quote | null> {
  try {
    const path = `/v8/finance/chart/${encodeURIComponent(
      symbol,
    )}?range=1d&interval=1d`
    const json = await fetchJson(path, 20)
    const meta: Meta | undefined = json?.chart?.result?.[0]?.meta
    if (!meta) return null
    const price = Number(meta.regularMarketPrice ?? 0)
    const prev = Number(meta.chartPreviousClose ?? meta.previousClose ?? price)
    const change = price - prev
    const { state, nextEventAt } = deriveState(meta)
    return {
      symbol: String(meta.symbol ?? symbol),
      name: String(meta.shortName ?? meta.longName ?? symbol),
      price,
      change,
      changePercent: prev ? (change / prev) * 100 : 0,
      currency: String(meta.currency ?? "USD"),
      exchange: String(meta.fullExchangeName ?? meta.exchangeName ?? ""),
      marketState: state,
      previousClose: prev,
      dayHigh: meta.regularMarketDayHigh ? Number(meta.regularMarketDayHigh) : undefined,
      dayLow: meta.regularMarketDayLow ? Number(meta.regularMarketDayLow) : undefined,
      volume: meta.regularMarketVolume ? Number(meta.regularMarketVolume) : undefined,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ? Number(meta.fiftyTwoWeekHigh) : undefined,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow ? Number(meta.fiftyTwoWeekLow) : undefined,
      timezone: meta.exchangeTimezoneName ? String(meta.exchangeTimezoneName) : undefined,
      nextEventAt,
    }
  } catch {
    return null
  }
}

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  if (symbols.length === 0) return []
  const results = await Promise.all(symbols.map((s) => fetchMeta(s)))
  return results.filter((q): q is Quote => q !== null)
}

export async function getQuote(symbol: string): Promise<Quote | null> {
  return fetchMeta(symbol)
}

export async function getChart(
  symbol: string,
  range = "1mo",
  interval = "1d",
): Promise<Candle[]> {
  try {
    const path = `/v8/finance/chart/${encodeURIComponent(
      symbol,
    )}?range=${range}&interval=${interval}`
    const json = await fetchJson(path, 60)
    const result = json?.chart?.result?.[0]
    if (!result) return []
    const ts: number[] = result.timestamp ?? []
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? []
    const out: Candle[] = []
    for (let i = 0; i < ts.length; i++) {
      const c = closes[i]
      if (c != null) out.push({ t: ts[i] * 1000, c })
    }
    return out
  } catch {
    return []
  }
}

export type SearchResult = {
  symbol: string
  name: string
  exchange: string
  type: string
}

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []
  try {
    const path = `/v1/finance/search?q=${encodeURIComponent(
      query,
    )}&quotesCount=12&newsCount=0`
    const json = await fetchJson(path, 300)
    const quotes = json?.quotes ?? []
    return quotes
      .filter(
        (q: Record<string, unknown>) =>
          q.symbol && q.quoteType !== "OPTION" && q.quoteType !== "FUTURE",
      )
      .map(
        (q: Record<string, unknown>): SearchResult => ({
          symbol: String(q.symbol),
          name: String(q.shortname ?? q.longname ?? q.symbol),
          exchange: String(q.exchDisp ?? q.exchange ?? ""),
          type: String(q.quoteType ?? q.typeDisp ?? ""),
        }),
      )
  } catch {
    return []
  }
}

export const CURATED_TICKER = [
  "AAPL",
  "MSFT",
  "NVDA",
  "TSLA",
  "AMZN",
  "GOOGL",
  "META",
  "^GSPC",
  "^IXIC",
  "^DJI",
  "BTC-USD",
  "ETH-USD",
]

export function displayName(symbol: string, fallback?: string): string {
  const map: Record<string, string> = {
    "^GSPC": "S&P 500",
    "^IXIC": "Nasdaq",
    "^DJI": "Dow Jones",
    "^FTSE": "FTSE 100",
    "^N225": "Nikkei 225",
    "BTC-USD": "Bitcoin",
    "ETH-USD": "Ethereum",
  }
  return map[symbol] ?? fallback ?? symbol
}
