import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/** Returns the full session (or null) for server components / route handlers.
 *  The database schema is created solely by Drizzle migrations (run at deploy
 *  time via `drizzle-kit migrate`), so no per-request schema bootstrap runs here. */
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
  try {
    const [row] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)
    return row ?? null
  } catch {
    // A DB/network error resolving the profile must not bubble into the Server
    // Component render (which would surface as the "Server Components render"
    // error page). Treat it as "no user" so the caller redirects to sign-in.
    return null
  }
}
