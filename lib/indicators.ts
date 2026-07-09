// Pure technical-analysis functions computed from a close-price series.
// All functions are defensive against short series and return safe values.

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

export function rsi(values: number[], period = 14): number | null {
  if (values.length < period + 1) return null
  let gains = 0
  let losses = 0
  for (let i = values.length - period; i < values.length; i++) {
    const diff = values[i] - values[i - 1]
    if (diff >= 0) gains += diff
    else losses -= diff
  }
  const avgGain = gains / period
  const avgLoss = losses / period
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

export function macd(values: number[]): {
  macd: number
  signal: number
  histogram: number
} | null {
  if (values.length < 35) return null
  const ema12 = emaSeries(values, 12)
  const ema26 = emaSeries(values, 26)
  const macdLine: number[] = []
  for (let i = 0; i < values.length; i++) {
    macdLine.push(ema12[i] - ema26[i])
  }
  const signalLine = emaSeries(macdLine, 9)
  const m = macdLine.at(-1) ?? 0
  const s = signalLine.at(-1) ?? 0
  return { macd: m, signal: s, histogram: m - s }
}

export function bollinger(
  values: number[],
  period = 20,
  mult = 2,
): { upper: number; middle: number; lower: number } | null {
  if (values.length < period) return null
  const slice = values.slice(-period)
  const mean = slice.reduce((a, b) => a + b, 0) / period
  const variance =
    slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period
  const sd = Math.sqrt(variance)
  return { upper: mean + mult * sd, middle: mean, lower: mean - mult * sd }
}

export function atr(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14,
): number | null {
  const n = closes.length
  if (n < period + 1) return null
  const trs: number[] = []
  for (let i = 1; i < n; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1]),
    )
    trs.push(tr)
  }
  return sma(trs, period)
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
  macd: { macd: number; signal: number; histogram: number } | null
  ema20: number | null
  ema50: number | null
  ema200: number | null
  sma50: number | null
  bollinger: { upper: number; middle: number; lower: number } | null
  atr: number | null
  support: number | null
  resistance: number | null
  fib: ReturnType<typeof fib> | null
  trend: "bullish" | "bearish" | "neutral"
}

export function computeIndicators(
  closes: number[],
  highs?: number[],
  lows?: number[],
): Indicators {
  const h = highs ?? closes
  const l = lows ?? closes
  const recent = closes.slice(-60)
  const support = recent.length ? Math.min(...recent) : null
  const resistance = recent.length ? Math.max(...recent) : null
  const ema50v = ema(closes, 50)
  const ema200v = ema(closes, 200)
  const price = closes.at(-1) ?? 0

  let trend: Indicators["trend"] = "neutral"
  if (ema50v && ema200v) {
    if (price > ema50v && ema50v > ema200v) trend = "bullish"
    else if (price < ema50v && ema50v < ema200v) trend = "bearish"
  } else if (ema50v) {
    trend = price > ema50v ? "bullish" : "bearish"
  }

  return {
    rsi: rsi(closes),
    macd: macd(closes),
    ema20: ema(closes, 20),
    ema50: ema50v,
    ema200: ema200v,
    sma50: sma(closes, 50),
    bollinger: bollinger(closes),
    atr: atr(h, l, closes),
    support,
    resistance,
    fib: support != null && resistance != null ? fib(resistance, support) : null,
    trend,
  }
}
