import type { MarketData } from "../providers/market"
import { computeIndicators, type Indicators } from "@/lib/indicators"
import type { Quote } from "@/lib/market"

export type TechnicalSummary = {
  trend: Indicators["trend"]
  trendStrength: Indicators["trendStrength"]
  momentum: Indicators["momentum"]
  rsi: number | null
  macdHistogram: number | null
  adx: number | null
  atr: number | null
  support60d: number | null
  resistance60d: number | null
  ema20: number | null
  ema50: number | null
  ema200: number | null
  vwap: number | null
  bollingerUpper: number | null
  bollingerLower: number | null
}

export type ReasoningObject = {
  instrument: {
    symbol: string
    name: string
    sector: string | null
    industry: string | null
    assetType: string
  }
  market: {
    price: number
    changePercent: number
    previousClose: number
    dayHigh: number | null
    dayLow: number | null
    volume: number | null
    avgVolume: number | null
    weekHigh52: number | null
    weekLow52: number | null
    marketCap: number | null
    marketState: string
    currency: string
  }
  fundamentals: {
    trailingPE: number | null
    forwardPE: number | null
    eps: number | null
    dividendYield: number | null
    beta: number | null
  }
  technicals: TechnicalSummary
  fibonacci: Record<string, number> | null
  volumeAnalysis: {
    vsAverage: "above" | "below" | "average"
    ratio: number | null
  }
  volatility: {
    atrPercent: number | null
    atr: number | null
    bollingerWidth: number | null
  }
  dataQuality: {
    hasQuote: boolean
    hasFundamentals: boolean
    hasTechnicals: boolean
    hasCandles: boolean
  }
}

export function buildReasoningObject(symbol: string, quote: Quote, indicators: Indicators): ReasoningObject {
  const price = quote.price
  const avgVol = quote.avgVolume
  const volume = quote.volume
  const volRatio = avgVol && volume ? volume / avgVol : null

  const volumeAnalysis: ReasoningObject["volumeAnalysis"] = volRatio === null
    ? { vsAverage: "average", ratio: null }
    : { vsAverage: volRatio > 1.2 ? "above" : volRatio < 0.8 ? "below" : "average", ratio: volRatio }

  const atrVal = indicators.atr
  const atrPercent = atrVal && price ? (atrVal / price) * 100 : null
  const bollingerWidth = indicators.bollinger
    ? ((indicators.bollinger.upper - indicators.bollinger.lower) / indicators.bollinger.middle) * 100
    : null

  return {
    instrument: {
      symbol: quote.symbol,
      name: quote.name,
      sector: quote.sector ?? null,
      industry: quote.industry ?? null,
      assetType: quote.assetType ?? "EQUITY",
    },
    market: {
      price,
      changePercent: quote.changePercent,
      previousClose: quote.previousClose,
      dayHigh: quote.dayHigh ?? null,
      dayLow: quote.dayLow ?? null,
      volume: quote.volume ?? null,
      avgVolume: quote.avgVolume ?? null,
      weekHigh52: quote.fiftyTwoWeekHigh ?? null,
      weekLow52: quote.fiftyTwoWeekLow ?? null,
      marketCap: quote.marketCap ?? null,
      marketState: quote.marketState,
      currency: quote.currency,
    },
    fundamentals: {
      trailingPE: quote.trailingPE ?? null,
      forwardPE: quote.forwardPE ?? null,
      eps: quote.eps ?? null,
      dividendYield: quote.dividendYield ?? null,
      beta: quote.beta ?? null,
    },
    technicals: {
      trend: indicators.trend,
      trendStrength: indicators.trendStrength,
      momentum: indicators.momentum,
      rsi: indicators.rsi,
      macdHistogram: indicators.macd?.histogram ?? null,
      adx: indicators.adx,
      atr: indicators.atr,
      support60d: indicators.support,
      resistance60d: indicators.resistance,
      ema20: indicators.ema20,
      ema50: indicators.ema50,
      ema200: indicators.ema200,
      vwap: indicators.vwap,
      bollingerUpper: indicators.bollinger?.upper ?? null,
      bollingerLower: indicators.bollinger?.lower ?? null,
    },
    fibonacci: indicators.fib ? Object.fromEntries(Object.entries(indicators.fib).map(([k, v]) => [k, v])) : null,
    volumeAnalysis,
    volatility: {
      atrPercent,
      atr: atrVal,
      bollingerWidth,
    },
    dataQuality: {
      hasQuote: true,
      hasFundamentals: quote.trailingPE != null || quote.marketCap != null,
      hasTechnicals: indicators.rsi != null || indicators.macd != null,
      hasCandles: true,
    },
  }
}

export function reasoningToPrompt(ro: ReasoningObject, horizon?: string): string {
  const m = ro.market
  const t = ro.technicals
  const f = ro.fundamentals
  const v = ro.volumeAnalysis
  const vol = ro.volatility
  const lines: string[] = [
    `INSTRUMENT: ${ro.instrument.name} (${ro.instrument.symbol})`,
    `Sector: ${ro.instrument.sector ?? "n/a"} | Industry: ${ro.instrument.industry ?? "n/a"} | Type: ${ro.instrument.assetType}`,
    `Market state: ${m.marketState} | Currency: ${m.currency}`,
    ``,
    `PRICE: ${m.price} (${m.changePercent >= 0 ? "+" : ""}${m.changePercent.toFixed(2)}%)`,
    `Previous close: ${m.previousClose} | Day range: ${m.dayHigh ?? "n/a"} – ${m.dayLow ?? "n/a"}`,
    `52-week range: ${m.weekLow52 ?? "n/a"} – ${m.weekHigh52 ?? "n/a"}`,
    `Volume: ${m.volume ?? "n/a"} | Avg volume: ${m.avgVolume ?? "n/a"} | vs avg: ${v.vsAverage}`,
    `Market cap: ${m.marketCap != null ? m.marketCap.toLocaleString() : "n/a"}`,
    ``,
    `FUNDAMENTALS:`,
    `P/E: ${f.trailingPE ?? "n/a"} (Fwd: ${f.forwardPE ?? "n/a"}) | EPS: ${f.eps ?? "n/a"}`,
    `Div yield: ${f.dividendYield != null ? f.dividendYield.toFixed(2) + "%" : "n/a"} | Beta: ${f.beta ?? "n/a"}`,
    ``,
    `TECHNICALS (computed internally from 1y daily candles):`,
    `Trend: ${t.trend} (strength: ${t.trendStrength}, ADX: ${t.adx ?? "n/a"})`,
    `Momentum: ${t.momentum} | RSI(14): ${t.rsi ?? "n/a"}`,
    `MACD histogram: ${t.macdHistogram != null ? t.macdHistogram.toFixed(2) : "n/a"}`,
    `EMA 20/50/200: ${t.ema20 ?? "n/a"} / ${t.ema50 ?? "n/a"} / ${t.ema200 ?? "n/a"}`,
    `VWAP: ${t.vwap ?? "n/a"} | ATR: ${t.atr != null ? t.atr.toFixed(2) : "n/a"} (${vol.atrPercent != null ? vol.atrPercent.toFixed(1) + "%" : "n/a"})`,
    `Bollinger: ${t.bollingerLower ?? "n/a"} – ${t.bollingerUpper ?? "n/a"} (width: ${vol.bollingerWidth != null ? vol.bollingerWidth.toFixed(1) + "%" : "n/a"})`,
    `Support (60d): ${t.support60d ?? "n/a"} | Resistance (60d): ${t.resistance60d ?? "n/a"}`,
  ]
  if (ro.fibonacci) {
    lines.push(`Fibonacci: ${Object.entries(ro.fibonacci).map(([k, v]) => `${k}: ${v.toFixed(2)}`).join(", ")}`)
  }
  if (horizon) lines.push(`\nRequested horizon: ${horizon}`)
  return lines.join("\n")
}
