"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { Loader2, ArrowLeft, CheckCircle2, Mail, ArrowRight, AlertCircle, Info } from "lucide-react"
import { authClient } from "@/lib/auth-client"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const sendingRef = useRef(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (sendingRef.current) return
    sendingRef.current = true
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
      sendingRef.current = false
    }
  }

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Link href="/sign-in" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
        <div className="dm-card dm-card--inset overflow-hidden text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald/10">
            <CheckCircle2 className="h-6 w-6 text-emerald" />
          </div>
          <h2 className="dm-heading dm-heading--small mt-4">Check your email</h2>
          <p className="dm-body mt-2">
            We sent a reset code to <strong className="text-foreground">{email}</strong>
          </p>
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-primary/20 bg-primary/[0.06] px-4 py-3 text-xs leading-relaxed text-primary text-left">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
            <div>
              <p>
                Didn&apos;t receive the code? Please check your <strong>Spam</strong> or{" "}
                <strong>Junk</strong> folder. For some email providers, verification emails may be
                filtered there.
              </p>
              <p className="mt-1.5 text-[11px] text-primary/60">
                If you still don&apos;t receive the email after a minute, you can request a new
                verification code.
              </p>
            </div>
          </div>
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
      <Link href="/sign-in" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
      </Link>
      <div className="dm-card dm-card--inset overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <span className="font-heading text-base font-semibold tracking-tight text-foreground">✦ Lumora</span>
        </div>
        <h1 className="dm-heading dm-heading--small">Forgot password?</h1>
        <p className="dm-body mt-1.5">Enter your email and we&apos;ll send a reset code.</p>

        <form onSubmit={handleSubmit} className="mt-6">
          <label className="flex flex-col gap-1">
            <span className="dm-meta flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email
            </span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="glass-input" autoComplete="email" />
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
    </motion.div>
  )
}
