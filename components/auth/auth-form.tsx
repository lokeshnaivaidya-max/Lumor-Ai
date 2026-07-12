"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "motion/react"
import { authClient } from "@/lib/auth-client"
import { LumoraMark } from "@/components/lumora-mark"
import { GoogleIcon, MicrosoftIcon, AppleIcon } from "./provider-icons"
import { Loader2, Eye, EyeOff } from "lucide-react"

type Provider = "google" | "microsoft" | "apple"

const PROVIDER_META: Record<Provider, { label: string; Icon: (p: { className?: string }) => React.ReactNode }> = {
  google: { label: "Continue with Google", Icon: GoogleIcon },
  microsoft: { label: "Continue with Microsoft", Icon: MicrosoftIcon },
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await authClient.signUp.email({ email, password, name })
        if (error) throw new Error(error.message || "Could not create account")
      } else {
        const { error } = await authClient.signIn.email({ email, password })
        if (error) throw new Error(error.message || "Invalid email or password")
      }
      router.push("/dashboard")
      router.refresh()
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card edge-light relative w-full max-w-md overflow-hidden rounded-[28px] p-8 sm:p-10"
    >
      <div className="grain absolute inset-0" aria-hidden />

      <div className="relative">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <LumoraMark className="h-8 w-8" />
          <span className="font-heading text-lg font-semibold tracking-tight">Lumora</span>
        </Link>

        <h1 className="mt-8 font-heading text-2xl font-medium tracking-tight text-foreground">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSignUp ? "Start tracking global markets with AI-grade intelligence." : "Sign in to your Lumora terminal and portfolio."}
        </p>

        {enabledProviders.length > 0 && (
          <div className="mt-8 flex flex-col gap-2.5">
            {enabledProviders.map((p) => {
              const { label, Icon } = PROVIDER_META[p]
              return (
                <button key={p} type="button" onClick={() => handleOAuth(p)} disabled={oauthLoading !== null || loading}
                  className="glass-card flex items-center justify-center gap-3 rounded-full px-5 py-3 text-sm font-medium text-foreground transition-all disabled:opacity-60"
                >
                  {oauthLoading === p ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                  {label}
                </button>
              )
            })}
          </div>
        )}

        {enabledProviders.length > 0 && (
          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">or with email</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        )}

        <form onSubmit={handleSubmit} className={enabledProviders.length > 0 ? "" : "mt-8"}>
          <div className="flex flex-col gap-4">
            {isSignUp && (
              <Field label="Full name">
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" className="premium-input" autoComplete="name" />
              </Field>
            )}
            <Field label="Email">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="premium-input" autoComplete="email" />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="premium-input pr-11" autoComplete={isSignUp ? "new-password" : "current-password"} />
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
          </div>

          {error && <p className="mt-4 rounded-xl border border-neg/30 bg-neg/10 px-4 py-2.5 text-sm text-neg">{error}</p>}

          <button type="submit" disabled={loading || oauthLoading !== null}
            className="premium-btn premium-btn-primary mt-6 w-full py-3"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account? " : "New to Lumora? "}
          <Link href={isSignUp ? "/sign-in" : "/sign-up"} className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
            {isSignUp ? "Sign in" : "Create one"}
          </Link>
        </p>
      </div>
    </motion.div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
