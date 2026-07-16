import type { ReasoningObject } from "./reasoning"

export type ValidationResult = {
  valid: boolean
  missing: string[]
  warnings: string[]
}

export function validateReasoningObject(ro: ReasoningObject): ValidationResult {
  const missing: string[] = []
  const warnings: string[] = []

  if (!ro.market.price || ro.market.price <= 0) missing.push("Price")
  if (ro.market.volume == null || ro.market.volume <= 0) warnings.push("Volume unavailable — liquidity may be low")
  if (!ro.instrument.symbol) missing.push("Symbol")
  if (!ro.instrument.name) missing.push("Company name")

  if (!ro.dataQuality.hasQuote) missing.push("Quote data")
  if (!ro.dataQuality.hasCandles) warnings.push("Candle data unavailable — technicals may be incomplete")

  if (ro.technicals.rsi == null) warnings.push("RSI unavailable — momentum assessment limited")
  if (ro.technicals.adx == null) warnings.push("ADX unavailable — trend strength assessment limited")

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  }
}
