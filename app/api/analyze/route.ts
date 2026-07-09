import { streamText } from "ai"
import { getQuote, getChart, displayName } from "@/lib/market"
import { computeIndicators } from "@/lib/indicators"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(req: Request) {
  const { symbol, horizon = "swing" } = await req.json()
  if (!symbol) {
    return new Response("Missing symbol", { status: 400 })
  }

  const [quote, candles] = await Promise.all([
    getQuote(symbol),
    getChart(symbol, "1y", "1d"),
  ])

  if (!quote) {
    return new Response("Unable to load market data for this symbol.", { status: 404 })
  }

  const closes = candles.map((c) => c.c)
  const ind = computeIndicators(closes)

  const name = displayName(symbol, quote.name)
  const fib = ind.fib
    ? Object.entries(ind.fib)
        .map(([k, v]) => `${k}: ${v.toFixed(2)}`)
        .join(", ")
    : "n/a"

  const context = `
Instrument: ${name} (${quote.symbol})
Exchange: ${quote.exchange} | Currency: ${quote.currency} | Market: ${quote.marketState}
Last price: ${quote.price.toFixed(2)} (${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}% today)
Previous close: ${quote.previousClose.toFixed(2)}
52-week range: ${quote.fiftyTwoWeekLow?.toFixed(2) ?? "?"} – ${quote.fiftyTwoWeekHigh?.toFixed(2) ?? "?"}

Technical snapshot (computed from 1y daily closes):
- Trend regime: ${ind.trend}
- RSI(14): ${ind.rsi?.toFixed(1) ?? "n/a"}
- MACD: ${ind.macd ? `${ind.macd.macd.toFixed(2)} (signal ${ind.macd.signal.toFixed(2)}, hist ${ind.macd.histogram.toFixed(2)})` : "n/a"}
- EMA20/50/200: ${ind.ema20?.toFixed(2) ?? "?"} / ${ind.ema50?.toFixed(2) ?? "?"} / ${ind.ema200?.toFixed(2) ?? "?"}
- Bollinger(20,2): ${ind.bollinger ? `${ind.bollinger.lower.toFixed(2)} – ${ind.bollinger.upper.toFixed(2)}` : "n/a"}
- ATR(14): ${ind.atr?.toFixed(2) ?? "n/a"}
- Support / Resistance (60d): ${ind.support?.toFixed(2) ?? "?"} / ${ind.resistance?.toFixed(2) ?? "?"}
- Fibonacci: ${fib}
Trader horizon requested: ${horizon}
`.trim()

  const result = streamText({
    model: "anthropic/claude-sonnet-4.5",
    temperature: 0.4,
    system: `You are Lumora, an elite market intelligence analyst. You produce sharp, structured, institutional-grade technical analysis grounded ONLY in the data provided.

Rules:
- Use clean markdown with these exact section headers: "## Snapshot", "## Technical Read", "## Key Levels", "## Scenarios", "## Risk". 
- Be specific and quantitative — cite the actual numbers from the data.
- Under Scenarios, give a Bullish and a Bearish case with concrete trigger levels.
- Keep it tight and high-signal; no filler, no hedging boilerplate.
- End with a one-line "Bias:" verdict (Bullish / Bearish / Neutral) with a confidence percentage.
- Always append this exact disclaimer as the final line in italics: *For research and educational purposes only. Not financial advice.*`,
    prompt: `Analyze the following instrument for a ${horizon} trader.\n\n${context}`,
  })

  return result.toTextStreamResponse()
}
