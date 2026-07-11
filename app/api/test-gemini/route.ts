// TEMPORARY diagnostic endpoint — GET /api/test-gemini
//
// Implements the OFFICIAL 2026 Google AI Studio auth-key (AQ.) flow:
// the Interactions API via `ai.interactions.create({ model, input })`.
// See https://ai.google.dev/gemini-api/docs/api-key (Interactions API tab).
//
// For comparison it also probes the legacy `generateContent` path.
// Both return raw, unmodified output/error JSON from Google.
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
  if (anyErr.name) out.name = anyErr.name
  if (anyErr.message) out.message = anyErr.message
  if (anyErr.status) out.status = anyErr.status
  if (anyErr.code) out.code = anyErr.code

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
    auth: "x-goog-api-key (Gemini Developer API / auth key)",
    primaryFlow: "interactions.create (official 2026 AQ-key path)",
    primaryEndpoint: "https://generativelanguage.googleapis.com/v1beta/interactions",
    apiKeyPresent: Boolean(apiKey),
    apiKeyPrefix: apiKey ? apiKey.slice(0, 4) : null,
    apiKeyLength: apiKey ? apiKey.length : 0,
  }

  if (!apiKey) {
    return NextResponse.json({ ok: false, meta, error: "GEMINI_API_KEY is not configured." }, { status: 500 })
  }

  const client = new GoogleGenAI({ apiKey })

  // --- Primary: official Interactions API path for AQ auth keys ---
  let interactions: Record<string, unknown>
  try {
    const it = (await client.interactions.create({
      model: MODEL,
      input: "Reply with only OK",
    })) as Record<string, unknown>

    interactions = {
      ok: true,
      output_text: (it.output_text as string) ?? null,
      raw: it,
    }
  } catch (err) {
    interactions = { ok: false, error: serializeError(err) }
  }

  // --- Comparison: legacy generateContent path ---
  let generateContent: Record<string, unknown>
  try {
    const res = await client.models.generateContent({
      model: MODEL,
      contents: "Reply with only OK",
    })
    generateContent = { ok: true, text: (res.text ?? "").trim(), raw: res }
  } catch (err) {
    generateContent = { ok: false, error: serializeError(err) }
  }

  const ok = interactions.ok === true
  return NextResponse.json({ ok, meta, interactions, generateContent }, { status: ok ? 200 : 502 })
}
