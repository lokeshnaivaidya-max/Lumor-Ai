import { NextResponse } from "next/server"
import { rateLimit, clientIp } from "@/lib/ratelimit"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const rl = rateLimit(`debug:${clientIp(req)}`, 3, 60_000)
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 })

  if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 })
  }

  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  })
}
