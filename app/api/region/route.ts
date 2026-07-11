import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { regionFromCountry, REGION_CONFIG } from "@/lib/market"

export const runtime = "nodejs"

export async function GET() {
  const h = await headers()
  // Vercel injects the visitor country; fall back to Global elsewhere.
  const country = h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? null
  const region = regionFromCountry(country)
  return NextResponse.json({ region, config: REGION_CONFIG[region], country })
}
