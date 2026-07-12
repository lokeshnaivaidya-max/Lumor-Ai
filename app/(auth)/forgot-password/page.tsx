"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "motion/react"
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"
import { LumoraMark } from "@/components/lumora-mark"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Better Auth's forgot password sends OTP via emailOTP plugin
      const res = await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        // Don't reveal if email exists — just say sent
        throw new Error(json.error || "Could not send reset code")
      }

      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link
          href="/sign-in"
          className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>

        <div className="glass-card edge-light rounded-[32px] p-8 sm:p-10 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald/10">
              <CheckCircle2 className="h-7 w-7 text-emerald" />
            </div>
            <h2 className="mt-5 font-heading text-xl font-semibold text-foreground">Check your email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a password reset code to <strong className="text-foreground">{email}</strong>
            </p>
            <button
              onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
              className="premium-btn premium-btn-primary mt-6 w-full py-3 text-sm"
            >
              Enter reset code
            </button>
            <p className="mt-4 text-xs text-muted-foreground">
              Didn&apos;t receive it?{" "}
              <button onClick={() => setSent(false)} className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
                Try again
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <Link
        href="/sign-in"
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to sign in
      </Link>

      <div className="glass-card edge-light relative overflow-hidden rounded-[32px] p-8 sm:p-10 shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue/[0.03] via-transparent to-violet/[0.03]" />
        <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full blur-[100px]" style={{ background: "oklch(0.55 0.18 255 / 0.06)" }} />

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <motion.span whileHover={{ rotate: 90, scale: 1.05 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}>
              <LumoraMark className="h-8 w-8" />
            </motion.span>
            <span className="font-heading text-lg font-semibold tracking-tight">Lumora</span>
          </Link>

          <h1 className="mt-8 font-heading text-2xl font-medium text-foreground">Forgot password?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset code.
          </p>

          <form onSubmit={handleSubmit} className="mt-8">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="premium-input"
                autoComplete="email"
              />
            </label>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl border border-neg/30 bg-neg/10 px-4 py-2.5 text-sm text-neg"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={loading || !email}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="premium-btn premium-btn-primary mt-6 w-full py-3 text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </span>
              ) : (
                "Send reset code"
              )}
            </motion.button>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
