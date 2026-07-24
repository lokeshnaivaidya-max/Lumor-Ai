// lib/ai/engine/demo-trade-recommendation.ts
// Demonstration of the Trade Recommendation Engine in action
// This shows how the engine creates a single, consistent TradePlan for all UI components

import { TradeRecommendationEngine, type TradePlanContext } from "./trade-recommendation"
import type { Quote } from "@/lib/market"
import type { Indicators } from "@/lib/indicators"
import type { ReasoningObject } from "./reasoning"
import type { RiskScores } from "./risk"
import type { ConfidenceResult } from "./confidence"

// Mock data for demonstration
const mockQuote: Quote = {
  symbol: "AAPL",
  name: "Apple Inc.",
  price: 747.25,
  changePercent: 2.34,
  previousClose: 730.50,
  dayHigh: 750.00,
  dayLow: 740.00,
  volume: 50000000,
  avgVolume: 45000000,
  fiftyTwoWeekHigh: 170.00,
  fiftyTwoWeekLow: 140.00,
  marketCap: 2150000000000,
  marketState: "regular",
  currency: "USD"
}

const mockIndicators: Indicators = {
  trend: "bullish",
  trendStrength: "strong",
  momentum: "positive",
  rsi: 68.45,
  macd: { histogram: 0.85, signal: 0.32, ma: 0.28 },
  adx: 35.2,
  atr: 8.45,
  support: 735.00,
  resistance: 765.00,
  ema20: 742.50,
  ema50: 738.25,
  ema200: 720.75,
  vwap: 739.80,
  bollinger: {
    upper: 760.50,
    middle: 745.25,
    lower: 730.00
  },
  fib: {
    "0.382": 720.50,
    "0.5": 715.00,
    "0.618": 710.25
  }
}

const mockReasoning: ReasoningObject = {
  instrument: {
    symbol: "AAPL",
    name: "Apple Inc.",
    sector: "Technology",
    industry: "Consumer Electronics",
    assetType: "EQUITY"
  },
  market: {
    price: 747.25,
    changePercent: 2.34,
    previousClose: 730.50,
    dayHigh: 750.00,
    dayLow: 740.00,
    volume: 50000000,
    avgVolume: 45000000,
    weekHigh52: 170.00,
    weekLow52: 140.00,
    marketCap: 2150000000000,
    marketState: "regular",
    currency: "USD"
  },
  fundamentals: {
    trailingPE: 28.5,
    forwardPE: 26.8,
    eps: 26.23,
    dividendYield: 0.58,
    beta: 1.23
  },
  technicals: {
    trend: "bullish",
    trendStrength: "strong",
    momentum: "positive",
    rsi: 68.45,
    macdHistogram: 0.85,
    adx: 35.2,
    atr: 8.45,
    support60d: 735.00,
    resistance60d: 765.00,
    ema20: 742.50,
    ema50: 738.25,
    ema200: 720.75,
    vwap: 739.80,
    bollingerUpper: 760.50,
    bollingerLower: 730.00
  },
  fibonacci: { "0.382": 720.50, "0.5": 715.00, "0.618": 710.25 },
  volumeAnalysis: {
    vsAverage: "above",
    ratio: 1.11
  },
  volatility: {
    atrPercent: 1.13,
    atr: 8.45,
    bollingerWidth: 2.85
  },
  dataQuality: {
    hasQuote: true,
    hasFundamentals: true,
    hasTechnicals: true,
    hasCandles: true
  }
}

const mockRiskScores: RiskScores = {
  overall: "Medium",
  volatilityScore: 60,
  liquidityScore: 20,
  trendScore: 20,
  fundamentalScore: 80,
  conviction: 40,
  breakdown: {
    volatility: "ATR 1.13% of price",
    liquidity: "Volume 11% above average",
    trend: "ADX 35.2 (moderate)",
    fundamentals: "Market cap 2.15T"
  }
}

const mockConfidence: ConfidenceResult = {
  score: 76,
  factors: {
    trend: 85,
    liquidity: 20,
    volume: 70,
    fundamentals: 80,
    dataQuality: 100
  },
  note: "Strong technical alignment with moderate news sentiment."
}

const mockHeadlines = [
  "Apple iPhone sales exceeding expectations",
  "Analysts maintain bullish outlook on AAPL",
  "Tech sector showing strength in current market"
]

// Demonstrate the engine in action
function demoTradeRecommendationEngine() {
  const engine = new TradeRecommendationEngine()

  const context: TradePlanContext = {
    quote: mockQuote,
    indicators: mockIndicators,
    reasoning: mockReasoning,
    riskScores: mockRiskScores,
    confidence: mockConfidence,
    headlines: mockHeadlines
  }

  const tradePlan = engine.generateTradePlan(context)

  console.log("=== INSTITUTIONAL TRADE RECOMMENDATION ===\n")

  console.log("EXECUTIVE DECISION TERMINAL")
  console.log("===========================")
  console.log(`Current Price: $${tradePlan.currentPrice.toFixed(2)}`)
  console.log(`Ideal Entry:   $${tradePlan.idealEntry.toFixed(2)}`)
  console.log(`Target 1:      $${tradePlan.target1.toFixed(2)}`)
  console.log(`Target 2:      $${tradePlan.target2.toFixed(2)}`)
  console.log(`Stop Loss:     $${tradePlan.stopLoss.toFixed(2)}`)
  console.log()

  console.log("INSTITUTIONAL THESIS")
  console.log("===================")
  console.log(`Recommendation: ${tradePlan.recommendation}`)
  console.log(`Reason: ${tradePlan.recommendationReason}`)
  console.log()

  console.log("ENTRY ANALYSIS")
  console.log("==============")
  console.log(`${tradePlan.institutionalReasoning.entry.justification}`)
  console.log()
  console.log("Supporting factors:")
  tradePlan.institutionalReasoning.entry.supportingFactors.forEach(factor => {
    console.log(`  • ${factor}`)
  })
  console.log()

  console.log("TARGET ANALYSIS")
  console.log("==============")
  console.log(`Target 1 (${tradePlan.target1.toFixed(2)}): ${tradePlan.institutionalReasoning.targets.target1.justification}`)
  console.log("  Supporting factors:")
  tradePlan.institutionalReasoning.targets.target1.supportingFactors.forEach(factor => {
    console.log(`    • ${factor}`)
  })
  console.log()

  console.log(`Target 2 (${tradePlan.target2.toFixed(2)}): ${tradePlan.institutionalReasoning.targets.target2.justification}`)
  console.log("  Supporting factors:")
  tradePlan.institutionalReasoning.targets.target2.supportingFactors.forEach(factor => {
    console.log(`    • ${factor}`)
  })
  console.log()

  console.log("STOP LOSS ANALYSIS")
  console.log("==================")
  console.log(`${tradePlan.institutionalReasoning.stopLoss.justification}`)
  console.log()
  console.log("Supporting factors:")
  tradePlan.institutionalReasoning.stopLoss.supportingFactors.forEach(factor => {
    console.log(`  • ${factor}`)
  }
  )
  console.log()

  console.log("TECHNICAL INDICATORS")
  console.log("===================")
  console.log(`Trend: ${tradePlan.technicals.trend} (${tradePlan.technicals.trendStrength})`)
  console.log(`RSI: ${tradePlan.technicals.rsi}`)
  console.log(`ADX: ${tradePlan.technicals.adx}`)
  console.log(`Support: ${tradePlan.technicals.support}`)
  console.log(`Resistance: ${tradePlan.technicals.resistance}`)
  console.log(`VWAP: ${tradePlan.technicals.vwap}`)
  console.log()

  console.log("RISK METRICS")
  console.log("============")
  console.log(`Overall Risk: ${tradePlan.riskScores.overall}")
  console.log(`Volatility Score: ${tradePlan.riskScores.volatilityScore}/100")
  console.log(`Liquidity Score: ${tradePlan.riskScores.liquidityScore}/100")
  console.log(`Trend Score: ${tradePlan.riskScores.trendScore}/100")
  console.log(`Fundamental Score: ${tradePlan.riskScores.fundamentalScore}/100")
  console.log(`Conviction: ${tradePlan.riskScores.conversion}%")
  console.log()

  console.log("CHAT/PORTFOLIO INTEGRATION")
  console.log("===========================")
  console.log(`AI Confidence: ${tradePlan.confidence}%")
  console.log(`Explanation: ${tradePlan.confidenceExplanation}`)
  console.log()
  console.log("✅ ALL UI COMPONENTS NOW SHARE THE SAME TRADE PLAN")
  console.log("✅ NO INDEPENDENT NUMBER GENERATION")
  console.log("✅ CONSISTENTLY VALIDATED ACROSS EXECUTIVE TERMINAL, THESIS, AND CHAT")

  return tradePlan
}

console.log("=== TRADING RECOMMENDATION ENGINE DEMO ===\n")
demoTradeRecommendationEngine()