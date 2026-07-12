"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export type NotificationPrefs = {
  priceAlerts?: boolean
  aiInsights?: boolean
  portfolioUpdates?: boolean
  earnings?: boolean
  marketNews?: boolean
}

type ProfileInput = {
  name?: string
  image?: string | null
  timezone?: string | null
  country?: string | null
  theme?: "light" | "dark" | "system"
  bio?: string | null
  notificationPrefs?: NotificationPrefs | null
}

export async function updateProfile(input: ProfileInput) {
  const userId = await getUserId()
  const set: Record<string, unknown> = { updatedAt: new Date() }
  if (typeof input.name === "string" && input.name.trim()) set.name = input.name.trim()
  if (input.image !== undefined) set.image = input.image
  if (input.timezone !== undefined) set.timezone = input.timezone
  if (input.country !== undefined) set.country = input.country
  if (input.theme !== undefined) set.theme = input.theme
  if (input.bio !== undefined) set.bio = input.bio
  if (input.notificationPrefs !== undefined) set.notificationPrefs = input.notificationPrefs as never

  await db.update(user).set(set).where(eq(user.id, userId))

  // Persist theme to a cookie so the root layout can apply it on every page load.
  if (input.theme !== undefined) {
    const c = await cookies()
    c.set("lumora-theme", input.theme, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    })
  }
  revalidatePath("/profile")
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const userId = await getUserId()
  if (!currentPassword || !newPassword) throw new Error("Both passwords are required")
  if (newPassword.length < 8) throw new Error("New password must be at least 8 characters")

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("Unauthorized")

  try {
    await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not change password"
    throw new Error(msg)
  }
  void userId
  return { ok: true }
}

export async function updateEmail(newEmail: string) {
  const userId = await getUserId()
  const email = newEmail.trim().toLowerCase()
  if (!email || !email.includes("@")) throw new Error("A valid email is required")
  try {
    await auth.api.changeEmail({
      headers: await headers(),
      body: { newEmail: email, callbackURL: "/profile" },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not update email"
    throw new Error(msg)
  }
  void userId
  return { ok: true }
}

export async function deleteAccount(password?: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("Unauthorized")
  try {
    await auth.api.deleteUser({
      headers: await headers(),
      body: password ? { password } : {},
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not delete account"
    throw new Error(msg)
  }
  return { ok: true }
}
