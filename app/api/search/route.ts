import { NextResponse } from "next/server"
import { searchSymbols } from "@/lib/market"
import { parseInstrument, suggestOptionContracts } from "@/lib/instrument"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""
  if (!q.trim()) return NextResponse.json({ results: [] })

  // Parse the query first — if it's an exact option/future/instrument match, include it
  const parsed = parseInstrument(q)

  // Get fuzzy search results from Yahoo
  const searchResults = await searchSymbols(q)

  // For known indices/stocks, suggest option contracts
  let optionSuggestions: Record<string, unknown>[] = []
  if (q.length >= 2) {
    const options = suggestOptionContracts(q, 3)
    optionSuggestions = options.map((o) => ({
      symbol: o.symbol,
      name: o.name,
      exchange: o.exchange,
      type: o.type,
      strike: o.strike,
      optionType: o.optionType,
      expiry: o.expiry,
      underlying: o.underlying,
    }))
  }

  // If the parsed instrument is not "unknown", prepend it as the primary result
  const parsedResult = parsed.type !== "unknown" && parsed.raw.length >= 2
    ? [{
        symbol: parsed.symbol,
        name: parsed.name,
        exchange: parsed.exchange ?? "",
        type: parsed.type.toUpperCase(),
        ...(parsed.strike ? { strike: parsed.strike } : {}),
        ...(parsed.optionType ? { optionType: parsed.optionType } : {}),
        ...(parsed.expiry ? { expiry: parsed.expiry } : {}),
        ...(parsed.underlying ? { underlying: parsed.underlying } : {}),
      }]
    : []

  const combined = [...parsedResult, ...searchResults, ...optionSuggestions]
  return NextResponse.json({ results: combined })
}
