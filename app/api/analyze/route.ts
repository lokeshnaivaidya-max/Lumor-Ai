import { streamText } from "ai"
import { getQuote, getChart, displayName } from "@/lib/market"
import { computeIndicators } from "@/lib/indicators"
import { getNews } from "@/lib/news"
import { AI_MODEL, DISCLAIMER } from "@/lib/ai"

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
    return new Response("Invalid request body.", { status: 400 })
  }
  const symbol = body.symbol?.trim()
  const horizon = body.horizon ?? "swing"
  if (!symbol) return new Response("Missing symbol", { status: 400 })

  const [quote, candles, news] = await Promise.all([
    getQuote(symbol, { withFundamentals: true }),
    getChart(symbol, "1y", "1d"),
    getNews(symbol, 8),
  ])

  if (!quote) {
    return new Response("Unable to load market data for this symbol.", { status: 404 })
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

  let capturedError = ""
  const result = streamText({
    model: AI_MODEL,
    temperature: 0.35,
    onError: ({ error }) => {
      capturedError = error instanceof Error ? error.message : String(error)
      console.log("[v0] analyze onError:", capturedError)
    },
    system: `You are Lumora, an elite buy-side market intelligence analyst. You produce sharp, structured, institutional-grade analysis grounded STRICTLY in the data provided in the prompt.

ABSOLUTE RULES:
- Never invent numbers, prices, news, or events. Use ONLY the figures given. If a figure is "n/a", say the data is unavailable — do not estimate it.
- Always explain WHY. Every conclusion must reference specific data points (an RSI level, an EMA cross, a P/E, a headline). Never output a bare Buy/Sell.
- Be quantitative and cite the actual numbers.
- Use clean GitHub-flavored markdown.

Produce EXACTLY these sections with these headers, in this order:

## Executive Summary
2-3 sentences. What is this instrument doing and the single most important takeaway.

## Bull Case
3-4 bullet points with concrete supporting data.

## Bear Case
3-4 bullet points with concrete supporting data.

## Technical Analysis
Trend, momentum (RSI, MACD, Stoch RSI, ADX), moving-average structure, VWAP relationship. Reference the numbers.

## Fundamental Analysis
Valuation (P/E, EPS), market cap context, dividend, sector/industry. If it's an index/commodity/FX/crypto with no fundamentals, say so and focus on macro positioning.

## Key Levels
- **Support:** value + reasoning
- **Resistance:** value + reasoning
- **Trend strength:** interpret the ADX

## Scenarios
- **Short-term (days):** view + trigger levels
- **Swing (weeks):** view + trigger levels
- **Long-term (months+):** view + reasoning

## Catalysts & Risks
- **Positive catalysts:** tie to the headlines where relevant
- **Negative factors / risks:** be specific

## Market Sentiment
One line: Positive / Negative / Neutral — with a one-sentence justification from headlines + technicals.

## Investment Thesis
A concise paragraph tying it together.

## Verdict
A single line: **Bias:** Bullish / Bearish / Neutral | **Confidence:** N% | **Risk level:** Low / Medium / High | **Risk-Reward:** e.g. 1:2.5

End with this exact disclaimer as the final italic line: ${DISCLAIMER}`,
    prompt: `Analyze the following instrument for a ${horizon} trader.\n\n${context}`,
  })

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let streamed = false
      try {
        for await (const delta of result.textStream) {
          streamed = true
          controller.enqueue(encoder.encode(delta))
        }
      } catch (err) {
        capturedError = capturedError || (err instanceof Error ? err.message : String(err))
      } finally {
        if (!streamed && capturedError) {
          const friendly = /credit card|billing|payment|quota|insufficient|forbidden|403/i.test(capturedError)
            ? "**AI analysis is temporarily unavailable.**\n\nThe AI provider needs billing enabled before it can generate analysis. The live market data and technicals above are fully functional."
            : "**AI analysis is temporarily unavailable.**\n\nThe model provider returned an error. The live market data and technicals above are fully functional — please try again shortly."
          controller.enqueue(encoder.encode(friendly))
        }
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  })
}
