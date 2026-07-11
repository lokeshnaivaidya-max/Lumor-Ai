// Lumora AI layer.
//
// Talks directly to the OpenAI Chat Completions API (no Vercel AI Gateway
// dependency) when OPENAI_API_KEY is configured. If no direct key is present we
// transparently fall back to the AI Gateway's OpenAI-compatible endpoint so the
// app keeps working in environments where the gateway is provisioned.
//
// Both targets speak the identical OpenAI wire format, so a single client works
// for both. No secret is ever sent to the browser — all calls run server-side.

export const DISCLAIMER = "*For research and educational purposes only. Not financial advice.*"

type Provider = {
  baseURL: string
  apiKey: string
  model: string
  modelFast: string
  label: "openai" | "gateway"
}

export function getProvider(): Provider | null {
  const directKey = process.env.OPENAI_API_KEY
  if (directKey) {
    return {
      baseURL: "https://api.openai.com/v1",
      apiKey: directKey,
      // Defaults target GPT-5.5; override via env if your account differs.
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      modelFast: process.env.OPENAI_MODEL_FAST || "gpt-5-mini",
      label: "openai",
    }
  }
  const gatewayKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN
  if (gatewayKey) {
    return {
      baseURL: "https://ai-gateway.vercel.sh/v1",
      apiKey: gatewayKey,
      model: process.env.LUMORA_AI_MODEL || "openai/gpt-5.5",
      modelFast: process.env.LUMORA_AI_MODEL_FAST || "openai/gpt-5-mini",
      label: "gateway",
    }
  }
  return null
}

export class AiConfigError extends Error {}
export class AiBillingError extends Error {}

function classifyError(status: number, bodyText: string): Error {
  if (/credit card|customer_verification|billing|payment|quota|insufficient|exceeded/i.test(bodyText)) {
    return new AiBillingError(bodyText)
  }
  if (status === 401 || status === 403) {
    return new AiConfigError(bodyText || "Authentication failed")
  }
  return new Error(`AI request failed (HTTP ${status}): ${bodyText.slice(0, 300)}`)
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string }

/** Non-streaming completion — returns the full text. */
export async function chatComplete(
  messages: ChatMessage[],
  opts?: { fast?: boolean; temperature?: number; maxTokens?: number },
): Promise<string> {
  const provider = getProvider()
  if (!provider) throw new AiConfigError("No AI provider configured. Set OPENAI_API_KEY.")

  const res = await fetch(`${provider.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts?.fast ? provider.modelFast : provider.model,
      messages,
      temperature: opts?.temperature ?? 0.3,
      ...(opts?.maxTokens ? { max_completion_tokens: opts.maxTokens } : {}),
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw classifyError(res.status, body)
  }
  const json = await res.json()
  return json?.choices?.[0]?.message?.content ?? ""
}

/**
 * Streaming completion — returns a ReadableStream of text deltas.
 * Parses OpenAI-style SSE frames.
 */
export async function chatStream(
  messages: ChatMessage[],
  opts?: { temperature?: number },
): Promise<ReadableStream<Uint8Array>> {
  const provider = getProvider()
  if (!provider) throw new AiConfigError("No AI provider configured. Set OPENAI_API_KEY.")

  const upstream = await fetch(`${provider.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: opts?.temperature ?? 0.35,
      stream: true,
    }),
  })

  if (!upstream.ok || !upstream.body) {
    const body = await upstream.text().catch(() => "")
    throw classifyError(upstream.status, body)
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const reader = upstream.body.getReader()

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read()
        if (done) {
          controller.close()
          return
        }
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split("\n")) {
          const trimmed = line.trim()
          if (!trimmed.startsWith("data:")) continue
          const data = trimmed.slice(5).trim()
          if (data === "[DONE]") {
            controller.close()
            return
          }
          try {
            const json = JSON.parse(data)
            const delta = json?.choices?.[0]?.delta?.content
            if (delta) controller.enqueue(encoder.encode(delta))
          } catch {
            // ignore partial/non-JSON keep-alive frames
          }
        }
      } catch (err) {
        controller.error(err)
      }
    },
    cancel() {
      reader.cancel().catch(() => {})
    },
  })
}
