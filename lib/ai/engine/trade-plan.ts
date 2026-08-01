// Trade plan object definition - creates a single, consistent interface for all UI components
export type TradePlan = {
  // Core trading levels - single source of truth across the entire application
  currentPrice: number
  idealEntry: number
  target1: number
  target2: number
  stopLoss: number

  // Analysis and validation results
  recommendation: "BUY" | "SELL" | "WAIT"
  recommendationReason: string
  confidence: number // 0-100 score
  confidenceExplanation: string

  // Entry validation rules for institutional quality
  entryValidation: {
    isValid: boolean
    distanceFromCurrentPrice: number // percentage
    reason?: string
  }

  // Institutional reasoning for each level
  institutionalReasoning: {
    entry: {
      justification: string
      supportingFactors: string[]
    }
    targets: {
      target1: { justification: string; supportingFactors: string[] }
      target2: { justification: string; supportingFactors: string[] }
    }
    stopLoss: {
      justification: string
      supportingFactors: string[]
    }
  }

  // Technical analysis data for context
  technicals: {
    trend: string
    trendStrength: string
    rsi: number | null
    macdHistogram: number | null
    adx: number | null
    support: number | null
    resistance: number | null
    vwap: number | null
  }
  fundamentals?: {
    pe: number | null
    eps: number | null
    beta: number | null
    marketCap: number | null
  }
  news?: {
    sentiment: "positive" | "negative" | "neutral"
    headlines: string[]
  }
  riskScores?: {
    overall: "Low" | "Medium" | "High"
    volatilityScore: number
    liquidityScore: number
    trendScore: number
    fundamentalScore: number
    conviction: number
  }

  // Metadata and quality scoring
  generatedAt: number // timestamp
  dataQuality: {
    hasLivePrice: boolean
    hasTechnicals: boolean
    hasFundamentals: boolean
    hasNews: boolean
    overallScore: number // 0-100
  }
}