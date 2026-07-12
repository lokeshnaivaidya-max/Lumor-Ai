import { auth } from "@/lib/auth"
import { headers } from "next/headers"

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
