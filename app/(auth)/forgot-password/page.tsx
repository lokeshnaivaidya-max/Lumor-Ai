"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { Loader2, ArrowLeft, CheckCircle2, Mail, ArrowRight, AlertCircle } from "lucide-react"
import { LumoraMark } from "@/components/lumora-mark"
import { authClient } from "@/lib/auth-client"

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
      const { error } = await authClient.emailOtp.requestPasswordReset({ email })
      if (error) throw new Error(error.message || "Could not send reset code")
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Link href="/sign-in" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald/10">
            <CheckCircle2 className="h-6 w-6 text-emerald" />
          </div>
          <h2 className="mt-4 font-heading text-lg font-semibold text-foreground">Check your email</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a reset code to <strong className="text-foreground">{email}</strong>
          </p>
          <button
            onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
            className="mt-6 w-full rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90"
          >
            Enter reset code
          </button>
          <p className="mt-4 text-xs text-muted-foreground">
            Didn&apos;t receive it?{" "}
            <button onClick={() => setSent(false)} className="font-medium text-foreground hover:text-foreground/80 transition-colors underline underline-offset-2">
              Try again
            </button>
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      <Link href="/sign-in" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
      </Link>
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl">
        <div className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full blur-[120px]" style={{ background: "oklch(0.55 0.18 255 / 0.06)" }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <span className="font-heading text-base font-semibold tracking-tight text-foreground">✦ Lumora</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Forgot password?</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Enter your email and we&apos;ll send a reset code.</p>

          <form onSubmit={handleSubmit} className="mt-6">
            <label className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                <Mail className="h-3.5 w-3.5" /> Email
              </span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="auth-input" autoComplete="email" />
            </label>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }}
                  className="mt-4 flex items-start gap-2 rounded-xl border border-red/20 bg-red/[0.06] px-3.5 py-2.5 text-xs text-red">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading || !email}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="mt-5 w-full rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {loading ? "Sending…" : "Send reset code"}
              </span>
            </motion.button>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
