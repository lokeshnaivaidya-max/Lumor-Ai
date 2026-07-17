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

    if (isSignUp) {
      if (!agreedToLegal) {
        setError("You must agree to the Terms & Conditions and Privacy Policy to create an account.")
        setLoading(false)
        return
      }
    }

    try {
      if (isSignUp) {
        const result = await (authClient.signUp.email as any)({
          email,
          password,
          name,
          agreedToLegal: true,
          acceptedTerms: true,
          acceptedPrivacyPolicy: true,
          acceptedLegalVersion: "1.0",
        })
        if (result.error) {
          const errMsg = (result.error as Record<string, unknown>).message || (result.error as Record<string, unknown>).error || "Could not create account."
          const isDuplicate = (result.error as Record<string, unknown>).status === 409 || String(errMsg).toLowerCase().includes("already exists")
          const isLegal = (result.error as Record<string, unknown>).status === 400
          throw new Error(isDuplicate ? "An account with this email already exists" : isLegal ? String(errMsg) : String(errMsg))
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
        router.refresh()
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
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-sm"
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue/[0.04] via-transparent to-violet/[0.04]" />
        <div className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full blur-[120px]" style={{ background: "oklch(0.55 0.18 255 / 0.08)" }} />

        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <motion.span whileHover={{ rotate: 90, scale: 1.05 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}>
              <LumoraMark className="h-7 w-7" />
            </motion.span>
            <span className="font-heading text-base font-semibold tracking-tight text-foreground">Lumora</span>
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
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
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-white/[0.08] hover:border-white/20 disabled:opacity-50"
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
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#0a0a0f] px-3 text-[11px] uppercase tracking-widest text-muted-foreground">or</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className={enabledProviders.length > 0 ? "" : "mt-6"}>
            <div className="flex flex-col gap-4">
              {isSignUp && (
                <Field label="Full name" icon={<User className="h-3.5 w-3.5" />}>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" className="glass-input" autoComplete="name" />
                </Field>
              )}
              <Field label="Email" icon={<Mail className="h-3.5 w-3.5" />}>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="glass-input" autoComplete="email" />
              </Field>
              <Field label="Password" icon={<Lock className="h-3.5 w-3.5" />}>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="glass-input pr-10"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors hover:text-foreground p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </Field>
            </div>

            {!isSignUp && (
              <div className="mt-2 flex justify-end">
                <Link href="/forgot-password" className="text-xs font-medium text-muted-foreground/70 hover:text-foreground transition-colors">
                  Forgot password?
                </Link>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -4, height: 0 }}
                  className="mt-4 flex items-start gap-2 rounded-xl border border-red/20 bg-red/[0.06] px-3.5 py-2.5 text-xs text-red"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {isSignUp && (
              <div className="mt-5">
                <label className="flex cursor-pointer items-start gap-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={agreedToLegal}
                    onClick={() => setAgreedToLegal((s) => !s)}
                    disabled={loading}
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      agreedToLegal
                        ? "border-foreground bg-foreground text-background"
                        : "border-white/20 bg-white/[0.04] hover:border-white/40"
                    }`}
                  >
                    {agreedToLegal && <Check className="h-3 w-3" />}
                  </button>
                  <span className="text-xs leading-relaxed text-muted-foreground/80">
                    By creating an account, you agree to our{" "}
                    <Link href="/terms" target="_blank" className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80 transition-colors">
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" target="_blank" className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80 transition-colors">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading || oauthLoading !== null || (isSignUp && !agreedToLegal)}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="relative mt-5 w-full overflow-hidden rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSignUp ? "Create account" : "Sign in"}
              </span>
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground/70">
            {isSignUp ? "Already have an account? " : "New to Lumora? "}
            <Link href={isSignUp ? "/sign-in" : "/sign-up"} className="font-medium text-foreground hover:text-foreground/80 transition-colors">
              {isSignUp ? "Sign in" : "Create one"}
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
        {icon}
        {label}
      </span>
      {children}
    </label>
  )
}
