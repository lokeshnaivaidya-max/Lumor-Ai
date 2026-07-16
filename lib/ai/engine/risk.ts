import type { ReasoningObject } from "./reasoning"

export type RiskScores = {
  overall: "Low" | "Medium" | "High"
  volatilityScore: number
  liquidityScore: number
  trendScore: number
  fundamentalScore: number
  conviction: number
  breakdown: {
    volatility: string
    liquidity: string
    trend: string
    fundamentals: string
  }
}

export function computeRiskScores(ro: ReasoningObject): RiskScores {
  const t = ro.technicals
  const m = ro.market
  const v = ro.volatility
  const vol = ro.volumeAnalysis

  const volatilityScore = v.atrPercent != null
    ? v.atrPercent > 3 ? 90 : v.atrPercent > 1.5 ? 60 : 30
    : 50

  const liquidityScore = (() => {
    if (!m.volume || !m.avgVolume) return 50
    const ratio = m.volume / m.avgVolume
    if (ratio < 0.3) return 80
    if (ratio < 0.7) return 50
    return 20
  })()

  const trendScore = (() => {
    if (t.adx == null) return 50
    if (t.adx >= 40) return 20
    if (t.adx >= 25) return 40
    if (t.adx >= 20) return 60
    return 80
  })()

  const fundamentalScore = (() => {
    let score = 50
    if (m.marketCap != null && m.marketCap < 1e9) score += 20
    if (ro.fundamentals.beta != null && ro.fundamentals.beta > 2) score += 15
    if (ro.fundamentals.trailingPE == null) score += 10
    return Math.min(score, 100)
  })()

  const overallNum = Math.round((volatilityScore + liquidityScore + trendScore + fundamentalScore) / 4)
  const overall = overallNum >= 70 ? "High" : overallNum >= 40 ? "Medium" : "Low"

  const conviction = Math.round(100 - overallNum)

  return {
    overall,
    volatilityScore,
    liquidityScore,
    trendScore,
    fundamentalScore,
    conviction,
    breakdown: {
      volatility: v.atrPercent != null
        ? `ATR ${v.atrPercent.toFixed(1)}% of price`
        : "Volatility data unavailable",
      liquidity: m.volume && m.avgVolume
        ? `Volume ${vol.ratio != null ? (vol.ratio * 100).toFixed(0) + "%" : "n/a"} of average`
        : "Liquidity data unavailable",
      trend: t.adx != null
        ? `ADX ${t.adx.toFixed(1)} (${t.trendStrength})`
        : "Trend strength unavailable",
      fundamentals: m.marketCap != null
        ? `Market cap ${(m.marketCap / 1e7).toFixed(0)}Cr`
        : "Fundamental data unavailable",
    },
  }
}
