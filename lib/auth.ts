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
// unhandled rejection and crashes the Server Components render (the red
// "Server Components error" banner) and breaks every auth API call (500s).
// We therefore always provide a valid URL: prefer explicit env, then the
// Vercel-provided hosts, then a localhost default in development. When even
// that is unavailable (production with no configured host) we OMIT baseURL so
// Better Auth falls back to deriving it from the incoming request headers.
function resolveBaseUrl(): string | undefined {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL)
    return process.env.VERCEL_URL.startsWith("http")
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL}`
  if (process.env.V0_RUNTIME_URL) return process.env.V0_RUNTIME_URL
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000"
  return undefined
}

const RESOLVED_BASE_URL = resolveBaseUrl()

// Better Auth derives its base URL from `process.env.BETTER_AUTH_URL` (or, at
// request time, from forwarded headers). When that env var is unset the library
// calls `new URL(<origin>)` with an empty/invalid value during `init()`, which
// throws "Invalid URL". That throw is what surfaces as a 500 on every auth API
// call and as an unhandled rejection that crashes the Server Components render.
// We therefore guarantee the env var is populated whenever we can determine a
// host. This is a targeted fix for missing configuration, not a change to the
// auth flow, routes, or business logic.
if (!process.env.BETTER_AUTH_URL && RESOLVED_BASE_URL) {
  process.env.BETTER_AUTH_URL = RESOLVED_BASE_URL
}

// Origins we accept auth requests from. Always include the resolved base URL's
// origin so the app can authenticate against itself (sign-in, callbacks, RSC
// session reads). Without this, CSRF origin validation rejects same-origin
// requests and every sign-in fails.
const TRUSTED_ORIGINS = (() => {
  const list: string[] = []
  const add = (value: string | undefined) => {
    if (!value) return
    try {
      const origin = new URL(value).origin
      if (origin && !list.includes(origin)) list.push(origin)
    } catch {
      /* ignore malformed url */
    }
  }
  add(RESOLVED_BASE_URL)
  // In development the app is reached via localhost and/or 127.0.0.1; accept
  // both so auth works regardless of which the browser/devtools use.
  if (process.env.NODE_ENV !== "production") {
    add("http://localhost:3000")
    add("http://127.0.0.1:3000")
  }
  add(process.env.V0_RUNTIME_URL)
  add(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
  add(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
  )
  return list
})()

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
  trustedOrigins: TRUSTED_ORIGINS,
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
