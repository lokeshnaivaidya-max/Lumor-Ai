import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { regionFromCountry, REGION_CONFIG } from "@/lib/market"
import { rateLimit, clientIp } from "@/lib/ratelimit"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const rl = rateLimit(`region:${clientIp(req)}`, 30, 60_000)
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 })

  const h = await headers()
  // Vercel injects the visitor country; fall back to Global elsewhere.
  const country = h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? null
  const region = regionFromCountry(country)
  return NextResponse.json({ region, config: REGION_CONFIG[region], country })
}
