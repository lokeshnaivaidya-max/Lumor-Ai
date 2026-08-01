"use server"

import { db } from "@/lib/db"
import { activityLog } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"

type LogInput = {
  type: string
  title: string
  ticker?: string | null
  href?: string | null
}

// Fire-and-forget activity logging. Never throws into the caller so a logging
// failure can never break the primary user action.
export async function logActivity(input: LogInput): Promise<void> {
  try {
    const userId = await getUserId()
    if (!userId) return
    await db.insert(activityLog).values({
      userId,
      type: input.type,
      title: input.title.slice(0, 280),
      ticker: input.ticker ?? null,
      href: input.href ?? null,
    })
  } catch {
    /* noop */
  }
}
