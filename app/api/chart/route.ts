import { NextResponse } from "next/server"
import { getChart } from "@/lib/market"

export const runtime = "nodejs"

const RANGE_INTERVAL: Record<string, string> = {
  "1d": "5m",
  "5d": "30m",
  "1mo": "1d",
  "6mo": "1d",
  "1y": "1d",
  "5y": "1wk",
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol") ?? ""
  const range = searchParams.get("range") ?? "1mo"
  const interval = RANGE_INTERVAL[range] ?? "1d"
  const candles = await getChart(symbol, range, interval)
  return NextResponse.json({ candles })
}
