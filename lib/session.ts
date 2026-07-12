import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/** Returns the full session (or null) for server components / route handlers. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

/** Returns the current user, or null if unauthenticated. */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}

/** Returns the current user id, throwing if unauthenticated. Use in actions. */
export async function getUserId() {
  const session = await getSession()
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

/** Returns the full DB user row (including extended profile columns), or null. */
export async function getFullUser() {
  const session = await getSession()
  if (!session?.user) return null
  const [row] = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)
  return row ?? null
}
