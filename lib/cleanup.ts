import { db } from "@/lib/db"
import { user, session, account, verification } from "@/lib/db/schema"
import { eq, and, lt, sql } from "drizzle-orm"

export async function cleanupUnverifiedUsers(): Promise<{ deleted: number }> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const unverified = await db.select({ id: user.id })
    .from(user)
    .where(and(
      eq(user.emailVerified, false),
      lt(user.createdAt, cutoff),
    ))

  if (unverified.length === 0) return { deleted: 0 }

  const ids = unverified.map((u) => u.id)

  // Clean up related records
  for (const uid of ids) {
    await db.delete(session).where(eq(session.userId, uid))
    await db.delete(account).where(eq(account.userId, uid))
    await db.delete(verification).where(eq(verification.identifier, sql`CONCAT('otp:', (SELECT email FROM "user" WHERE id = ${uid}))`))
  }

  // Delete users
  for (const uid of ids) {
    await db.delete(user).where(eq(user.id, uid))
  }

  return { deleted: ids.length }
}
