import { NextResponse } from "next/server"
import { getQuotes } from "@/lib/market"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbols = (searchParams.get("symbols") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const quotes = await getQuotes(symbols)
  return NextResponse.json({ quotes })
}
