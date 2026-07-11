// Pure technical-analysis functions computed from OHLCV candle series.
// All functions are defensive against short series and return safe values.

import type { Candle } from "@/lib/market"

export function sma(values: number[], period: number): number | null {
  if (values.length < period) return null
  const slice = values.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}

export function emaSeries(values: number[], period: number): number[] {
  if (values.length === 0) return []
  const k = 2 / (period + 1)
  const out: number[] = []
  let prev = values[0]
  out.push(prev)
  for (let i = 1; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k)
    out.push(prev)
  }
  return out
}

export function ema(values: number[], period: number): number | null {
  if (values.length < period) return null
  return emaSeries(values, period).at(-1) ?? null
}

function rsiSeries(values: number[], period = 14): number[] {
  if (values.length < period + 1) return []
  const out: number[] = []
  let avgGain = 0
  let avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1]
    if (diff >= 0) avgGain += diff
    else avgLoss -= diff
  }
  avgGain /= period
  avgLoss /= period
  out.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1]
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    out.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
  }
  return out
}

export function rsi(values: number[], period = 14): number | null {
  const s = rsiSeries(values, period)
  return s.at(-1) ?? null
}

// Stochastic RSI — momentum of RSI itself, scaled 0-100.
export function stochRsi(values: number[], period = 14): { k: number; d: number } | null {
  const rs = rsiSeries(values, period)
  if (rs.length < period) return null
  const kSeries: number[] = []
  for (let i = period - 1; i < rs.length; i++) {
    const window = rs.slice(i - period + 1, i + 1)
    const lo = Math.min(...window)
    const hi = Math.max(...window)
    kSeries.push(hi === lo ? 0 : ((rs[i] - lo) / (hi - lo)) * 100)
  }
  const k = sma(kSeries.slice(-3), 3) ?? kSeries.at(-1) ?? 0
  const d = sma(kSeries.slice(-3), 3) ?? k
  return { k, d }
}

export function macd(values: number[]): { macd: number; signal: number; histogram: number } | null {
  if (values.length < 35) return null
  const ema12 = emaSeries(values, 12)
  const ema26 = emaSeries(values, 26)
  const macdLine: number[] = []
  for (let i = 0; i < values.length; i++) macdLine.push(ema12[i] - ema26[i])
  const signalLine = emaSeries(macdLine, 9)
  const m = macdLine.at(-1) ?? 0
  const s = signalLine.at(-1) ?? 0
  return { macd: m, signal: s, histogram: m - s }
}

export function bollinger(values: number[], period = 20, mult = 2): { upper: number; middle: number; lower: number } | null {
  if (values.length < period) return null
  const slice = values.slice(-period)
  const mean = slice.reduce((a, b) => a + b, 0) / period
  const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period
  const sd = Math.sqrt(variance)
  return { upper: mean + mult * sd, middle: mean, lower: mean - mult * sd }
}

export function atr(highs: number[], lows: number[], closes: number[], period = 14): number | null {
  const n = closes.length
  if (n < period + 1) return null
  const trs: number[] = []
  for (let i = 1; i < n; i++) {
    const tr = Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]))
    trs.push(tr)
  }
  return sma(trs, period)
}

// Session/period VWAP over the supplied candles (typical price weighted by volume).
export function vwap(candles: Candle[]): number | null {
  if (!candles.length) return null
  let pv = 0
  let vol = 0
  for (const c of candles) {
    const typical = (c.h + c.l + c.c) / 3
    const v = c.v || 0
    pv += typical * v
    vol += v
  }
  if (vol === 0) return null
  return pv / vol
}

// Average Directional Index — trend strength (0-100).
export function adx(highs: number[], lows: number[], closes: number[], period = 14): number | null {
  const n = closes.length
  if (n < period * 2) return null
  const plusDM: number[] = []
  const minusDM: number[] = []
  const trs: number[] = []
  for (let i = 1; i < n; i++) {
    const up = highs[i] - highs[i - 1]
    const down = lows[i - 1] - lows[i]
    plusDM.push(up > down && up > 0 ? up : 0)
    minusDM.push(down > up && down > 0 ? down : 0)
    trs.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])))
  }
  const smooth = (arr: number[]) => {
    let sum = arr.slice(0, period).reduce((a, b) => a + b, 0)
    const out = [sum]
    for (let i = period; i < arr.length; i++) {
      sum = sum - sum / period + arr[i]
      out.push(sum)
    }
    return out
  }
  const trS = smooth(trs)
  const plusS = smooth(plusDM)
  const minusS = smooth(minusDM)
  const dx: number[] = []
  for (let i = 0; i < trS.length; i++) {
    const pdi = trS[i] === 0 ? 0 : (plusS[i] / trS[i]) * 100
    const mdi = trS[i] === 0 ? 0 : (minusS[i] / trS[i]) * 100
    const denom = pdi + mdi
    dx.push(denom === 0 ? 0 : (Math.abs(pdi - mdi) / denom) * 100)
  }
  return sma(dx.slice(-period), period)
}

export function fib(high: number, low: number) {
  const diff = high - low
  return {
    "0.0": high,
    "0.236": high - diff * 0.236,
    "0.382": high - diff * 0.382,
    "0.5": high - diff * 0.5,
    "0.618": high - diff * 0.618,
    "0.786": high - diff * 0.786,
    "1.0": low,
  }
}

export type Indicators = {
  rsi: number | null
  stochRsi: { k: number; d: number } | null
  macd: { macd: number; signal: number; histogram: number } | null
  ema20: number | null
  ema50: number | null
  ema200: number | null
  sma50: number | null
  bollinger: { upper: number; middle: number; lower: number } | null
  atr: number | null
  vwap: number | null
  adx: number | null
  support: number | null
  resistance: number | null
  fib: ReturnType<typeof fib> | null
  trend: "bullish" | "bearish" | "neutral"
  trendStrength: "weak" | "moderate" | "strong"
  momentum: "accelerating" | "stalling" | "neutral"
}

export function computeIndicators(candles: Candle[]): Indicators {
  const closes = candles.map((c) => c.c)
  const highs = candles.map((c) => c.h)
  const lows = candles.map((c) => c.l)

  const recent = closes.slice(-60)
  const support = recent.length ? Math.min(...recent) : null
  const resistance = recent.length ? Math.max(...recent) : null
  const ema50v = ema(closes, 50)
  const ema200v = ema(closes, 200)
  const price = closes.at(-1) ?? 0
  const adxV = adx(highs, lows, closes)
  const macdV = macd(closes)

  let trend: Indicators["trend"] = "neutral"
  if (ema50v && ema200v) {
    if (price > ema50v && ema50v > ema200v) trend = "bullish"
    else if (price < ema50v && ema50v < ema200v) trend = "bearish"
  } else if (ema50v) {
    trend = price > ema50v ? "bullish" : "bearish"
  }

  const trendStrength: Indicators["trendStrength"] =
    adxV == null ? "weak" : adxV >= 40 ? "strong" : adxV >= 20 ? "moderate" : "weak"

  const momentum: Indicators["momentum"] = !macdV
    ? "neutral"
    : macdV.histogram > 0
      ? "accelerating"
      : macdV.histogram < 0
        ? "stalling"
        : "neutral"

  return {
    rsi: rsi(closes),
    stochRsi: stochRsi(closes),
    macd: macdV,
    ema20: ema(closes, 20),
    ema50: ema50v,
    ema200: ema200v,
    sma50: sma(closes, 50),
    bollinger: bollinger(closes),
    atr: atr(highs, lows, closes),
    vwap: vwap(candles),
    adx: adxV,
    support,
    resistance,
    fib: support != null && resistance != null ? fib(resistance, support) : null,
    trend,
    trendStrength,
    momentum,
  }
}
