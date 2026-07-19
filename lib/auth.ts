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
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET ?? ""

if (!BETTER_AUTH_SECRET) {
  console.warn(
    "[Lumora] BETTER_AUTH_SECRET is not set. Auth requests will fail until it is provided. " +
    "Refusing to crash the server import with an insecure default.",
  )
}

const _auth = betterAuth({
  database: pool,
  secret: BETTER_AUTH_SECRET,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
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
  trustedOrigins: [
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],
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
