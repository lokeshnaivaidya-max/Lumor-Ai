"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle, Eye, EyeOff, RefreshCw } from "lucide-react"
import { authClient } from "@/lib/auth-client"

const RESEND_COOLDOWN = 60

function ResetPasswordInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailFromUrl = searchParams.get("email") || ""

  const [email, setEmail] = useState(emailFromUrl)
  const [step, setStep] = useState<"otp" | "password">("otp")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [focusedIdx, setFocusedIdx] = useState(0)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [sendingOtp, setSendingOtp] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

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
    if (emailFromUrl) handleSendOtp(emailFromUrl)
  }, [emailFromUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendOtp = useCallback(async (targetEmail: string) => {
    if (!targetEmail) return
    setSendingOtp(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, type: "forget-password" }),
      })
      if (!res.ok) throw new Error("Failed to send reset code")
      setResendCooldown(RESEND_COOLDOWN)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code")
    } finally {
      setSendingOtp(false)
    }
  }, [])

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
      inputRefs.current[Math.min(digits.length, 5)]?.focus()
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

  const handleVerifyOtp = async () => {
    const code = otp.join("")
    if (code.length !== 6) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code, type: "forget-password" }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (json.status === "expired") throw new Error("Code expired. Request a new one.")
        throw new Error(json.error || "Invalid code")
      }
      setStep("password")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Reset password via the emailOTP flow
      const { error } = await authClient.resetPassword({
        newPassword: password,
      })
      if (error) throw new Error(error.message || "Could not reset password")

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center text-center"
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}>
          <CheckCircle2 className="h-16 w-16 text-emerald" />
        </motion.div>
        <h2 className="mt-6 font-heading text-xl font-semibold text-foreground">Password reset!</h2>
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
        href="/forgot-password"
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      <div className="glass-card edge-light relative overflow-hidden rounded-[32px] p-8 sm:p-10 shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue/[0.03] via-transparent to-violet/[0.03]" />
        <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full blur-[100px]" style={{ background: "oklch(0.55 0.18 255 / 0.06)" }} />

        <div className="relative">
          <div className="flex items-center justify-center gap-2">
            <span className="font-heading text-lg font-semibold tracking-tight text-foreground">✦ Lumora</span>
          </div>

          {step === "otp" ? (
            <>
              <h1 className="mt-6 font-heading text-xl font-medium text-foreground text-center">Enter reset code</h1>
              <p className="mt-2 text-sm text-muted-foreground text-center">
                Enter the 6-digit code sent to <strong className="text-foreground">{email || "your email"}</strong>
              </p>

              <div className="mt-8 flex justify-center gap-2 sm:gap-3">
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

              <motion.button
                onClick={handleVerifyOtp}
                disabled={loading || otp.some((d) => !d)}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="premium-btn premium-btn-primary mt-6 w-full py-3 text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying…
                  </span>
                ) : (
                  "Verify code"
                )}
              </motion.button>

              <div className="mt-5 flex items-center justify-center gap-2 text-sm">
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || sendingOtp}
                  className="flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                >
                  {sendingOtp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : sendingOtp ? "Sending…" : "Resend code"}
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="mt-6 font-heading text-xl font-medium text-foreground text-center">Set new password</h1>
              <p className="mt-2 text-sm text-muted-foreground text-center">Create a new password for your Lumora account.</p>

              <form onSubmit={handleResetPassword} className="mt-8">
                <div className="flex flex-col gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">New password</span>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="premium-input pr-11"
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Confirm password</span>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="premium-input pr-11"
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowConfirm((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </label>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="mt-4 rounded-xl border border-neg/30 bg-neg/10 px-4 py-2.5 text-sm text-neg"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="premium-btn premium-btn-primary mt-6 w-full py-3 text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resetting…
                    </span>
                  ) : (
                    "Reset password"
                  )}
                </motion.button>
              </form>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-64 w-full max-w-md animate-pulse rounded-[32px] bg-white/20" />}>
      <ResetPasswordInner />
    </Suspense>
  )
}
