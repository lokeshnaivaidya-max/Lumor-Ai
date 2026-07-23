import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { chatConversation, chatMessage } from "@/lib/db/schema"
import { streamChat, chatMarketContext, CHAT_SYSTEM, generateAnalysis, type ChatMessageInput } from "@/lib/ai/provider"
import { buildInstrumentContext } from "@/lib/context"
import { eq, and } from "drizzle-orm"
import { rateLimit, clientIp } from "@/lib/ratelimit"
import { logActivity } from "@/app/actions/activity"

export const runtime = "nodejs"
export const maxDuration = 60

type IncomingMessage = { role: "user" | "assistant"; content: string }

// Builds the rich, grounded market context block sent to the model. When a
// symbol is selected we pull the full instrument context (quote, computed
// indicators, support/resistance, news) and an AI analysis snapshot so the
// assistant always has real data to reference.
async function buildChatContext(message: string, symbol?: string, timeframe?: string): Promise<{ block: string; sources: string[] }> {
  const sources = new Set<string>()
  const parts: string[] = []

  // 1. Selected symbol — full instrument context.
  if (symbol && symbol.trim()) {
    try {
      const built = await buildInstrumentContext(symbol.trim(), { horizon: timeframe || "swing", newsCount: 6 })
      if (built) {
        sources.add("Live quote")
        sources.add("Technical indicators")
        sources.add("Recent news")
        let analysisLine = ""
        try {
          const analysis = await generateAnalysis({ name: built.name, horizon: timeframe || "swing", context: built.context, reasoning: built.reasoning })
          sources.add("AI analysis")
          analysisLine = `

AI ANALYSIS SNAPSHOT (generated from the same data)
Recommendation: ${analysis.recommendation}
Confidence: ${analysis.confidenceScore}/100
Entry: ${analysis.entry} | Target: ${analysis.target} | Stop Loss: ${analysis.stopLoss}
Support: ${analysis.support} | Resistance: ${analysis.resistance}
Risk: ${analysis.riskLevel}
Bias: ${analysis.marketMood}`
        } catch {
          // Analysis is best-effort; never block the chat on it.
        }
        parts.push(`SELECTED SYMBOL CONTEXT (${timeframe || "swing"} horizon):
${built.context}${analysisLine}`)
      }
    } catch {
      // ignore — fall through to ticker detection below
    }
  }

  // 2. Any other tickers/companies mentioned in the message.
  try {
    const detected = await chatMarketContext(message)
    if (detected) {
      sources.add("Live quote")
      parts.push(detected)
    }
  } catch {
    // ignore
  }

  return { block: parts.join("\n\n"), sources: [...sources] }
}

const STRUCTURE_RULES = `

RESPONSE FORMAT RULES (apply to every reply):
- Prefer structured, scannable answers over long essays. Use clearly labelled cards/sections such as:
  Recommendation, Confidence, Entry, Target, Stop Loss, Risk, Reasoning, Sources.
- Use markdown tables, bullet lists, and bold labels. Keep prose tight.
- If you reference a price, level, or metric, cite it from LIVE MARKET DATA above.
- End trading-style answers with "Educational purposes only." and a Sources line (e.g., Technical Indicators, Live Market Data, Recent News).
- NEVER say "I don't have live market data" or "I lack real-time data" when SELECTED SYMBOL CONTEXT or LIVE MARKET DATA is present — you DO have it. Use it.`

export async function POST(req: Request) {
  const rl = rateLimit(`chat:${clientIp(req)}`, 5, 60_000)
  if (!rl.ok) return Response.json({ error: "Too many requests. Please wait before sending another message." }, { status: 429 })

  let body: { conversationId?: number; message?: string; history?: IncomingMessage[]; symbol?: string; timeframe?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 })
  }

  const message = body.message?.trim()
  if (!message) {
    return Response.json({ error: "A message is required." }, { status: 400 })
  }

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  // Resolve or create the conversation.
  let conversationId = body.conversationId
  let isNewConversation = false
  try {
    if (!conversationId) {
      const [conv] = await db
        .insert(chatConversation)
        .values({ userId, title: message.slice(0, 60) || "New chat" })
        .returning()
      conversationId = conv.id
      isNewConversation = true
    } else {
      const conv = await db
        .select({ id: chatConversation.id })
        .from(chatConversation)
        .where(and(eq(chatConversation.id, conversationId), eq(chatConversation.userId, userId)))
        .limit(1)
      if (!conv.length) {
        return Response.json({ error: "Conversation not found." }, { status: 404 })
      }
    }

    // Persist the user's message.
    await db.insert(chatMessage).values({
      conversationId,
      role: "user",
      content: message,
    })

    // Log a single "asked AI" activity per conversation (no duplicates).
    if (isNewConversation) {
      const preview = message.length > 60 ? message.slice(0, 60).trimEnd() + "…" : message
      logActivity({ type: "chat", title: `Asked Lumora AI: ${preview}`, href: "/chat" }).catch(() => {})
    }
  } catch (err) {
    console.error("[Chat] conversation setup failed", err)
    return Response.json({ error: "Could not start the chat. Please try again." }, { status: 500 })
  }

  // Build the model context: prior history (without the just-sent message) + the new user turn.
  const history: ChatMessageInput[] = (body.history || [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }))

  const fullHistory: ChatMessageInput[] = [
    ...history,
    { role: "user", content: message },
  ]

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let assistantText = ""
      let usageTokens = 0
      const send = (event: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))

      try {
        const { block: marketContext, sources } = await buildChatContext(message, body.symbol, body.timeframe)

        const systemExtra = marketContext
          ? `${CHAT_SYSTEM}\n\n${marketContext}${STRUCTURE_RULES}`
          : `${CHAT_SYSTEM}${STRUCTURE_RULES}`

        for await (const event of streamChat(fullHistory, marketContext || sources.length ? { system: systemExtra } : undefined)) {
          if (event.type === "delta") {
            assistantText += event.text
            send({ type: "token", token: event.text })
          } else if (event.type === "done") {
            usageTokens = event.usage.completionTokens
            send({ type: "done", conversationId, tokens: usageTokens })
          } else if (event.type === "error") {
            send({ type: "error", message: event.message })
          }
        }
      } catch (err) {
        console.error("[Chat]", err)
        send({ type: "error", message: "Analysis failed. Please try again." })
      } finally {
        if (assistantText) {
          await db.insert(chatMessage).values({
            conversationId,
            role: "assistant",
            content: assistantText,
            tokens: usageTokens,
          })
          await db
            .update(chatConversation)
            .set({ updatedAt: new Date() })
            .where(eq(chatConversation.id, conversationId))
        }
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
