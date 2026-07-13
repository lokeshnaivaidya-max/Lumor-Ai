"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle, RefreshCw, Mail, SendHorizonal } from "lucide-react"
import { authClient } from "@/lib/auth-client"

const RESEND_COOLDOWN = 60
const MAX_ATTEMPTS = 5

function VerifyEmailInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailFromUrl = searchParams.get("email") || ""

  const [email, setEmail] = useState(emailFromUrl)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [focusedIdx, setFocusedIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [editingEmail, setEditingEmail] = useState(!emailFromUrl)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleSendOtp = useCallback(async (targetEmail: string) => {
    if (!targetEmail) return
    setSendingOtp(true)
    setError(null)
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({ email: targetEmail, type: "email-verification" })
      if (error) throw new Error(error.message || "Failed to send verification code")
      setResendCooldown(RESEND_COOLDOWN)
      setAttempts(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code")
    } finally {
      setSendingOtp(false)
    }
  }, [])

  useEffect(() => {
    if (!emailFromUrl) return
    handleSendOtp(emailFromUrl)
  }, [emailFromUrl, handleSendOtp])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleResend = () => {
    if (resendCooldown > 0 || sendingOtp) return
    handleSendOtp(email)
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("")
      const newOtp = [...otp]
      digits.forEach((d, i) => { if (i < 6) newOtp[i] = d })
      setOtp(newOtp)
      const nextIdx = Math.min(digits.length, 5)
      inputRefs.current[nextIdx]?.focus()
      setFocusedIdx(nextIdx)
      return
    }
    const newOtp = [...otp]
    newOtp[index] = value.replace(/\D/g, "")
    setOtp(newOtp)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
      setFocusedIdx(index + 1)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
      setFocusedIdx(index - 1)
    }
  }

  const handleVerify = async () => {
    const code = otp.join("")
    if (code.length !== 6) return
    setLoading(true)
    setError(null)

    try {
      const { error } = await authClient.emailOtp.verifyEmail({ email, otp: code })
      if (error) {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        if (error.message?.toLowerCase().includes("expired")) setError("Code expired. Request a new one.")
        else if (newAttempts >= MAX_ATTEMPTS) setError("Too many attempts. Request a new code.")
        else setError(`Invalid code. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`)
        setLoading(false)
        return
      }
      setSuccess(true)
      setTimeout(() => { router.push("/dashboard"); router.refresh() }, 1500)
    } catch {
      setError("Something went wrong. Try again.")
      setLoading(false)
    }
  }

  const allFilled = otp.every((d) => d !== "")

  if (success) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}>
          <CheckCircle2 className="h-14 w-14 text-emerald" />
        </motion.div>
        <h2 className="mt-5 font-heading text-lg font-semibold text-foreground">Email verified!</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Redirecting to your dashboard…</p>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      <Link href={emailFromUrl ? "/sign-up" : "/sign-in"} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl">
        <div className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full blur-[120px]" style={{ background: "oklch(0.55 0.18 255 / 0.06)" }} />
        <div className="relative">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="font-heading text-base font-semibold tracking-tight text-foreground">✦ Lumora</span>
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-foreground text-center">Verify your email</h1>
          <p className="mt-1.5 text-sm text-muted-foreground text-center">
            {editingEmail ? "Enter your email address" : (
              <>Enter the code sent to{" "}
                <button onClick={() => setEditingEmail(true)} className="font-medium text-foreground underline underline-offset-2 hover:text-foreground/80">
                  {email || "your email"}
                </button>
              </>
            )}
          </p>

          {editingEmail ? (
            <div className="mt-6">
              <label className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  <Mail className="h-3.5 w-3.5" /> Email
                </span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="auth-input" />
              </label>
              <div className="mt-4 flex gap-3">
                <button onClick={() => setEditingEmail(false)} className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm font-medium text-foreground transition-all hover:bg-white/[0.08]">
                  Cancel
                </button>
                <button onClick={() => { setEditingEmail(false); handleSendOtp(email) }} disabled={!email || sendingOtp}
                  className="flex-1 rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-50">
                  {sendingOtp ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Send code"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 flex justify-center gap-2">
                {otp.map((digit, i) => (
                  <input key={i} ref={(el) => { inputRefs.current[i] = el }}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)} onFocus={() => setFocusedIdx(i)}
                    className={`h-11 w-9 sm:h-12 sm:w-10 rounded-xl border text-center font-mono text-lg font-semibold transition-all duration-150 outline-none ${
                      focusedIdx === i ? "border-foreground/30 bg-foreground/[0.04]" : digit ? "border-white/15 bg-white/[0.04]" : "border-white/10 bg-transparent"
                    } text-foreground`}
                    autoComplete="one-time-code" autoFocus={i === 0}
                  />
                ))}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }}
                    className="mt-4 flex items-start gap-2 rounded-xl border border-red/20 bg-red/[0.06] px-3.5 py-2.5 text-xs text-red">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {attempts > 0 && attempts < MAX_ATTEMPTS && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {MAX_ATTEMPTS - attempts} verification {MAX_ATTEMPTS - attempts === 1 ? "attempt" : "attempts"} remaining
                </p>
              )}

              <motion.button
                onClick={handleVerify}
                disabled={loading || !allFilled}
                whileHover={{ scale: loading || !allFilled ? 1 : 1.01 }} whileTap={{ scale: loading || !allFilled ? 1 : 0.98 }}
                className="mt-5 w-full rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
                  {loading ? "Verifying…" : "Verify email"}
                </span>
              </motion.button>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <button onClick={handleResend} disabled={resendCooldown > 0 || sendingOtp}
                  className="flex items-center gap-1.5 text-muted-foreground/60 hover:text-foreground transition-colors disabled:opacity-40 text-xs">
                  {sendingOtp ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : sendingOtp ? "Sending…" : "Resend code"}
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Wrong email?{" "}
                <button onClick={() => setEditingEmail(true)} className="font-medium text-foreground hover:text-foreground/80 transition-colors underline underline-offset-2">
                  Change email address
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="h-64 w-full max-w-sm animate-pulse rounded-3xl bg-white/5 backdrop-blur-2xl" />}>
      <VerifyEmailInner />
    </Suspense>
  )
}
