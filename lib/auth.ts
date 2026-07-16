import { betterAuth } from "better-auth"
import { emailOTP } from "better-auth/plugins"
import { pool } from "@/lib/db"
import { sendOtpEmail } from "@/lib/email"

// Only enable an OAuth provider when both its client id and secret are present.
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

export const auth = betterAuth({
  database: pool,
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "lumora-dev-secret-change-in-production-abcdef123456",
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    // Session is created ONLY after the user verifies their email via OTP.
    autoSignIn: false,
  },
  // After a successful OTP verification we mark the email verified AND open a
  // real session — this is what lets the user reach the dashboard.
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
  },
  socialProviders,
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600, // 10 minutes
      async sendVerificationOTP({ email, otp, type }) {
        console.log(`[AUTH] sendVerificationOTP callback FIRING: email=${email} type=${type} otp=${otp}`)
        const emailType = type === "forget-password" ? "reset" : "verification"
        try {
          await sendOtpEmail({ email, otp, type: emailType })
          console.log(`[AUTH] sendVerificationOTP callback COMPLETED successfully`)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          const stack = err instanceof Error ? err.stack : ""
          console.error(`[AUTH] sendVerificationOTP callback FAILED: ${msg}`)
          if (stack) console.error(`[AUTH] sendVerificationOTP callback stack: ${stack}`)
          throw err
        }
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
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
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
