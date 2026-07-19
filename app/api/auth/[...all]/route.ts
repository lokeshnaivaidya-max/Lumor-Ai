import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq, and, lt, sql } from "drizzle-orm"
import { rateLimit, clientIp } from "@/lib/ratelimit"

const betterHandler = toNextJsHandler(auth.handler)

export const GET = async (req: Request) => {
  return betterHandler.GET(req)
}

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

  console.log("[OTP-TRACE] SERVER POST", { path, email: normalizedEmail, ua: request.headers.get("user-agent")?.slice(0, 40) })

  const ip = clientIp(request)

  // ── Sign-up ──────────────────────────────────────────────────
  if (path === "/api/auth/sign-up/email") {
    const rl = rateLimit(`auth:signup:${ip}`, 5, 60_000)
    if (!rl.ok) return json({ error: "Too many sign-up attempts. Please try again later." }, 429)

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
    const rl = rateLimit(`auth:send-otp:${ip}`, 3, 60_000)
    if (!rl.ok) return json({ error: "Too many OTP requests. Please wait before trying again." }, 429)

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
    const rl = rateLimit(`auth:verify-otp:${ip}`, 10, 60_000)
    if (!rl.ok) return json({ error: "Too many verification attempts. Please try again later." }, 429)

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
      const msg = String((body as Record<string, unknown>)?.message || (body as Record<string, unknown>)?.error || "Request failed.")
      if (response.status === 422 || response.status === 409) {
        return error("An account with this email already exists. Please sign in instead.", 409)
      }
      return error(msg, response.status)
    }
    return response
  } catch (e) {
    console.error("[AUTH API ERROR]", e)
    return error("An internal error occurred. Please try again.", 500)
  }
}
