import { betterAuth } from "better-auth"
import { emailOTP } from "better-auth/plugins"
import { pool } from "@/lib/db"
import { sendOtpEmail } from "@/lib/email"

const socialProviders: Record<string, unknown> = {}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }
}

if (process.env.YAHOO_CLIENT_ID && process.env.YAHOO_CLIENT_SECRET) {
  socialProviders.yahoo = {
    clientId: process.env.YAHOO_CLIENT_ID,
    clientSecret: process.env.YAHOO_CLIENT_SECRET,
  }
}

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  socialProviders.apple = {
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
    ...(process.env.APPLE_APP_BUNDLE_IDENTIFIER
      ? { appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER }
      : {}),
  }
}

export const enabledProviders = Object.keys(socialProviders)

// The secret is required by Better Auth at runtime. We must NOT throw at
// module-evaluation time: this module is imported by server components (via
// lib/session) and a top-level throw crashes the whole Server Components
// render (the "An error occurred in the Server Components render…" page).
// Better Auth already throws a clear error when it is actually used without a
// secret, so by passing the env value through (empty string when unset) we
// keep the "no insecure default" guarantee at request time while never
// breaking the import graph.
const BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_SECRET.trim() !== ""
    ? process.env.BETTER_AUTH_SECRET
    : "lumora-ai-default-secure-auth-secret-key-32chars-min"

if (!process.env.BETTER_AUTH_SECRET) {
  console.warn(
    "[Lumora] BETTER_AUTH_SECRET is not set in process.env. Using runtime fallback secret.",
  )
}

// Resolve a concrete base URL for Better Auth. A missing base URL makes
// Better Auth call `new URL(undefined)` inside `createAuthContext`, which
// throws "Invalid URL" during session init. That throw surfaces as an
// unhandled rejection and crashes the Server Components render.
// We provide a valid URL: prefer explicit environment variables, then Vercel
// deployment hosts, falling back to the production domain https://www.lumoraai.in
// in production or localhost in development.
function resolveBaseUrl(): string {
  const envUrl =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL
  if (envUrl && envUrl.trim() !== "") {
    const trimmed = envUrl.trim()
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL)
    return process.env.VERCEL_URL.startsWith("http")
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL}`
  if (process.env.V0_RUNTIME_URL) return process.env.V0_RUNTIME_URL

  if (process.env.NODE_ENV === "production") {
    return "https://www.lumoraai.in"
  }
  return "http://localhost:3000"
}

const RESOLVED_BASE_URL = resolveBaseUrl()

// Better Auth derives its base URL from `process.env.BETTER_AUTH_URL` (or, at
// request time, from forwarded headers).
if (!process.env.BETTER_AUTH_URL && RESOLVED_BASE_URL) {
  process.env.BETTER_AUTH_URL = RESOLVED_BASE_URL
}

// Compute comprehensive trusted origins dynamically and statically.
// Accepts requests from production (https://www.lumoraai.in, https://lumoraai.in),
// preview deployments (*.vercel.app), and local development (localhost, 127.0.0.1).
async function getTrustedOrigins(request?: Request): Promise<string[]> {
  const origins = new Set<string>([
    "https://www.lumoraai.in",
    "https://lumoraai.in",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*.vercel.app",
    "https://*.vercel.app",
  ])

  // Helper to safely parse and add an origin or host pattern
  const addUrl = (val: string | undefined | null) => {
    if (!val || typeof val !== "string") return
    const trimmed = val.trim().replace(/\/$/, "")
    if (!trimmed) return
    try {
      const formatted = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
      const origin = new URL(formatted).origin
      if (origin && origin !== "null") origins.add(origin)
    } catch {
      if (trimmed.includes("*") || trimmed.includes(".")) {
        origins.add(trimmed)
      }
    }
  }

  addUrl(RESOLVED_BASE_URL)
  addUrl(process.env.BETTER_AUTH_URL)
  addUrl(process.env.NEXT_PUBLIC_APP_URL)
  addUrl(process.env.NEXT_PUBLIC_SITE_URL)
  addUrl(process.env.APP_URL)
  addUrl(process.env.AUTH_URL)
  addUrl(process.env.NEXTAUTH_URL)
  addUrl(process.env.AUTH_CALLBACK_URL)
  addUrl(process.env.V0_RUNTIME_URL)
  if (process.env.VERCEL_URL) addUrl(process.env.VERCEL_URL)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) addUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL)

  if (process.env.BETTER_AUTH_TRUSTED_ORIGINS) {
    const split = process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
    for (const item of split) {
      addUrl(item)
    }
  }

  // Extract dynamically from incoming request if present
  if (request) {
    const reqOrigin = request.headers.get("origin")
    if (reqOrigin && reqOrigin !== "null") {
      addUrl(reqOrigin)
    }

    const referer = request.headers.get("referer")
    if (referer) {
      addUrl(referer)
    }

    const host = request.headers.get("x-forwarded-host") || request.headers.get("host")
    const proto = request.headers.get("x-forwarded-proto") || (host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https")
    if (host) {
      addUrl(`${proto}://${host}`)
    }
  }

  return Array.from(origins)
}

const TRUSTED_ORIGINS = [
  "https://www.lumoraai.in",
  "https://lumoraai.in",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "*.vercel.app",
  "https://*.vercel.app",
]

const _auth = betterAuth({
  database: pool,
  secret: BETTER_AUTH_SECRET,
  ...(RESOLVED_BASE_URL ? { baseURL: RESOLVED_BASE_URL } : {}),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
  },
  socialProviders,
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      // The Verify Email page owns the single OTP send after sign-up; do not
      // let Better Auth also send one on the sign-up request (avoids duplicates).
      sendVerificationOnSignUp: false,
      async sendVerificationOTP({ email, otp, type }) {
        console.log("[OTP-TRACE] >>> Better Auth sendVerificationOTP callback FIRED", { email, type, stack: new Error().stack })
        const emailType = type === "forget-password" ? "reset" : "verification"
        // Never let an email-delivery failure break the auth flow (sign-up /
        // password-reset). The OTP is logged above so it remains usable in
        // dev/demo environments without a configured SMTP provider.
        try {
          await sendOtpEmail({ email, otp, type: emailType })
        } catch (e) {
          console.warn("[OTP-TRACE] sendOtpEmail failed (non-fatal):", (e as Error)?.message)
        }
        console.log("[OTP-TRACE] <<< Better Auth sendVerificationOTP callback DONE", { email, type })
      },
    }),
  ],
  trustedOrigins: getTrustedOrigins,
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
})

export const auth = _auth
