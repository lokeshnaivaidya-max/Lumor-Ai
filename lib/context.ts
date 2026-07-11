// Builds the grounded, data-only prompt context shared by the AI routes.
// Everything here comes from real Yahoo Finance data + locally computed
// technical indicators. The model is instructed to use ONLY this context.

import { getQuote, getChart, displayName, type Quote } from "@/lib/market"
import { computeIndicators } from "@/lib/indicators"
import { getNews, type NewsItem } from "@/lib/news"

export function fmt(n: number | null | undefined, d = 2) {
  return n == null ? "n/a" : n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })
}

export function bigNum(n?: number) {
  if (n == null) return "n/a"
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  return n.toLocaleString()
}

export type InstrumentContext = {
  quote: Quote
  name: string
  news: NewsItem[]
  context: string
}

/**
 * Fetches quote + 1y candles + news for a symbol and assembles the grounded
 * prompt context. Returns null when no market data is available.
 */
export async function buildInstrumentContext(
  symbol: string,
  opts?: { horizon?: string; newsCount?: number },
): Promise<InstrumentContext | null> {
  const [quote, candles, news] = await Promise.all([
    getQuote(symbol, { withFundamentals: true }),
    getChart(symbol, "1y", "1d"),
    getNews(symbol, opts?.newsCount ?? 8),
  ])

  if (!quote) return null

  const ind = computeIndicators(candles)
  const name = displayName(quote.symbol, quote.name)

  const fibStr = ind.fib
    ? Object.entries(ind.fib)
        .map(([k, v]) => `${k}: ${v.toFixed(2)}`)
        .join(", ")
    : "n/a"

  const newsStr = news.length
    ? news
        .slice(0, opts?.newsCount ?? 8)
        .map((n, i) => `${i + 1}. "${n.title}" — ${n.publisher} (${new Date(n.publishedAt).toISOString().slice(0, 10)})`)
        .join("\n")
    : "No recent headlines available."

  const horizonLine = opts?.horizon ? `\nTrader horizon requested: ${opts.horizon}` : ""

  const context = `
INSTRUMENT
Name: ${name} (${quote.symbol})
Type: ${quote.assetType ?? "n/a"} | Exchange: ${quote.exchange} | Currency: ${quote.currency}
Market status: ${quote.marketState}
Sector: ${quote.sector ?? "n/a"} | Industry: ${quote.industry ?? "n/a"}

PRICE
Last: ${fmt(quote.price)} (${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}% today)
Previous close: ${fmt(quote.previousClose)} | Open: ${fmt(quote.open)}
Day range: ${fmt(quote.dayLow)} – ${fmt(quote.dayHigh)}
52-week range: ${fmt(quote.fiftyTwoWeekLow)} – ${fmt(quote.fiftyTwoWeekHigh)}
Volume: ${bigNum(quote.volume)} (avg ${bigNum(quote.avgVolume)})

FUNDAMENTALS
Market cap: ${bigNum(quote.marketCap)}
Trailing P/E: ${fmt(quote.trailingPE)} | Forward P/E: ${fmt(quote.forwardPE)}
EPS (TTM): ${fmt(quote.eps)} | Dividend yield: ${quote.dividendYield != null ? quote.dividendYield.toFixed(2) + "%" : "n/a"}
Beta: ${fmt(quote.beta)}

TECHNICALS (computed from 1y daily candles)
Trend regime: ${ind.trend} (strength: ${ind.trendStrength}, ADX ${fmt(ind.adx, 1)})
Momentum: ${ind.momentum}
RSI(14): ${fmt(ind.rsi, 1)} | Stoch RSI %K: ${ind.stochRsi ? fmt(ind.stochRsi.k, 1) : "n/a"}
MACD: ${ind.macd ? `${fmt(ind.macd.macd)} (signal ${fmt(ind.macd.signal)}, hist ${fmt(ind.macd.histogram)})` : "n/a"}
EMA 20/50/200: ${fmt(ind.ema20)} / ${fmt(ind.ema50)} / ${fmt(ind.ema200)}
SMA 50: ${fmt(ind.sma50)} | VWAP: ${fmt(ind.vwap)}
Bollinger(20,2): ${ind.bollinger ? `${fmt(ind.bollinger.lower)} – ${fmt(ind.bollinger.upper)}` : "n/a"}
ATR(14): ${fmt(ind.atr)}
Support / Resistance (60d): ${fmt(ind.support)} / ${fmt(ind.resistance)}
Fibonacci: ${fibStr}

RECENT HEADLINES
${newsStr}${horizonLine}
`.trim()

  return { quote, name, news, context }
}
