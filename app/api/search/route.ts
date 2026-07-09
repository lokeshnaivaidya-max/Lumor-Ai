import { NextResponse } from "next/server"
import { searchSymbols } from "@/lib/market"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""
  const results = await searchSymbols(q)
  return NextResponse.json({ results })
}
