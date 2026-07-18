"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle, RefreshCw, Mail, SendHorizonal, Info, ShieldCheck } from "lucide-react"
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
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const sendingRef = useRef(false)
  const mountedRef = useRef(true)
  // Tracks the email an OTP has already been requested for, so the same
  // email is never requested twice (guards React double-invoke / remounts).
  const sentForEmail = useRef<string | null>(null)

  const requestOtp = useCallback(async (targetEmail: string, allowResend = false) => {
    if (!targetEmail) return
    if (!allowResend && sentForEmail.current === targetEmail) return
    if (sendingRef.current) return
    sendingRef.current = true
    sentForEmail.current = targetEmail
    setSendingOtp(true)
    setError(null)
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({ email: targetEmail, type: "email-verification" })
      if (error) throw new Error(error.message || "Failed to send verification code")
      if (mountedRef.current) {
        setResendCooldown(RESEND_COOLDOWN)
        setAttempts(0)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to send code")
      }
    } finally {
      if (mountedRef.current) setSendingOtp(false)
      sendingRef.current = false
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Send exactly one OTP when the page first loads with an email from sign-up.
  useEffect(() => {
    if (emailFromUrl) requestOtp(emailFromUrl)
  }, [emailFromUrl, requestOtp])

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

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  const handleResend = () => {
    if (resendCooldown > 0 || sendingOtp || sendingRef.current) return
    requestOtp(email, true)
    showToast("New verification code sent. Please check your Inbox and Spam folder.")
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
      if (mountedRef.current) {
        setSuccess(true)
        const navTimer = setTimeout(() => { if (mountedRef.current) { router.push("/dashboard"); router.refresh() } }, 1500)
        toastTimer.current = navTimer
      }
    } catch {
      if (mountedRef.current) setError("Something went wrong. Try again.")
      setLoading(false)
    }
  }

  const allFilled = otp.every((d) => d !== "")

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="glass-dialog rounded-3xl p-8 sm:p-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald/10"
          >
            <CheckCircle2 className="h-8 w-8 text-emerald" />
          </motion.div>
          <h2 className="heading mt-5">Email verified</h2>
          <p className="body mt-1.5">Redirecting to your dashboard…</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-sm">
      <Link
        href={emailFromUrl ? "/sign-up" : "/sign-in"}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <div className="glass-dialog rounded-3xl p-8 sm:p-10">
        <div className="mb-6">
          <span className="font-serif text-lg italic" style={{ color: "var(--text-primary)" }}>Lumora</span>
        </div>

        <h1 className="heading">Verify your email</h1>
        <p className="body mt-1.5">
          {editingEmail ? (
            "Enter your email address to receive a verification code."
          ) : (
            <>
              We sent a 6-digit code to{" "}
              <button
                onClick={() => setEditingEmail(true)}
                className="font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
                style={{ color: "var(--gold)" }}
              >
                {email || "your email"}
              </button>
            </>
          )}
        </p>

        {editingEmail ? (
          <div className="mt-6 space-y-4">
            <div className="field">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                className="field__input"
                autoComplete="email"
              />
              <label className="field__label">Email address</label>
            </div>
            <button
              onClick={() => { setEditingEmail(false); sentForEmail.current = null; requestOtp(email, true) }}
              disabled={!email || sendingOtp}
              className="btn btn--gold w-full justify-center"
            >
              {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
            </button>
          </div>
        ) : (
          <>
            <div className="mt-7 flex justify-center gap-2.5">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onFocus={() => setFocusedIdx(i)}
                  className={`h-14 w-12 rounded-xl border text-center font-mono text-xl font-semibold transition-all duration-150 outline-none ${
                    focusedIdx === i
                      ? "border-[var(--gold)] bg-[var(--gold-glow)] shadow-[0_0_0_3px_var(--gold-glow)]"
                      : digit
                        ? "border-[var(--glass-border-hover)]"
                        : "border-[var(--glass-border)]"
                  }`}
                  style={{ color: "var(--text-primary)", background: "transparent" }}
                  autoComplete="one-time-code"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[var(--glass-border)] px-3.5 py-2.5 text-xs leading-relaxed" style={{ color: "var(--text-tertiary)", background: "var(--glass-bg)" }}>
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--gold)" }} />
              <span>
                Didn&apos;t get it? Check your <strong style={{ color: "var(--text-secondary)" }}>Spam</strong> or{" "}
                <strong style={{ color: "var(--text-secondary)" }}>Junk</strong> folder, then request a new code below.
              </span>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -4, height: 0 }}
                  className="mt-3 flex items-start gap-2 rounded-xl border border-red/20 bg-red/[0.06] px-3.5 py-2.5 text-xs text-red"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {attempts > 0 && attempts < MAX_ATTEMPTS && (
              <p className="mt-3 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
                {MAX_ATTEMPTS - attempts} verification {MAX_ATTEMPTS - attempts === 1 ? "attempt" : "attempts"} remaining
              </p>
            )}

            <button
              onClick={handleVerify}
              disabled={loading || !allFilled}
              className="btn btn--gold mt-5 w-full justify-center"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
              {loading ? "Verifying…" : "Verify email"}
            </button>

            <div className="mt-4 flex items-center justify-center">
              {resendCooldown > 0 ? (
                <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  <RefreshCw className="h-3 w-3" />
                  Resend in {resendCooldown}s
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={sendingOtp}
                  className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80 disabled:opacity-40"
                  style={{ color: "var(--gold)" }}
                >
                  {sendingOtp ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  {sendingOtp ? "Sending…" : "Resend code"}
                </button>
              )}
            </div>

            <p className="mt-4 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
              Wrong email?{" "}
              <button
                onClick={() => setEditingEmail(true)}
                className="font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
                style={{ color: "var(--gold)" }}
              >
                Change email address
              </button>
            </p>
          </>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.92, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, scale: 0.95, filter: "blur(4px)" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-2.5 rounded-2xl border border-emerald/20 bg-emerald/10 px-5 py-3 text-xs text-emerald shadow-2xl backdrop-blur-2xl">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="glass-dialog rounded-3xl p-8 h-64 w-full max-w-sm animate-pulse" />}>
      <VerifyEmailInner />
    </Suspense>
  )
}
