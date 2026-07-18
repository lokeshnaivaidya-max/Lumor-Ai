"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { authClient } from "@/lib/auth-client"
import { LumoraMark } from "@/components/lumora-mark"
import { GoogleIcon, YahooIcon, AppleIcon } from "./provider-icons"
import { Loader2, Eye, EyeOff, Mail, Lock, User, AlertCircle, Check } from "lucide-react"
import { recordAgreement } from "@/app/actions/agreement"

type Provider = "google" | "yahoo" | "apple"

const PROVIDER_META: Record<Provider, { label: string; Icon: (p: { className?: string }) => React.ReactNode }> = {
  google: { label: "Continue with Google", Icon: GoogleIcon },
  yahoo: { label: "Continue with Yahoo", Icon: YahooIcon },
  apple: { label: "Continue with Apple", Icon: AppleIcon },
}

export function AuthForm({ mode, enabledProviders }: { mode: "sign-in" | "sign-up"; enabledProviders: Provider[] }) {
  const router = useRouter()
  const isSignUp = mode === "sign-up"
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<Provider | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [agreedToLegal, setAgreedToLegal] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (isSignUp && name.trim().length < 2) {
      setError("Name must be at least 2 characters")
      setLoading(false)
      return
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address")
      setLoading(false)
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      setLoading(false)
      return
    }

    if (isSignUp && !agreedToLegal) {
      setError("You must agree to the Terms & Conditions and Privacy Policy to create an account.")
      setLoading(false)
      return
    }

    try {
      if (isSignUp) {
        const result = await (authClient.signUp.email as any)({
          email, password, name, agreedToLegal: true, acceptedTerms: true,
          acceptedPrivacyPolicy: true, acceptedLegalVersion: "1.0",
        })
        if (result.error) {
          const errMsg = (result.error as Record<string, unknown>).message || (result.error as Record<string, unknown>).error || "Could not create account."
          const isDuplicate = (result.error as Record<string, unknown>).status === 409 || String(errMsg).toLowerCase().includes("already exists")
          throw new Error(isDuplicate ? "An account with this email already exists" : String(errMsg))
        }
        const userId = (result.data as any)?.user?.id
        if (userId) {
          try { await recordAgreement(userId) } catch { /* best-effort */ }
        }
        router.push(`/verify-email?email=${encodeURIComponent(email)}`)
      } else {
        const result = await authClient.signIn.email({ email, password })
        if (result.error) {
          const errMsg = (result.error as Record<string, unknown>).message || (result.error as Record<string, unknown>).error || "Invalid email or password"
          throw new Error(String(errMsg))
        }
        router.push("/dashboard")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  async function handleOAuth(provider: Provider) {
    setError(null)
    setOauthLoading(provider)
    try {
      await authClient.signIn.social({ provider, callbackURL: "/dashboard" })
    } catch {
      setError(`Could not sign in with ${provider}. Please try again.`)
      setOauthLoading(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-sm"
    >
      <div className="relative overflow-hidden rounded-3xl border border-[oklch(0.91_0.01_75_/_0.06)] bg-[oklch(0.073_0.008_75)] p-8 shadow-2xl" style={{ backdropFilter: "blur(24px)" }}>
        <div className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full blur-[120px]" style={{ background: "oklch(0.75 0.1 85 / 0.06)" }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <LumoraMark className="h-6 w-6" />
            <span className="font-heading text-sm font-semibold tracking-tight text-[oklch(0.91_0.01_75)]">Lumora</span>
          </div>

          <h1 className="font-serif text-2xl font-normal tracking-tight text-[oklch(0.91_0.01_75)]" style={{ lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-[oklch(0.53_0.015_75)]" style={{ maxWidth: "26em" }}>
            {isSignUp
              ? "Start tracking global markets with AI-grade intelligence."
              : "Sign in to your Lumora terminal and portfolio."}
          </p>

          {enabledProviders.length > 0 && (
            <div className="mt-6 flex flex-col gap-2">
              {enabledProviders.map((p) => {
                const { label, Icon } = PROVIDER_META[p]
                return (
                  <motion.button
                    key={p}
                    type="button"
                    onClick={() => handleOAuth(p)}
                    disabled={oauthLoading !== null || loading}
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-3 rounded-xl border border-[oklch(0.91_0.01_75_/_0.08)] bg-[oklch(0.91_0.01_75_/_0.03)] px-4 py-2.5 text-sm font-medium text-[oklch(0.91_0.01_75)] transition-all hover:bg-[oklch(0.91_0.01_75_/_0.06)] hover:border-[oklch(0.91_0.01_75_/_0.15)] disabled:opacity-50"
                  >
                    {oauthLoading === p ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                    {label}
                  </motion.button>
                )
              })}
            </div>
          )}

          {enabledProviders.length > 0 && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[oklch(0.91_0.01_75_/_0.06)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[oklch(0.073_0.008_75)] px-3 text-[11px] uppercase tracking-widest text-[oklch(0.53_0.015_75)]">or</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className={enabledProviders.length > 0 ? "" : "mt-6"}>
            <div className="flex flex-col gap-4">
              {isSignUp && (
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[oklch(0.53_0.015_75)]">Full name</span>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" className="glass-input" autoComplete="name" />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[oklch(0.53_0.015_75)]">Email</span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="glass-input" autoComplete="email" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[oklch(0.53_0.015_75)]">Password</span>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required minLength={8} value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="glass-input pr-10"
                    autoComplete={isSignUp ? "new-password" : "current-password"} />
                  <button type="button" onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(0.53_0.015_75)] hover:text-[oklch(0.91_0.01_75)] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {!isSignUp && (
              <div className="mt-3 text-right">
                <Link href="/forgot-password" className="text-xs text-[oklch(0.53_0.015_75)] hover:text-[oklch(0.91_0.01_75)] transition-colors underline underline-offset-2">
                  Forgot password?
                </Link>
              </div>
            )}

            {isSignUp && (
              <label className="mt-4 flex items-start gap-2.5">
                <input type="checkbox" checked={agreedToLegal} onChange={(e) => setAgreedToLegal(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[oklch(0.91_0.01_75_/_0.15)] bg-transparent accent-[oklch(0.75_0.1_85)]" />
                <span className="text-xs text-[oklch(0.53_0.015_75)] leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-[oklch(0.91_0.01_75)] underline underline-offset-2 hover:text-[oklch(0.75_0.1_85)]">Terms &amp; Conditions</Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-[oklch(0.91_0.01_75)] underline underline-offset-2 hover:text-[oklch(0.75_0.1_85)]">Privacy Policy</Link>
                </span>
              </label>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -4, height: 0 }}
                  className="mt-4 flex items-start gap-2 rounded-xl border border-[oklch(0.55_0.22_22_/_0.15)] bg-[oklch(0.55_0.22_22_/_0.06)] px-3.5 py-2.5 text-xs text-[oklch(0.6_0.22_22)]"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading || (isSignUp && !agreedToLegal)}
              whileHover={{ scale: loading ? 1 : 1.005 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="mt-5 w-full rounded-xl bg-[oklch(0.75_0.1_85)] py-2.5 text-sm font-medium text-[oklch(0.073_0.008_75)] transition-all hover:bg-[oklch(0.78_0.1_85)] disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
              </span>
            </motion.button>
          </form>

          <p className="mt-6 text-center text-xs text-[oklch(0.53_0.015_75)]">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <Link href={isSignUp ? "/sign-in" : "/sign-up"} className="font-medium text-[oklch(0.91_0.01_75)] hover:text-[oklch(0.75_0.1_85)] transition-colors underline underline-offset-2">
              {isSignUp ? "Sign in" : "Create one"}
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  )
}
