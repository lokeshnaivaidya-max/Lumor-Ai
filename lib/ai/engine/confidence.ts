import type { ReasoningObject } from "./reasoning"

export type ConfidenceResult = {
  score: number
  factors: {
    trend: number
    liquidity: number
    volume: number
    fundamentals: number
    dataQuality: number
  }
  note: string
}

function clamp(v: number, min = 20, max = 95): number {
  return Math.round(Math.max(min, Math.min(max, v)))
}

export function computeConfidence(ro: ReasoningObject): ConfidenceResult {
  const t = ro.technicals
  const m = ro.market
  const dq = ro.dataQuality

  let trendScore = 30
  if (t.trend === "bullish" && t.trendStrength === "strong") trendScore = 85
  else if (t.trend === "bullish" && t.trendStrength === "moderate") trendScore = 70
  else if (t.trend === "bearish" && t.trendStrength === "strong") trendScore = 75
  else if (t.trend === "bearish" && t.trendStrength === "moderate") trendScore = 60
  else if (t.trend === "neutral") trendScore = 40

  const liquidityScore = m.volume && m.avgVolume
    ? Math.min(100, Math.round((m.volume / m.avgVolume) * 50)) + 30
    : 30

  const volumeScore = (() => {
    if (m.volume == null || m.avgVolume == null) return 40
    const ratio = m.volume / m.avgVolume
    if (ratio > 1.5) return 85
    if (ratio > 1) return 70
    if (ratio > 0.7) return 55
    return 35
  })()

  const fundamentalScore = (() => {
    let score = 40
    if (m.marketCap != null && m.marketCap > 1e10) score += 20
    if (ro.fundamentals.trailingPE != null && ro.fundamentals.trailingPE > 0 && ro.fundamentals.trailingPE < 50) score += 15
    if (ro.fundamentals.eps != null && ro.fundamentals.eps > 0) score += 10
    return Math.min(score, 90)
  })()

  const dataQualityScore = (() => {
    let score = 50
    if (dq.hasQuote) score += 15
    if (dq.hasFundamentals) score += 10
    if (dq.hasTechnicals) score += 15
    if (dq.hasCandles) score += 10
    return Math.min(score, 100)
  })()

  const rawScore = (trendScore * 0.25 + liquidityScore * 0.15 + volumeScore * 0.15 + fundamentalScore * 0.2 + dataQualityScore * 0.25)
  const score = clamp(rawScore)

  const factors = { trend: trendScore, liquidity: liquidityScore, volume: volumeScore, fundamentals: fundamentalScore, dataQuality: dataQualityScore }

  let note: string
  if (score >= 80) note = "Strong conviction — trend, data quality, and activity all support the view."
  else if (score >= 60) note = "Moderate conviction — some signals align, but not all data is conclusive."
  else note = "Low conviction — data is thin or signals are mixed. Caution advised."

  if (!dq.hasTechnicals || !dq.hasFundamentals) {
    note += " Limited data availability reduces confidence."
  }

  return { score, factors, note }
}
