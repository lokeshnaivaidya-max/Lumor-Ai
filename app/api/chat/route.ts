import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { chatConversation, chatMessage } from "@/lib/db/schema"
import { streamChat, type ChatMessageInput } from "@/lib/ai/provider"
import { eq, and } from "drizzle-orm"
import { rateLimit, clientIp } from "@/lib/ratelimit"

export const runtime = "nodejs"
export const maxDuration = 60

type IncomingMessage = { role: "user" | "assistant"; content: string }

export async function POST(req: Request) {
  const rl = rateLimit(`chat:${clientIp(req)}`, 5, 60_000)
  if (!rl.ok) return Response.json({ error: "Too many requests. Please wait before sending another message." }, { status: 429 })

  let body: { conversationId?: number; message?: string; history?: IncomingMessage[] }
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
  if (!conversationId) {
    const [conv] = await db
      .insert(chatConversation)
      .values({ userId, title: message.slice(0, 60) || "New chat" })
      .returning()
    conversationId = conv.id
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

  // Build the model context: prior history (without the just-sent message) + the new user turn.
  const history: ChatMessageInput[] = (body.history || [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }))
  const fullHistory: ChatMessageInput[] = [...history, { role: "user", content: message }]

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let assistantText = ""
      let usageTokens = 0
      const send = (event: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))

      try {
        for await (const event of streamChat(fullHistory)) {
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
