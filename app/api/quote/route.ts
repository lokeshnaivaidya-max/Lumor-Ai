import { NextResponse } from "next/server"
import { getQuotes } from "@/lib/market"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""
  const symbols = q.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 10)
  if (symbols.length === 0) return NextResponse.json({ quotes: [] })
  const quotes = await getQuotes(symbols)
  return NextResponse.json({ quotes })
}
