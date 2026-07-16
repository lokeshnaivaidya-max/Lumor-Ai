import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq, and, lt, sql } from "drizzle-orm"

const betterHandler = toNextJsHandler(auth.handler)

export const GET = betterHandler.GET

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

async function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email)
  const rows = await db.select({
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  }).from(user).where(eq(user.email, normalized)).limit(1)
  return rows[0] || null
}

function json(data: Record<string, unknown>, status: number): Response {
  return Response.json(data, { status })
}

function error(msg: string, status: number): Response {
  return json({ error: msg, message: msg }, status)
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const path = url.pathname
  const body = await request.clone().json().catch(() => ({}))
  const email = body.email as string | undefined
  const normalizedEmail = email ? normalizeEmail(email) : undefined

  // ── Sign-up ──────────────────────────────────────────────────
  if (path === "/api/auth/sign-up/email") {
    if (!body.agreedToLegal || !body.acceptedTerms || !body.acceptedPrivacyPolicy) {
      return error("You must accept the Terms & Conditions and Privacy Policy.", 400)
    }

    if (normalizedEmail) {
      const found = await findUserByEmail(normalizedEmail)
      if (found) {
        if (found.emailVerified) {
          return error("An account with this email already exists. Please sign in instead.", 409)
        }
        // Unverified user → allow resend
        return json({
          message: "Your account is awaiting verification. A new OTP has been sent.",
          status: "pending_verification",
          email: normalizedEmail,
        }, 200)
      }
    }

    const { agreedToLegal: _, acceptedTerms: __, acceptedPrivacyPolicy: ___, acceptedLegalVersion: ____, ...clean } = body
    const cleanRequest = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(clean),
    })
    return safeForward(cleanRequest)
  }

  // ── Send OTP ──────────────────────────────────────────────────
  if (path === "/api/auth/email-otp/send-verification-otp" && normalizedEmail) {
    const otpType: string = body.type || ""
    const found = await findUserByEmail(normalizedEmail)

    if (otpType === "email-verification") {
      if (!found) {
        return error("No account found for this email. Please sign up first.", 404)
      }
      if (found.emailVerified) {
        return error("This email is already verified. Please sign in instead.", 409)
      }
    } else if (otpType === "forget-password" || otpType === "password-reset") {
      if (!found) {
        return error("No account found for this email.", 404)
      }
    }

    // Forward to better-auth which handles OTP generation + email
    return safeForward(request)
  }

  // ── Verify OTP ────────────────────────────────────────────────
  if (path === "/api/auth/email-otp/verify-email" && normalizedEmail) {
    const found = await findUserByEmail(normalizedEmail)
    if (!found) {
      return error("No account found for this email. Please sign up first.", 404)
    }
    return safeForward(request)
  }

  // ── Default ───────────────────────────────────────────────────
  return safeForward(request)
}

async function safeForward(request: Request): Promise<Response> {
  try {
    const response = await betterHandler.POST(request)
    if (!response.ok) {
      const cloned = response.clone()
      const body = await cloned.json().catch(() => ({}))
      const msg = (body as Record<string, unknown>)?.message || (body as Record<string, unknown>)?.error || "Request failed"
      if (response.status === 422 || response.status === 409) {
        return error("An account with this email already exists. Please sign in instead.", 409)
      }
      return error(String(msg), response.status)
    }
    return response
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    console.error("[AUTH API ERROR]", msg)
    const isDuplicate =
      msg.includes("unique") || msg.includes("duplicate") ||
      msg.includes("already exists") || msg.includes("E11000") || msg.includes("23505")
    if (isDuplicate) {
      return error("An account with this email already exists. Please sign in instead.", 409)
    }
    return error(msg, 500)
  }
}
