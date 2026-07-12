import { db } from "./db"
import { portfolioHolding, watchlistItem } from "./db/schema"
import { getQuotes, type Quote } from "./market"
import { eq } from "drizzle-orm"

export type PortfolioHoldingView = {
  symbol: string
  name: string | null
  quantity: number
  avgPrice: number
  price: number
  change: number
  changePercent: number
  marketValue: number
  costBasis: number
}

export type PortfolioSummary = {
  investment: number
  value: number
  todayPnL: number
  totalReturns: number
  returnsPercent: number
  holdingsCount: number
  holdings: PortfolioHoldingView[]
}

export async function getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
  const holdings = await db
    .select()
    .from(portfolioHolding)
    .where(eq(portfolioHolding.userId, userId))

  if (holdings.length === 0) {
    return {
      investment: 0,
      value: 0,
      todayPnL: 0,
      totalReturns: 0,
      returnsPercent: 0,
      holdingsCount: 0,
      holdings: [],
    }
  }

  const quotes: Quote[] = await getQuotes(holdings.map((h) => h.symbol))
  const qmap = new Map(quotes.map((q) => [q.symbol, q]))

  let investment = 0
  let value = 0
  let todayPnL = 0
  const views: PortfolioHoldingView[] = holdings.map((h) => {
    const q = qmap.get(h.symbol)
    const qty = Number(h.quantity)
    const price = q ? q.price : Number(h.avgPrice)
    const prev = q ? q.previousClose || price : price
    const costBasis = qty * Number(h.avgPrice)
    investment += costBasis
    value += qty * price
    todayPnL += qty * (price - prev)
    return {
      symbol: h.symbol,
      name: h.name ?? q?.name ?? null,
      quantity: qty,
      avgPrice: Number(h.avgPrice),
      price,
      change: q ? q.change : 0,
      changePercent: q ? q.changePercent : 0,
      marketValue: qty * price,
      costBasis,
    }
  })

  const totalReturns = value - investment
  const returnsPercent = investment ? (totalReturns / investment) * 100 : 0

  return {
    investment,
    value,
    todayPnL,
    totalReturns,
    returnsPercent,
    holdingsCount: holdings.length,
    holdings: views,
  }
}

export type WatchlistView = {
  symbol: string
  name: string | null
  price: number
  change: number
  changePercent: number
}

export async function getWatchlistView(userId: string): Promise<WatchlistView[]> {
  const rows = await db
    .select()
    .from(watchlistItem)
    .where(eq(watchlistItem.userId, userId))
  if (rows.length === 0) return []
  const quotes = await getQuotes(rows.map((r) => r.symbol))
  const qmap = new Map<string, Quote>(quotes.map((q) => [q.symbol, q]))
  return rows.map((r) => {
    const q = qmap.get(r.symbol)
    return {
      symbol: r.symbol,
      name: r.name ?? q?.name ?? null,
      price: q ? q.price : 0,
      change: q ? q.change : 0,
      changePercent: q ? q.changePercent : 0,
    }
  })
}
