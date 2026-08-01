"use server"

import { db } from "@/lib/db"
import { user, userAgreement } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function recordAgreement(userId: string) {
  await db.insert(userAgreement).values({
    userId,
    agreedToTerms: true,
    agreedToPrivacy: true,
  })

  await db.update(user)
    .set({
      acceptedTerms: true,
      acceptedPrivacyPolicy: true,
      acceptedLegalVersion: "1.0",
      acceptedAt: new Date(),
    })
    .where(eq(user.id, userId))
}
