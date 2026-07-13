import { NextResponse } from "next/server"
import { getOptionChain, providers } from "@/lib/options"

export const runtime = "nodejs"
export const maxDuration = 15

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol")?.trim().toUpperCase()
  const expiry = searchParams.get("expiry")?.trim() || undefined

  if (!symbol) {
    return NextResponse.json({ available: providers.map((p) => p.name), error: "Missing symbol" }, { status: 400 })
  }

  try {
    const data = await getOptionChain({ symbol, expiry })
    if (!data) {
      return NextResponse.json({
        available: false,
        symbol,
        message: "Options data unavailable",
        provider: null,
      })
    }
    return NextResponse.json({ available: true, data })
  } catch {
    return NextResponse.json({
      available: false,
      symbol,
      message: "Options data unavailable",
    })
  }
}
