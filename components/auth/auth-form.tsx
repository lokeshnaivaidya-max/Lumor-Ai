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
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(provider: Provider) {
    setOauthLoading(provider)
    setError(null)
    try {
      await authClient.signIn.social({ provider, callbackURL: "/dashboard" })
    } catch {
      setError("OAuth sign-in failed. Please try again.")
    } finally {
      setOauthLoading(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-sm"
    >
      <div className="glass-dialog rounded-3xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="font-serif text-base italic text-[var(--text-primary)]">Lumora</span>
        </div>

        <h1 className="heading heading--small">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="body mt-1.5">
          {isSignUp
            ? "Start your AI-powered investment journey."
            : "Sign in to your Lumora account."}
        </p>

        {enabledProviders.length > 0 && (
          <div className="mt-6 space-y-2.5">
            {enabledProviders.map((p, i) => {
              const meta = PROVIDER_META[p]
              return (
                <motion.button
                  key={p}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => handleOAuth(p)}
                  disabled={oauthLoading === p}
                  className="glass-hover btn w-full justify-center"
                >
                  {oauthLoading === p ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <meta.Icon />
                  )}
                  {oauthLoading === p ? "Connecting..." : meta.label}
                </motion.button>
              )
            })}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: "var(--glass-border)" }} />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs" style={{ color: "var(--text-tertiary)", background: "var(--depth-overlay)" }}>
                  or continue with email
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isSignUp && (
            <div>
              <label className="meta flex items-center gap-1.5 mb-1.5">
                <User className="h-3 w-3" /> Name
              </label>
              <input type="text" required value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name" className="glass-input w-full"
                autoComplete="name" />
            </div>
          )}

          <div>
            <label className="meta flex items-center gap-1.5 mb-1.5">
              <Mail className="h-3 w-3" /> Email
            </label>
            <input type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" className="glass-input w-full"
              autoComplete="email" />
          </div>

          <div>
            <label className="meta flex items-center gap-1.5 mb-1.5">
              <Lock className="h-3 w-3" /> Password
            </label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required minLength={8}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? "At least 8 characters" : "Your password"}
                className="glass-input w-full pr-10" autoComplete={isSignUp ? "new-password" : "current-password"} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={agreedToLegal}
                onChange={(e) => setAgreedToLegal(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[var(--glass-border)] bg-transparent"
                style={{ accentColor: "var(--gold)" }} />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                I agree to the{" "}
                <Link href="/terms" className="text-[var(--gold)] hover:underline">Terms &amp; Conditions</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-[var(--gold)] hover:underline">Privacy Policy</Link>.
              </span>
            </label>
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                className="flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-xs"
                style={{ background: "rgba(244, 63, 94, 0.06)", border: "1px solid rgba(244, 63, 94, 0.2)", color: "var(--rose)" }}
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="btn btn--gold w-full justify-center"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSignUp ? (
              "Create account"
            ) : (
              "Sign in"
            )}
          </motion.button>
        </form>

        <p className="mt-5 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
          {isSignUp ? (
            <>Already have an account?{" "}
              <Link href="/sign-in" className="text-[var(--gold)] hover:underline">Sign in</Link>
            </>
          ) : (
            <>
              <Link href="/forgot-password" className="text-[var(--gold)] hover:underline">Forgot password?</Link>
              <span className="mx-2">&middot;</span>
              <Link href="/sign-up" className="text-[var(--gold)] hover:underline">Create account</Link>
            </>
          )}
        </p>
      </div>
    </motion.div>
  )
}
