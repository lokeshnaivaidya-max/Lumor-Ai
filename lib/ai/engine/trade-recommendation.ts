// lib/ai/engine/trade-recommendation.ts
// Centralized engine that produces a single TradePlan object for the entire application.
// All UI components (Executive Terminal, AI Chat, Institutional Thesis, Risk Metrics) must use this single plan.
// The AI analyzes; the engine produces one validated, consistent trade plan.

import type { ReasoningObject } from "./reasoning"
import type { RiskScores } from "./risk"
import type { ConfidenceResult } from "./confidence"
import type { TradePlan } from "./trade-plan"
import type { Quote } from "@/lib/market"
import type { Indicators } from "@/lib/indicators"

export interface TradePlanContext {
  // Live market data
  quote: Quote
  // Technical analysis
  indicators: Indicators
  // AI-generated reasoning
  reasoning: ReasoningObject
  // Risk assessment
  riskScores: RiskScores
  // Confidence scoring
  confidence: ConfidenceResult
  // Market news/sentiment
  headlines?: string[]
}

export class TradeRecommendationEngine {
  // Thresholds for validation
  private readonly ENTRY_MAX_DISTANCE = 0.20 // 20% of current price (for waiting scenarios)
  private readonly MIN_ENTRY_DISTANCE = 0.0  // For entries very close to current price

  // Generate a single, consistent TradePlan from all analysis components
  generateTradePlan(context: TradePlanContext): TradePlan {
    const currentPrice = context.quote.price
    const indicators = context.indicators
    const reasoning = context.reasoning
    const riskScores = context.riskScores
    const confidence = context.confidence

    // Step 1: Determine initial recommendation and entry levels using AI reasoning
    const recommendedEntry = this.deriveEntryFromContext(context)
    const suggestedTargets = this.deriveTargetsFromContext(context, currentPrice)
    const stopLoss = this.deriveStopLossFromContext(context, currentPrice)
    const recommendation = this.determineRecommendation(context)

    // Step 2: Validate the trade plan
    const entryValidation = this.validateEntryPrice(currentPrice, recommendedEntry)
    let finalRecommendation = recommendation
    if (!entryValidation.isValid && recommendation !== "WAIT") {
      // For invalid entries, revert to WAIT
      finalRecommendation = "WAIT"
    }

    // Step 3: Build institutional reasoning for each level
    const institutionalReasoning = {
      entry: {
        justification: this.buildEntryJustification(context, recommendedEntry, currentPrice),
        supportingFactors: this.buildEntrySupportingFactors(context, recommendedEntry, currentPrice)
      },
      targets: {
        target1: {
          justification: this.buildTargetJustification(context, suggestedTargets.target1, "Target 1"),
          supportingFactors: this.buildTargetSupportingFactors(context, suggestedTargets.target1, "Target 1")
        },
        target2: {
          justification: this.buildTargetJustification(context, suggestedTargets.target2, "Target 2"),
n          supportingFactors: this.buildTargetSupportingFactors(context, suggestedTargets.target2, "Target 2")
        }
      },
      stopLoss: {
        justification: this.buildStopLossJustification(context, stopLoss, currentPrice),
        supportingFactors: this.buildStopLossSupportingFactors(context, stopLoss, currentPrice)
      }
    }

    // Step 4: Build comprehensive technical analysis
    const technicals = {
      trend: indicators.trend,
      trendStrength: indicators.trendStrength,
      rsi: indicators.rsi,
      macdHistogram: indicators.macd?.histogram ?? null,
      adx: indicators.adx,
      support: indicators.support,
      resistance: indicators.resistance,
      vwap: indicators.vwap
    }

    // Step 5: Compile news/sentiment if available
    const news = this.buildNewsSummary(context)

    // Step 6: Extract fundamentals if available
    const fundamentals = {
      pe: context.reasoning.fundamentals?.trailingPE ?? null,
      eps: context.reasoning.fundamentals?.eps ?? null,
      beta: context.reasoning.fundamentals?.beta ?? null,
      marketCap: context.quote.marketCap ?? null
    }

    // Step 7: Build data quality assessment
    const dataQuality = {
      hasLivePrice: true,
      hasTechnicals: reasoning.dataQuality.hasTechnicals && reasoning.dataQuality.hasCandles,
      hasFundamentals: reasoning.dataQuality.hasFundamentals,
      hasNews: context.headlines?.length ? true : false,
      overallScore: this.calculateDataQualityScore(context)
    }

    // Step 8: Construct the final TradePlan
    const tradePlan: TradePlan = {
      // Core trade levels
      currentPrice,
      idealEntry: recommendedEntry,
      target1: suggestedTargets.target1,
      target2: suggestedTargets.target2,
      stopLoss,

      // Analysis and validation
      recommendation: finalRecommendation,
      recommendationReason: this.buildRecommendationReason(context, finalRecommendation),
      confidence: confidence.score,
      confidenceExplanation: confidence.note,

      // Validation data
      entryValidation,

      // Institutional reasoning
      institutionalReasoning,

      // Supporting analysis
      technicals,
      fundamentals: Object.keys(fundamentals).some(k => fundamentals[k as keyof typeof fundamentals] !== null) ? fundamentals : undefined,
      news,
      riskScores: {
        overall: riskScores.overall,
        volatilityScore: riskScores.volatilityScore,
        liquidityScore: riskScores.liquidityScore,
        trendScore: riskScores.trendScore,
        fundamentalScore: riskScores.fundamentalScore,
        conviction: riskScores.conversion
      },

      // Timestamp and metadata
      generatedAt: Date.now(),
      dataQuality
    }

    return tradePlan
  }

  // Determine entry level based on technical analysis and AI reasoning
  private deriveEntryFromContext(context: TradePlanContext): number {
    const currentPrice = context.quote.price
    const indicators = context.indicators

    // Primary: Support levels and key technicals
    let candidateEntries: number[] = []

    // 1. 60-day support level
    if (indicators.support && indicators.support > 0 && indicators.support < currentPrice * 2) {
      candidateEntries.push(indicators.support)
    }

    // 2. VWAP (Volume Weighted Average Price)
    if (indicators.vwap && indicators.vwap > 0 && indicators.vwap < currentPrice * 1.5) {
      candidateEntries.push(indicators.vwap)
    }

    // 3. EMA 20/50 crossover zones
    const ema20 = indicators.ema20
    const ema50 = indicators.ema50
    if (ema20 && ema20 > 0 && ema20 < currentPrice * 1.5) candidateEntries.push(ema20)
    if (ema50 && ema50 > 0 && ema50 < currentPrice * 1.5) candidateEntries.push(ema50)

    // If no candidates found, fall back to current price (for WAIT scenarios)
    if (candidateEntries.length === 0) {
      return currentPrice
    }

    // 4. Use AI reasoning context to adjust entry
    const reasoning = context.reasoning

    // If AI explicitly suggests waiting for pullback, set entry closer to support
    if (reasoning?.technicals?.trend === "bearish" || context.riskScores.trendScore < 40) {
      // For bearish scenarios, favor support levels
      candidateEntries.sort((a, b) => a - b) // Sort ascending (lower entries first)
      return candidateEntries[0] // Use the lowest support level
    }

    // For bullish scenarios, consider VWAP and EMAs
    if (reasoning?.technicals?.trend === "bullish" && context.riskScores.trendScore > 60) {
      candidateEntries.sort((a, b) => b - a) // Sort descending (higher entries first)
      return candidateEntries[0] // Use the highest entry (closer to current price)
    }

    // Default: Use current price if all other options are unrealistic
    return currentPrice
  }

  // Derive target levels based on resistance, technical projections, and risk/reward analysis
  private deriveTargetsFromContext(context: TradePlanContext, currentPrice: number): { target1: number; target2: number } {
    const indicators = context.indicators
    const reasoning = context.reasoning
    const riskScores = context.riskScores

    let target1 = currentPrice * 1.15 // Default: +15%
    let target2 = currentPrice * 1.35 // Default: +35%

    // 1. Use 60-day resistance level when available and realistic
    if (indicators.resistance && indicators.resistance > currentPrice * 1.05) {
      const resistanceTargets = []
      if (indicators.resistance > currentPrice * 1.2) {
        resistanceTargets.push(indicators.resistance * 0.97) // Slight discount to actual resistance
      }
      if (indicators.resistance > currentPrice * 1.1) {
        resistanceTargets.push(indicators.resistance * 0.98)
      }
      resistanceTargets.sort((a, b) => a - b)
      if (resistanceTargets.length > 0) {
        target1 = resistanceTargets[0]
      }
    }

    // 2. Use VWAP breakout levels
    if (indicators.vwap && indicators.vwap > currentPrice * 1.05) {
      const vwapTarget = indicators.vwap * 1.02 // Slight breakout above VWAP
      if (vwapTarget > target1) {
        target1 = vwapTarget
      }
    }

    // 3. Use RSI and MACD signals for target projections
    const rsi = indicators.rsi
    const macdHistogram = indicators.macd?.histogram ?? null

    if (rsi != null && rsi > 60 && rsi < 70) {
      // Strong momentum: extend targets
      target1 *= 1.05
      target2 *= 1.10
    } else if (rsi != null && rsi > 50 && rsi <= 60) {
      // Moderate momentum: maintain targets
    } else if (rsi != null && rsi > 30 && rsi <= 50) {
      // Neutral momentum: reduce targets
      target1 *= 0.95
      target2 *= 0.90
    } else if (rsi != null && rsi <= 30) {
      // Bearish momentum: significantly reduce targets
      target1 *= 0.90
      target2 *= 0.80
    }

    if (macdHistogram != null && macdHistogram > 0.1) {
      // Positive MACD: extend targets
      target2 *= 1.05
    } else if (macdHistogram != null && macdHistogram < -0.1) {
      // Negative MACD: reduce targets
      target2 *= 0.90
    }

    // 4. Incorporate ADX strength for trend-based targets
    if (indicators.adx != null) {
      if (indicators.adx >= 40) {
        // Strong trend: aggressive targets
        target1 *= 1.10
        target2 *= 1.20
      } else if (indicators.adx >= 25) {
        // Moderate trend: normal targets
      } else {
        // Weak trend: conservative targets
        target1 *= 0.95
        target2 *= 0.90
      }
    }

    // 5. Apply risk/reward ratio based on risk scores
    const conviction = riskScores.conversion
    if (conviction >= 80) {
      // High conviction: wider targets
      target2 = Math.max(target2, currentPrice * 1.5)
    } else if (conviction <= 40) {
      // Low conviction: tighter targets
      target2 = Math.min(target2, currentPrice * 1.2)
    }

    // 6. Ensure minimum distance between levels for institutional quality
    const minTargetSpacing = Math.max(currentPrice * 0.01, 10) // At least 1% or $10
    const minTarget1 = Math.max(target1, currentPrice * 1.01) // At least 1% above current
    if (target1 - currentPrice < minTargetSpacing) {
      target1 = currentPrice + minTargetSpacing
    }

    if (target2 - target1 < minTargetSpacing) {
      target2 = target1 + minTargetSpacing
    }

    return { target1, target2 }
  }

  // Derive stop loss level based on ATR, support levels, and risk management principles
  private deriveStopLossFromContext(context: TradePlanContext, currentPrice: number): number {
    const indicators = context.indicators
    const reasoning = context.reasoning

    let stopLoss = currentPrice * 0.98 // Default: 2% below current

    // 1. Prioritize 60-day support level
    if (indicators.support && indicators.support < currentPrice * 0.95) {
      // If support is below current price, use that as primary stop
      stopLoss = indicators.support * 1.02 // Slightly above support for buffer
    } else if (indicators.support && indicators.support > 0) {
      // If support is above current, use ATR-based stop loss
      if (indicators.atr && indicators.atr > 0) {
        stopLoss = currentPrice - indicators.atr * 1.5
      }
    }

    // 2. Apply ATR-based dynamic stops when support not available
    if (indicators.atr && indicators.atr > 0) {
      const atrStop = currentPrice - indicators.atr * 1.5
      if (Math.abs(atrStop - stopLoss) < Math.abs(stopLoss - currentPrice) * 0.5) {
        // Prefer ATR-based stops if they're tighter but still reasonable
        stopLoss = atrStop
      }
    }

    // 3. Use VWAP as secondary reference
    if (indicators.vwap) {
      const vwapStop = indicators.vwap * 0.98
      if (Math.abs(vwapStop - stopLoss) < Math.abs(stopLoss - currentPrice) * 0.3) {
        stopLoss = vwapStop
      }
    }

    // 4. Consider RSI for stop levels
    const rsi = indicators.rsi
    if (rsi != null && rsi > 70) {
      // Overbought: tighter stop
      stopLoss = Math.max(stopLoss, currentPrice * 0.95)
    } else if (rsi != null && rsi < 30) {
      // Oversold: wider stop for bounce plays
      stopLoss = Math.min(stopLoss, currentPrice * 0.985)
    }

    // 5. Incorporate AI reasoning into stop placement
    if (reasoning.technicals.trend === "bearish" && reasoning.technicals.trendStrength === "strong") {
      // For strong bearish scenarios, place stop further away
      stopLoss = Math.min(stopLoss, currentPrice * 1.02) // Allow more room
    }

    // 6. Ensure stop loss is practical and not unrealistic
    const minDistanceFromCurrent = currentPrice * 0.005 // At least 0.5%
    if (Math.abs(stopLoss - currentPrice) < minDistanceFromCurrent) {
      stopLoss = currentPrice - minDistanceFromCurrent
    }

    return stopLoss
  }

  // Validate that entry price is realistic within institutional standards
  private validateEntryPrice(currentPrice: number, entry: number): TradePlan["entryValidation"] {
    const distance = Math.abs(entry - currentPrice) / currentPrice

    // Allow entries from very close to current price up to 20% away (for waiting scenarios)
    const isValid = distance >= 0.0 && distance <= this.ENTRY_MAX_DISTANCE

    let reason = ""
    if (distance > this.ENTRY_MAX_DISTANCE) {
      reason = `Entry ${entry.toFixed(2)} is ${Math.round(distance * 100)}% away from current price ${currentPrice.toFixed(2)}, which exceeds the maximum recommended distance of ${Math.round(this.ENTRY_MAX_DISTANCE * 100)}% for immediate entries.`
    } else if (entry === currentPrice) {
      reason = "Entry at current price is valid for immediate trade execution."
    } else if (distance >= 0.05 && distance <= this.ENTRY_MAX_DISTANCE) {
      // 5-20% away is acceptable for pullback entries (with justification)
      reason = `Entry ${entry.toFixed(2)} is ${Math.round(distance * 100)}% away from current price ${currentPrice.toFixed(2)}, which is acceptable for pullback entries."
    }

    return {
      isValid,
      distanceFromCurrentPrice: distance,
      reason: isValid ? undefined : reason
    }
  }

  // Determine recommendation based on risk, conviction, and market conditions
  private determineRecommendation(context: TradePlanContext): TradePlan["recommendation"] {
    const riskScores = context.riskScores
    const confidence = context.confidence
    const reasoning = context.reasoning

    // High risk or low confidence → WAIT
    if (riskScores.overall === "High" || confidence.score < 40) {
      return "WAIT"
    }

    // Strong bullish signals with good conviction → BUY
    if (
      reasoning.technicals.trend === "bullish" &&
      reasoning.technical[trendStrength === "strong" &&
      riskScores.trendScore > 60 &&
      riskScores.conversion > 60
    ) {
      return "BUY"
    }

    // Strong bearish signals with good conviction → SELL
    if (
      reasoning.technicals.trend === "bearish" &&
      reasoning.technical[trendStrength === "strong" &&
      riskScores.trendScore > 60 &&
      riskScores.conversion > 60
    ) {
      return "SELL"
    }

    // Default neutral stance
    return "WAIT"
  }

  // Build comprehensive justification for entry level
  private buildEntryJustification(context: TradePlanContext, entry: number, currentPrice: number): string {
    const indicators = context.indicators
    const reasoning = context.reasoning

    if (entry === currentPrice) {
      return "Entry at current price with immediate execution opportunity."
    }

    const distance = Math.abs(entry - currentPrice) / currentPrice
    const reasonPrefix = distance >= 0.05 ? "Pullback entry at" : "Entry at"

    let justification = ""

    // Support-based entry
    if (indicators.support && Math.abs(entry - indicators.support) < 0.01) {
      justification = `${reasonPrefix} ${entry.toFixed(2)} near 60-day support level of ${indicators.support.toFixed(2)}, providing downside protection and strong technical foundation."
    }

    // VWAP-based entry
    else if (indicators.vwap && Math.abs(entry - indicators.vwap) < 0.01) {
      justification = `${reasonPrefix} ${entry.toFixed(2)} near Volume Weighted Average Price of ${indicators.vwap.toFixed(2)}, indicating value at institutional average price."
    }

    // EMA-based entry
    else if (indicators.ema50 && Math.abs(entry - indicators.ema50) < 0.01) {
      justification = `${reasonPrefix} ${entry.toFixed(2)} aligned with 50-day Exponential Moving Average, reflecting medium-term trend alignment."
    }

    // Strategy-based entry based on trend and risk
    else {
      const strategy = context.reasoning.technical[trend === "bullish" ? " Uptrend favor" : " Bearish trend favors"]
      justification = `${reasonPrefix} ${entry.toFixed(2)} based on ${strategy} with ${context.riskScores.conversion}% conviction."
    }

    return justification
  }

  // Build supporting factors for entry level
  private buildEntrySupportingFactors(context: TradePlanContext, entry: number, currentPrice: number): string[] {
    const factors = []
    const indicators = context.indicators

    // Technical factors
    if (indicators.support && indicators.support <= entry * 1.02) {
      factors.push(`60-day support at ${indicators.support.toFixed(2)}")
    }
    if (indicators.vwap && indicators.vwap <= entry * 1.02) {
      factors.push(`VWAP at ${indicators.vwap.toFixed(2)}")
    }
    if (indicators.ema20 && indicators.ema20 <= entry * 1.02) {
      factors.push(`EMA 20 at ${indicators.ema20.toFixed(2)}")
    }

    // Risk-based factors
    if (context.riskScores.overall === "Low" || context.riskScores.overall === "Medium") {
      factors.push(`${context.riskScores.overall} risk profile")
    }

    if (reasoning.technicals.trend === "bullish" && reasoning.technical[trendStrength === "strong") {
      factors.push("Strong bullish trend")
    }

    if (reasoning.technicals.adx && indicators.adx > 25) {
      factors.push(`ADX ${indicators.adx.toFixed(1)} - strong trend confirmation")
    }

    // Market structure factors
    if (reasoning.market.volumeAnalysis.vsAverage === "above") {
      factors.push("Volume above average")
    }

    return factors
  }

  // Build justification for target levels
  private buildTargetJustification(context: TradePlanContext, target: number, targetLabel: string): string {
    const indicators = context.indicators
    const reasoning = context.reasoning

    if (indicators.resistance && target <= indicators.resistance * 1.02) {
      return `${targetLabel} at ${target.toFixed(2)} aligns with 60-day resistance of ${indicators.resistance.toFixed(2)}, providing institutional-grade profit target.`
    }

    if (indicators.vwap && target >= indicators.vwap * 1.02) {
      return `${targetLabel} at ${target.toFixed(2)} represents breakout above VWAP at ${indicators.vwap.toFixed(2)}, indicating momentum continuation.`
    }

    if (target >= reasoning.market.price * 1.15) {
      return `${targetLabel} at ${target.toFixed(2)} reflects ${((target - reasoning.market.price) / reasoning.market.price * 100).toFixed(1)}% upside target based on technical momentum and risk/reward analysis.`
    }

    return `${targetLabel} at ${target.toFixed(2)} based on institutional analysis and risk management principles.`
  }

  // Build supporting factors for targets
  private buildTargetSupportingFactors(context: TradePlanContext, target: number, targetLabel: string): string[] {
    const factors = []
    const indicators = context.indicators

    // Technical resistance levels
    if (indicators.resistance && target <= indicators.resistance * 1.02) {
      factors.push(`60-day resistance at ${indicators.resistance.toFixed(2)}")
    }

    // Trend and momentum
    if (context.riskScores.conversion > 60) {
      factors.push(`${context.riskScores.conversion}% conviction`)`
    }

    // Time-based projections
    const timeHorizon = context.reasoning.horizon || "medium"
    if (timeHorizon === "long") {
      factors.push("Long-term trend alignment")
    }

    return factors
  }

  // Build justification for stop loss
  private buildStopLossJustification(context: TradePlanContext, stopLoss: number, currentPrice: number): string {
    const indicators = context.indicators

    if (indicators.support && stopLoss >= indicators.support * 1.02) {
      return `Stop loss at ${stopLoss.toFixed(2)} placed just above 60-day support at ${indicators.support.toFixed(2)}, balancing risk protection with trade viability.`
    }

    if (indicators.atr && indicators.atr > 0) {
      const distanceFromCurrent = (stopLoss - currentPrice) / currentPrice * 100
      return `Stop loss at ${stopLoss.toFixed(2)} positioned ${Math.abs(distanceFromCurrent).toFixed(1)}% from current price using ATR dynamic sizing for risk management.`
    }

    return `Stop loss at ${stopLoss.toFixed(2)} based on institutional risk management principles, providing appropriate downside protection.`
  }

  // Build supporting factors for stop loss
  private buildStopLossSupportingFactors(context: TradePlanContext, stopLoss: number, currentPrice: number): string[] {
    const factors = []
    const indicators = context.indicators

    // Technical basis
    if (indicators.support && stopLoss >= indicators.support * 1.02) {
      factors.push(`Structural support at ${indicators.support.toFixed(2)}")
    }

    if (indicators.atr && indicators.atr > 0) {
      const atrDistance = (stopLoss - currentPrice) / indicators.atr
      factors.push(`ATR-based (${atrDistance.toFixed(1)} ATR distance)`)`
    }

    // Risk management
    const riskRatio = (stopLoss - currentPrice) / (context.reasoning.technicals.support60d || currentPrice) * 100
    if (Math.abs(riskRatio) > 5) {
      factors.push(`Strategic risk ratio: ${Math.abs(riskRatio).toFixed(1)}%`)`
    }

    return factors
  }

  // Build recommendation reason
  private buildRecommendationReason(context: TradePlanContext, recommendation: TradePlan["recommendation"]): string {
    const riskScores = context.riskScores
    const reasoning = context.reasoning

    switch (recommendation) {
      case "BUY":
        return `Bullish technical alignment with ${riskScores.conversion}% conviction. Key support levels identified with favorable risk/reward ratio.`
      case "SELL":
        return `Bearish technical alignment with ${riskScores.conversion}% conviction. Key resistance levels present with declining momentum indicators.`
      case "WAIT":
        return riskScores.overall === "High"
          ? "High risk environment requires caution. Await more definitive signals or reduction in market volatility."
          : "Neutral market conditions with mixed signals. Waiting for clearer directional bias or improved risk profile."
    }
  }

  // Build news/sentiment summary
  private buildNewsSummary(context: TradePlanContext): TradePlan["news"] {
    if (!context.headlines || context.headlines.length === 0) {
      return undefined
    }

    const sentimentCounts = {
      positive: 0,
      negative: 0,
      neutral: 0
    }

    context.headlines.forEach(headline => {
      const lower = headline.toLowerCase()
      if (lower.includes("rise") || lower.includes("growth") || lower.includes("positive") || lower.includes("bull")) {
        sentimentCounts.positive++
      } else if (lower.includes("fall") || lower.includes("decline") || lower.includes("negative") || lower.includes("bear")) {
        sentimentCounts.negative++
      } else {
        sentimentCounts.neutral++
      }
    })

    let overall: "positive" | "negative" | "neutral" = "neutral"
    if (sentimentCounts.positive > sentimentCounts.negative && sentimentCounts.positive > sentimentCounts.neutral) {
      overall = "positive"
    } else if (sentimentCounts.negative > sentimentCounts.positive && sentimentCounts.negative > sentimentCounts.neutral) {
      overall = "negative"
    }

    return {
      sentiment: overall,
      headlines: context.headlines
    }
  }

  // Calculate data quality score
  private calculateDataQualityScore(context: TradePlanContext): number {
    const quality = context.reasoning.dataQuality

    let score = 0
    if (quality.hasQuote) score += 20
    if (quality.hasFundamentals) score += 25
    if (quality.hasTechnicals) score += 25
    if (quality.hasCandles) score += 10

    if (context.reasoning.fundamentals?.trailingPE != null) score += 10
    if (context.reasoning.fundamentals?.eps != null) score += 10

    return Math.min(score, 100)
  }
}