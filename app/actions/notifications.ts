"use server"

import { db } from "@/lib/db"
import { notification } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { desc, eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type NotificationRow = typeof notification.$inferSelect

export async function getNotifications(): Promise<NotificationRow[]> {
  const userId = await getUserId()
  return db
    .select()
    .from(notification)
    .where(eq(notification.userId, userId))
    .orderBy(desc(notification.createdAt))
}

export async function markNotificationRead(id: number) {
  const userId = await getUserId()
  await db
    .update(notification)
    .set({ read: true })
    .where(and(eq(notification.id, id), eq(notification.userId, userId)))
  revalidatePath("/notifications")
}

export async function markAllNotificationsRead() {
  const userId = await getUserId()
  await db
    .update(notification)
    .set({ read: true })
    .where(eq(notification.userId, userId))
  revalidatePath("/notifications")
}

export async function deleteNotification(id: number) {
  const userId = await getUserId()
  await db
    .delete(notification)
    .where(and(eq(notification.id, id), eq(notification.userId, userId)))
  revalidatePath("/notifications")
}

/** Internal helper used by other features to push a real notification. */
export async function createNotification(input: {
  type?: string
  title: string
  body?: string
  symbol?: string
}) {
  const userId = await getUserId()
  await db.insert(notification).values({
    userId,
    type: input.type ?? "general",
    title: input.title,
    body: input.body ?? null,
    symbol: input.symbol ?? null,
  })
  revalidatePath("/notifications")
}
