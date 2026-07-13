"use server"

import { headers } from "next/headers"
import { db } from "@/lib/db"
import { userAgreement } from "@/lib/db/schema"
import { auth } from "@/lib/auth"

export async function recordAgreement() {
  const h = await headers()
  const session = await auth.api.getSession({ headers: h })
  if (!session?.user) throw new Error("Unauthorized")

  await db.insert(userAgreement).values({
    userId: session.user.id,
    agreedToTerms: true,
    agreedToPrivacy: true,
    ipAddress: h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? null,
    userAgent: h.get("user-agent") ?? null,
  })
}
