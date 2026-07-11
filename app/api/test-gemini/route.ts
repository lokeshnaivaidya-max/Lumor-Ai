// TEMPORARY diagnostic endpoint — GET /api/test-gemini
// Sends "Reply with only OK" through the exact same Gemini provider that Lumora
// uses (same @google/genai client + same GEMINI_API_KEY), and returns either the
// raw model response or the FULL raw error JSON from Google, unmodified.
//
// Safe to delete once the Gemini auth issue is resolved.

import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview"

// Pull every possibly-useful field off whatever error object the SDK throws,
// including non-enumerable props, so nothing about the failure is hidden.
function serializeError(err: unknown) {
  if (err === null || err === undefined) return { value: String(err) }
  if (typeof err !== "object") return { value: String(err) }

  const out: Record<string, unknown> = {}
  for (const key of Object.getOwnPropertyNames(err)) {
    try {
      out[key] = (err as Record<string, unknown>)[key]
    } catch {
      out[key] = "<unreadable>"
    }
  }

  const anyErr = err as Record<string, unknown>
  // The @google/genai ApiError often carries the raw HTTP body/status here.
  if (anyErr.name) out.name = anyErr.name
  if (anyErr.message) out.message = anyErr.message
  if (anyErr.status) out.status = anyErr.status
  if (anyErr.code) out.code = anyErr.code

  // Try to parse an embedded JSON error body out of the message, if present.
  const msg = typeof anyErr.message === "string" ? anyErr.message : ""
  const jsonMatch = msg.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      out.parsedBody = JSON.parse(jsonMatch[0])
    } catch {
      /* ignore */
    }
  }

  return out
}

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY

  const meta = {
    model: MODEL,
    sdk: "@google/genai@2.11.0",
    endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    auth: "x-goog-api-key (Developer API)",
    apiKeyPresent: Boolean(apiKey),
    apiKeyPrefix: apiKey ? apiKey.slice(0, 4) : null,
    apiKeyLength: apiKey ? apiKey.length : 0,
  }

  if (!apiKey) {
    return NextResponse.json({ ok: false, meta, error: "GEMINI_API_KEY is not configured." }, { status: 500 })
  }

  try {
    // Exact same client construction as lib/ai/provider.ts.
    const client = new GoogleGenAI({ apiKey })
    const res = await client.models.generateContent({
      model: MODEL,
      contents: "Reply with only OK",
    })

    return NextResponse.json({
      ok: true,
      meta,
      text: (res.text ?? "").trim(),
      raw: res,
    })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        meta,
        error: serializeError(err),
      },
      { status: 502 },
    )
  }
}
