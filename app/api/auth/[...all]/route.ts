import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const betterHandler = toNextJsHandler(auth.handler)

export const GET = betterHandler.GET

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

async function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email)
  const rows = await db.select({
    id: user.id,
    emailVerified: user.emailVerified,
  }).from(user).where(eq(user.email, normalized)).limit(1)
  return rows[0] || null
}

async function safeForward(request: Request): Promise<Response> {
  try {
    const response = await betterHandler.POST(request)
    if (!response.ok) {
      const cloned = response.clone()
      const body = await cloned.json().catch(() => ({}))
      if (response.status === 422 || response.status === 409) {
        return Response.json(
          { error: "An account with this email already exists. Please sign in instead.", message: "An account with this email already exists. Please sign in instead." },
          { status: 409 },
        )
      }
    }
    return response
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    const stack = e instanceof Error ? e.stack : ""
    console.error("[AUTH API ERROR]", msg)
    console.error("[AUTH API STACK]", stack)
    if (e && typeof e === "object") {
      try { console.error("[AUTH API DETAIL]", JSON.stringify(e, Object.getOwnPropertyNames(e))) } catch {}
    }
    const isDuplicate =
      msg.includes("unique") ||
      msg.includes("duplicate") ||
      msg.includes("already exists") ||
      msg.includes("E11000") ||
      msg.includes("23505")
    if (isDuplicate) {
      return Response.json(
        { error: "An account with this email already exists. Please sign in instead.", message: "An account with this email already exists. Please sign in instead." },
        { status: 409 },
      )
    }
    return Response.json({ error: msg, message: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const path = url.pathname
  const body = await request.clone().json().catch(() => ({}))
  const email = body.email

  // Sign-up: check for existing account before forwarding
  if (path === "/api/auth/sign-up/email") {
    if (!body.agreedToLegal || !body.acceptedTerms || !body.acceptedPrivacyPolicy) {
      return Response.json(
        { error: "You must accept the Terms & Conditions and Privacy Policy.", message: "You must accept the Terms & Conditions and Privacy Policy." },
        { status: 400 },
      )
    }
    if (email) {
      const found = await findUserByEmail(email)
      if (found) {
        return Response.json(
          { error: "An account with this email already exists. Please sign in instead.", message: "An account with this email already exists. Please sign in instead." },
          { status: 409 },
        )
      }
    }
    // Strip custom fields before forwarding to better-auth
    const { agreedToLegal: _, acceptedTerms: __, acceptedPrivacyPolicy: ___, acceptedLegalVersion: ____, ...clean } = body
    const cleanRequest = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(clean),
    })
    return safeForward(cleanRequest)
  }

  // Email OTP send: type-aware validation
  if (path === "/api/auth/email-otp/send-verification-otp" && email) {
    const otpType: string = body.type || ""
    const found = await findUserByEmail(email)

    if (otpType === "email-verification") {
      if (!found) {
        return Response.json(
          { error: "No account found for this email. Please sign up first.", message: "No account found for this email. Please sign up first." },
          { status: 404 },
        )
      }
      if (found.emailVerified) {
        return Response.json(
          { error: "This email is already verified. Please sign in instead.", message: "This email is already verified. Please sign in instead." },
          { status: 409 },
        )
      }
    } else if (otpType === "forget-password" || otpType === "password-reset") {
      if (!found) {
        return Response.json(
          { error: "No account found for this email.", message: "No account found for this email." },
          { status: 404 },
        )
      }
    }
  }

  // Email OTP verify: reject if user does not exist
  if (path === "/api/auth/email-otp/verify-email" && email) {
    const found = await findUserByEmail(email)
    if (!found) {
      return Response.json(
        { error: "No account found for this email. Please sign up first.", message: "No account found for this email. Please sign up first." },
        { status: 404 },
      )
    }
  }

  try {
    return await betterHandler.POST(request)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    const stack = e instanceof Error ? e.stack : ""
    console.error("[AUTH API ERROR]", msg)
    console.error("[AUTH API STACK]", stack)
    if (e && typeof e === "object") {
      try { console.error("[AUTH API DETAIL]", JSON.stringify(e, Object.getOwnPropertyNames(e))) } catch {}
    }
    const isDuplicate =
      msg.includes("unique") ||
      msg.includes("duplicate") ||
      msg.includes("already exists") ||
      msg.includes("E11000") ||
      msg.includes("23505")
    if (isDuplicate) {
      return Response.json(
        { error: "An account with this email already exists. Please sign in instead.", message: "An account with this email already exists. Please sign in instead." },
        { status: 409 },
      )
    }
    return Response.json({ error: msg, message: msg }, { status: 500 })
  }
}
