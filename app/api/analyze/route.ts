import { NextResponse } from "next/server"
import { buildInstrumentContext } from "@/lib/context"
import { generateAnalysis, getAiErrorDiagnostic, DISCLAIMER, AiConfigError, AiBillingError } from "@/lib/ai/provider"
import { rateLimit, clientIp } from "@/lib/ratelimit"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: Request) {
  const limit = rateLimit(`analyze:${clientIp(req)}`, 15, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    )
  }

  let body: { symbol?: string; horizon?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }
  const symbol = body.symbol?.trim()
  const horizon = body.horizon?.trim() || "swing"
  if (!symbol) return NextResponse.json({ error: "Missing symbol" }, { status: 400 })
  if (symbol.length > 24) return NextResponse.json({ error: "Invalid symbol" }, { status: 400 })

  const built = await buildInstrumentContext(symbol, { horizon })
  if (!built) {
    return NextResponse.json({ error: "Unable to load market data for this symbol." }, { status: 404 })
  }

  try {
    const analysis = await generateAnalysis({ name: built.name, horizon, context: built.context })
    return NextResponse.json(
      { analysis, meta: { symbol: built.quote.symbol, name: built.name, horizon } },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (err) {
    const message =
      err instanceof AiBillingError
        ? "AI analysis is temporarily unavailable — the Gemini API quota has been exhausted. Live market data and technicals remain fully functional."
        : err instanceof AiConfigError
          ? "AI analysis is not configured. Add a GEMINI_API_KEY in Project Settings to enable it. Live market data and technicals remain fully functional."
          : "AI analysis is temporarily unavailable — the model provider returned an error. Live market data and technicals remain fully functional."
    console.error("[Lumora AI] Gemini analysis failed", getAiErrorDiagnostic(err))
    return NextResponse.json({ error: message, disclaimer: DISCLAIMER }, { status: 200 })
  }
}
