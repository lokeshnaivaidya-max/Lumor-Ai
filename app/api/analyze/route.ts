import { NextResponse } from "next/server"
import { getQuote, getChart, displayName } from "@/lib/market"
import { computeIndicators } from "@/lib/indicators"
import { getNews } from "@/lib/news"
import { generateAnalysis, DISCLAIMER, AiConfigError, AiBillingError } from "@/lib/ai/provider"

export const runtime = "nodejs"
export const maxDuration = 60

function fmt(n: number | null | undefined, d = 2) {
  return n == null ? "n/a" : n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })
}

function bigNum(n?: number) {
  if (n == null) return "n/a"
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  return n.toLocaleString()
}

export async function POST(req: Request) {
  let body: { symbol?: string; horizon?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }
  const symbol = body.symbol?.trim()
  const horizon = body.horizon ?? "swing"
  if (!symbol) return NextResponse.json({ error: "Missing symbol" }, { status: 400 })

  const [quote, candles, news] = await Promise.all([
    getQuote(symbol, { withFundamentals: true }),
    getChart(symbol, "1y", "1d"),
    getNews(symbol, 8),
  ])

  if (!quote) {
    return NextResponse.json({ error: "Unable to load market data for this symbol." }, { status: 404 })
  }

  const ind = computeIndicators(candles)
  const name = displayName(quote.symbol, quote.name)

  const fibStr = ind.fib
    ? Object.entries(ind.fib)
        .map(([k, v]) => `${k}: ${v.toFixed(2)}`)
        .join(", ")
    : "n/a"

  const newsStr = news.length
    ? news
        .slice(0, 8)
        .map((n, i) => `${i + 1}. "${n.title}" — ${n.publisher} (${new Date(n.publishedAt).toISOString().slice(0, 10)})`)
        .join("\n")
    : "No recent headlines available."

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
${newsStr}

Trader horizon requested: ${horizon}
`.trim()

  try {
    const analysis = await generateAnalysis({ name, horizon, context })
    return NextResponse.json(
      { analysis, meta: { symbol: quote.symbol, name, horizon } },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (err) {
    const message =
      err instanceof AiBillingError
        ? "AI analysis is temporarily unavailable — the Gemini API quota has been exhausted. Live market data and technicals remain fully functional."
        : err instanceof AiConfigError
          ? "AI analysis is not configured. Add a GEMINI_API_KEY in Project Settings to enable it. Live market data and technicals remain fully functional."
          : "AI analysis is temporarily unavailable — the model provider returned an error. Live market data and technicals remain fully functional."
    console.log("[v0] analyze error:", err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: message, disclaimer: DISCLAIMER }, { status: 200 })
  }
}
