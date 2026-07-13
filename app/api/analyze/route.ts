import { NextResponse } from "next/server"
import { buildInstrumentContext } from "@/lib/context"
import { generateAnalysis, generateFallbackAnalysis, getAiErrorDiagnostic, DISCLAIMER, AiConfigError, AiBillingError } from "@/lib/ai/provider"
import { rateLimit, clientIp } from "@/lib/ratelimit"

export const runtime = "nodejs"
export const maxDuration = 30

function log(...args: unknown[]) {
  console.log("[Analyze]", ...args)
}

export async function POST(req: Request) {
  log("=== AI ANALYSIS REQUEST ===")

  const limit = rateLimit(`analyze:${clientIp(req)}`, 15, 60_000)
  if (!limit.ok) {
    log("Rate limited", clientIp(req))
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    )
  }

  let body: { symbol?: string; horizon?: string }
  try {
    body = await req.json()
    log("Request body:", body)
  } catch {
    log("Invalid request body")
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }
  const symbol = body.symbol?.trim()
  const horizon = body.horizon?.trim() || "swing"
  if (!symbol) return NextResponse.json({ error: "Missing symbol" }, { status: 400 })
  if (symbol.length > 24) return NextResponse.json({ error: "Invalid symbol" }, { status: 400 })
  log("Symbol:", symbol, "Horizon:", horizon)

  const accept = req.headers.get("accept") ?? ""
  log("Accept header:", accept)

  async function tryAnalyze(name: string, context: string) {
    log("=== TRY GEMINI ===")
    try {
      const analysis = await generateAnalysis({ name, horizon, context })
      log("=== GEMINI SUCCESS ===")
      log("Recommendation:", analysis.recommendation, "Confidence:", analysis.confidenceScore)
      return analysis
    } catch (err) {
      log("=== GEMINI FAILED ===")
      log("Error type:", (err as Error).name)
      log("Error message:", (err as Error).message)
      if ((err as Error).cause) {
        log("Error cause:", (err as Error).cause)
      }
      log("Diagnostic:", JSON.stringify(getAiErrorDiagnostic(err)))
      log("=== USING FALLBACK ===")
      const fallback = generateFallbackAnalysis({ name, horizon, context })
      log("Fallback recommendation:", fallback.recommendation, "Confidence:", fallback.confidenceScore)
      return fallback
    }
  }

  if (accept.includes("text/event-stream")) {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "started", symbol })}\n\n`))
          log("Sent: started event")

          log("Building instrument context for:", symbol)
          const built = await buildInstrumentContext(symbol, { horizon })
          if (!built) {
            log("Context build failed: no market data")
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Unable to load market data for this symbol." })}\n\n`),
            )
            controller.close()
            return
          }
          log("Context built for:", built.name)
          log("Context length:", built.context.length, "chars")
          log("Quote:", built.quote.symbol, built.quote.price, built.quote.currency)
          log("News count:", built.news.length)

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "loading", message: `Analyzing ${built.name}…` })}\n\n`))
          log("Sent: loading event")

          const analysis = await tryAnalyze(built.name, built.context)
          log("Sending: complete event with analysis")

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                analysis,
                meta: { symbol: built.quote.symbol, name: built.name, horizon },
              })}\n\n`,
            ),
          )
          log("=== STREAM COMPLETE ===")
        } catch (err) {
          log("=== STREAM ERROR ===", (err as Error).message)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: "Analysis failed due to an unexpected error." })}\n\n`,
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

  log("Building instrument context (non-stream) for:", symbol)
  const built = await buildInstrumentContext(symbol, { horizon })
  if (!built) {
    log("Context build failed: no market data")
    return NextResponse.json({ error: "Unable to load market data for this symbol." }, { status: 404 })
  }
  log("Context built for:", built.name)

  const analysis = await tryAnalyze(built.name, built.context)
  log("Returning JSON response")
  return NextResponse.json(
    { analysis, meta: { symbol: built.quote.symbol, name: built.name, horizon } },
    { headers: { "Cache-Control": "no-store" } },
  )
}
