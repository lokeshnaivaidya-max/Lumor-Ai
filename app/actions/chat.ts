"use server"

import { db } from "@/lib/db"
import { chatConversation, chatMessage } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { desc, eq, and, asc } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type ConversationRow = typeof chatConversation.$inferSelect
export type MessageRow = typeof chatMessage.$inferSelect

export type ConversationListItem = {
  id: number
  title: string
  updatedAt: string
  preview: string | null
  messageCount: number
}

export async function getConversations(): Promise<ConversationListItem[]> {
  const userId = await getUserId()
  const rows = await db
    .select({
      id: chatConversation.id,
      title: chatConversation.title,
      updatedAt: chatConversation.updatedAt,
      messageCount: chatConversation.id,
    })
    .from(chatConversation)
    .where(eq(chatConversation.userId, userId))
    .orderBy(desc(chatConversation.updatedAt))

  // Attach a preview (last assistant message) + real message count per conversation.
  const items = await Promise.all(
    rows.map(async (r) => {
      const msgs = await db
        .select({ role: chatMessage.role, content: chatMessage.content })
        .from(chatMessage)
        .where(eq(chatMessage.conversationId, r.id))
        .orderBy(asc(chatMessage.createdAt))
      const count = msgs.length
      const last = [...msgs].reverse().find((m) => m.role === "assistant")?.content
      const preview = last ? last.slice(0, 80) : null
      return {
        id: r.id,
        title: r.title,
        updatedAt: r.updatedAt.toISOString(),
        preview,
        messageCount: count,
      }
    }),
  )
  return items
}

export async function getMessages(conversationId: number) {
  const userId = await getUserId()
  const conv = await db
    .select()
    .from(chatConversation)
    .where(and(eq(chatConversation.id, conversationId), eq(chatConversation.userId, userId)))
    .limit(1)
  if (!conv.length) throw new Error("Conversation not found")
  return db
    .select()
    .from(chatMessage)
    .where(eq(chatMessage.conversationId, conversationId))
    .orderBy(asc(chatMessage.createdAt))
}

export async function createConversation(firstMessage: string) {
  const userId = await getUserId()
  const title = firstMessage.trim().slice(0, 60) || "New chat"
  const [conv] = await db
    .insert(chatConversation)
    .values({ userId, title })
    .returning()
  return conv
}

export async function renameConversation(id: number, title: string) {
  const userId = await getUserId()
  await db
    .update(chatConversation)
    .set({ title: title.trim().slice(0, 120) || "New chat", updatedAt: new Date() })
    .where(and(eq(chatConversation.id, id), eq(chatConversation.userId, userId)))
  revalidatePath("/chat")
}

export async function deleteConversation(id: number) {
  const userId = await getUserId()
  await db
    .delete(chatConversation)
    .where(and(eq(chatConversation.id, id), eq(chatConversation.userId, userId)))
  revalidatePath("/chat")
}
