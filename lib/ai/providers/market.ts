import { getQuote, getChart, type Quote, type Candle } from "@/lib/market"
import { withFallback, type Provider } from "./registry"

export type MarketData = {
  quote: Quote
  candles: Candle[]
}

const yahooProvider: Provider<MarketData> = {
  name: "Yahoo Finance",
  isAvailable: () => true,
  async fetch(symbol: string) {
    const [quote, candles] = await Promise.all([
      getQuote(symbol, { withFundamentals: true }),
      getChart(symbol, "1y", "1d"),
    ])
    if (!quote) return null
    return { quote, candles }
  },
}

export async function fetchMarketData(symbol: string, signal?: AbortSignal): Promise<MarketData | null> {
  return withFallback([yahooProvider], symbol, signal).then((r) => r?.data ?? null)
}
