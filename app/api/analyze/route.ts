import { NextResponse } from "next/server"
import { buildInstrumentContext } from "@/lib/context"
import { generateAnalysis, generateFallbackAnalysis, getAiErrorDiagnostic, DISCLAIMER, AiConfigError, AiBillingError } from "@/lib/ai/provider"
import { rateLimit, clientIp } from "@/lib/ratelimit"

export const runtime = "nodejs"
export const maxDuration = 30

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

  const accept = req.headers.get("accept") ?? ""

  function tryAnalyze(name: string, context: string) {
    try {
      return generateAnalysis({ name, horizon, context })
    } catch {
      console.warn("[Lumora AI] Gemini unavailable, using fallback analysis")
      return generateFallbackAnalysis({ name, horizon, context })
    }
  }

  if (accept.includes("text/event-stream")) {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "started", symbol })}\n\n`))

          const built = await buildInstrumentContext(symbol, { horizon })
          if (!built) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Unable to load market data for this symbol." })}\n\n`),
            )
            controller.close()
            return
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "loading", message: `Analyzing ${built.name}…` })}\n\n`))

          const analysis = tryAnalyze(built.name, built.context)

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                analysis,
                meta: { symbol: built.quote.symbol, name: built.name, horizon },
              })}\n\n`,
            ),
          )
        } finally {
          controller.close()
        }
      },
    })
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
    })
  }

  const built = await buildInstrumentContext(symbol, { horizon })
  if (!built) {
    return NextResponse.json({ error: "Unable to load market data for this symbol." }, { status: 404 })
  }

  const analysis = tryAnalyze(built.name, built.context)
  return NextResponse.json(
    { analysis, meta: { symbol: built.quote.symbol, name: built.name, horizon } },
    { headers: { "Cache-Control": "no-store" } },
  )
}
