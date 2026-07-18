"use client"

import { createAuthClient } from "better-auth/react"
import { emailOTPClient } from "better-auth/client/plugins"

// ─── INSTRUMENTATION (temporary) ─────────────────────────────────────────────
// Wrap fetch so every request to the auth OTP / sign-up endpoints is logged
// with a call stack, revealing exactly which code path triggers each request.
const _origFetch = globalThis.fetch?.bind(globalThis)
if (_origFetch) {
  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url
    if (url && (url.includes("/api/auth/email-otp/") || url.includes("/api/auth/sign-up/"))) {
      console.log("[OTP-TRACE] >>> fetch() to auth endpoint", { url, method: init?.method ?? "GET", stack: new Error().stack })
    }
    return _origFetch(input as RequestInfo | URL, init)
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
  fetchOptions: {
    onRequest: ({ url, method }) => {
      const u = typeof url === "string" ? url : url.toString()
      if (u && (u.includes("/api/auth/email-otp/") || u.includes("/api/auth/sign-up/"))) {
        console.log("[OTP-TRACE] >>> better-auth onRequest", { url: u, method })
      }
    },
  },
})

export const { signIn, signUp, signOut, useSession } = authClient
