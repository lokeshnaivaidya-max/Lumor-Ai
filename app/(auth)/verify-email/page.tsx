"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { authClient } from "@/lib/auth-client"

const RESEND_COOLDOWN = 60 // seconds
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
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: targetEmail,
        type: "email-verification",
      })
      if (error) throw new Error(error.message || "Failed to send verification code")
      setResendCooldown(RESEND_COOLDOWN)
      setAttempts(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code")
    } finally {
      setSendingOtp(false)
    }
  }, [])

  // Auto-send OTP on mount if email is present
  useEffect(() => {
    if (!emailFromUrl) return
    handleSendOtp(emailFromUrl)
  }, [emailFromUrl, handleSendOtp])

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
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
      // Paste handling
      const digits = value.replace(/\D/g, "").slice(0, 6).split("")
      const newOtp = [...otp]
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d
      })
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
      const nextIdx = index + 1
      inputRefs.current[nextIdx]?.focus()
      setFocusedIdx(nextIdx)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevIdx = index - 1
      inputRefs.current[prevIdx]?.focus()
      setFocusedIdx(prevIdx)
    }
  }

  const handleVerify = async () => {
    const code = otp.join("")
    if (code.length !== 6) return

    setLoading(true)
    setError(null)

    try {
      const { error } = await authClient.emailOtp.verifyEmail({
        email,
        otp: code,
      })

      if (error) {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)

        if (error.message?.toLowerCase().includes("expired")) {
          setError("Code expired. Request a new one.")
        } else if (newAttempts >= MAX_ATTEMPTS) {
          setError("Too many attempts. Request a new code.")
        } else {
          setError(`Invalid code. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`)
        }
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 1500)
    } catch {
      setError("Something went wrong. Try again.")
      setLoading(false)
    }
  }

  const allFilled = otp.every((d) => d !== "")

  if (success) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
        >
          <CheckCircle2 className="h-16 w-16 text-emerald" />
        </motion.div>
        <h2 className="mt-6 font-heading text-xl font-semibold text-foreground">Email verified!</h2>
        <p className="mt-2 text-sm text-muted-foreground">Redirecting to your dashboard…</p>
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
        href={emailFromUrl ? "/sign-up" : "/sign-in"}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      <div className="glass-card edge-light relative overflow-hidden rounded-[32px] p-8 sm:p-10 shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue/[0.03] via-transparent to-violet/[0.03]" />
        <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full blur-[100px]" style={{ background: "oklch(0.55 0.18 255 / 0.06)" }} />

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2"
          >
            <span className="font-heading text-lg font-semibold tracking-tight text-foreground">✦ Lumora</span>
          </motion.div>

          <h1 className="mt-6 font-heading text-xl font-medium text-foreground text-center">Verify your email</h1>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            {editingEmail ? (
              <span>Enter your email address</span>
            ) : (
              <>
                Enter the 6-digit code sent to{" "}
                <button
                  onClick={() => setEditingEmail(true)}
                  className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                >
                  {email || "your email"}
                </button>
              </>
            )}
          </p>

          {editingEmail ? (
            <div className="mt-6">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="premium-input"
                />
              </label>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setEditingEmail(false)}
                  className="premium-btn premium-btn-ghost flex-1 py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setEditingEmail(false)
                    handleSendOtp(email)
                  }}
                  disabled={!email || sendingOtp}
                  className="premium-btn premium-btn-primary flex-1 py-2.5 text-sm"
                >
                  {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 6-box OTP input */}
              <div className="mt-8 flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={() => setFocusedIdx(i)}
                    className={`h-12 w-10 sm:h-14 sm:w-12 rounded-xl border-2 text-center font-mono text-xl font-semibold transition-all duration-150 outline-none ${
                      focusedIdx === i
                        ? "border-primary bg-primary/[0.06] shadow-sm"
                        : digit
                          ? "border-foreground/20 bg-white/50"
                          : "border-border bg-white/30"
                    } text-foreground`}
                    autoComplete="one-time-code"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mt-4 flex items-center gap-2 rounded-xl border border-neg/30 bg-neg/10 px-4 py-2.5 text-sm text-neg"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Attempts warning */}
              {attempts > 0 && attempts < MAX_ATTEMPTS && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {MAX_ATTEMPTS - attempts} verification {MAX_ATTEMPTS - attempts === 1 ? "attempt" : "attempts"} remaining
                </p>
              )}

              {/* Verify button */}
              <motion.button
                onClick={handleVerify}
                disabled={loading || !allFilled}
                whileHover={{ scale: loading || !allFilled ? 1 : 1.01 }}
                whileTap={{ scale: loading || !allFilled ? 1 : 0.98 }}
                className="premium-btn premium-btn-primary mt-6 w-full py-3 text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying…
                  </span>
                ) : (
                  "Verify email"
                )}
              </motion.button>

              {/* Resend */}
              <div className="mt-5 flex items-center justify-center gap-2 text-sm">
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || sendingOtp}
                  className="flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                >
                  {sendingOtp ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : sendingOtp
                      ? "Sending…"
                      : "Resend code"}
                </button>
              </div>

              {/* Change email */}
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Wrong email?{" "}
                <button onClick={() => setEditingEmail(true)} className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
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
    <Suspense fallback={<div className="h-64 w-full max-w-md animate-pulse rounded-[32px] bg-white/20" />}>
      <VerifyEmailInner />
    </Suspense>
  )
}
