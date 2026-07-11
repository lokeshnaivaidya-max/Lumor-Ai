import { NextResponse } from "next/server"
import { getQuote, getQuotes } from "@/lib/market"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbols = (searchParams.get("symbols") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  if (symbols.length === 0) {
    return NextResponse.json({ quotes: [] })
  }

  // A single-symbol request is a detail view — fetch the full fundamentals.
  // Multi-symbol requests are watchlists/tickers — keep them lightweight.
  if (symbols.length === 1) {
    const quote = await getQuote(symbols[0], { withFundamentals: true })
    return NextResponse.json({ quotes: quote ? [quote] : [] })
  }

  const quotes = await getQuotes(symbols)
  return NextResponse.json({ quotes })
}
