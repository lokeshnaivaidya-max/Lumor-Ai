import { createHash, randomBytes } from "node:crypto"
import { db } from "@/lib/db"
import { verification } from "@/lib/db/schema"
import { eq, and, gt, sql } from "drizzle-orm"

const OTP_EXPIRY_MS = 5 * 60 * 1000
const MAX_ATTEMPTS = 5
const COOLDOWN_MS = 60 * 1000
const MAX_REQUESTS = 3
const MAX_REQUESTS_WINDOW_MS = 10 * 60 * 1000

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex")
}

export function generateOtp(): string {
  const buf = randomBytes(3)
  const num = buf.readUIntBE(0, 3) % 1_000_000
  return num.toString().padStart(6, "0")
}

export async function storeOtp(email: string, otp: string): Promise<void> {
  const hashed = hashOtp(otp)
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS)
  await db.insert(verification).values({
    id: `otp-${Date.now()}-${randomBytes(4).toString("hex")}`,
    identifier: `otp:${email}`,
    value: hashed,
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

export async function verifyOtp(email: string, otp: string): Promise<{ valid: boolean; reason?: string }> {
  const hashed = hashOtp(otp)
  const identifier = `otp:${email}`

  const records = await db.select()
    .from(verification)
    .where(and(
      eq(verification.identifier, identifier),
      gt(verification.expiresAt, sql`NOW()`),
    ))
    .orderBy(sql`${verification.createdAt} DESC`)
    .limit(1)

  if (records.length === 0) {
    return { valid: false, reason: "OTP expired or not found" }
  }

  const record = records[0]
  if (record.value !== hashed) {
    return { valid: false, reason: "Invalid OTP" }
  }

  await db.delete(verification)
    .where(eq(verification.id, record.id))

  return { valid: true }
}

export async function canRequestOtp(email: string): Promise<{ allowed: boolean; reason?: string; cooldownSeconds?: number }> {
  const identifier = `otp:${email}`

  const recent = await db.select({ createdAt: verification.createdAt })
    .from(verification)
    .where(and(
      eq(verification.identifier, identifier),
      gt(verification.createdAt, sql`NOW() - INTERVAL '10 minutes'`),
    ))
    .orderBy(sql`${verification.createdAt} DESC`)

  if (recent.length >= MAX_REQUESTS) {
    const oldest = recent[recent.length - 1]
    const waitMs = oldest.createdAt
      ? (oldest.createdAt.getTime() + MAX_REQUESTS_WINDOW_MS) - Date.now()
      : COOLDOWN_MS
    return { allowed: false, reason: `Maximum ${MAX_REQUESTS} OTP requests per 10 minutes`, cooldownSeconds: Math.ceil(Math.max(waitMs, 0) / 1000) }
  }

  if (recent.length > 0 && recent[0].createdAt) {
    const elapsed = Date.now() - recent[0].createdAt.getTime()
    if (elapsed < COOLDOWN_MS) {
      return { allowed: false, reason: "Please wait before requesting another OTP", cooldownSeconds: Math.ceil((COOLDOWN_MS - elapsed) / 1000) }
    }
  }

  return { allowed: true }
}

export async function countAttempts(email: string): Promise<number> {
  const identifier = `otp:${email}`
  const records = await db.select()
    .from(verification)
    .where(and(
      eq(verification.identifier, identifier),
      gt(verification.expiresAt, sql`NOW()`),
    ))

  return records.length
}
