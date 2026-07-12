"use server"

import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function updateProfileName(name: string) {
  const userId = await getUserId()
  const trimmed = name.trim()
  if (!trimmed) throw new Error("Name is required")
  await db
    .update(user)
    .set({ name: trimmed, updatedAt: new Date() })
    .where(eq(user.id, userId))
  revalidatePath("/profile")
}
