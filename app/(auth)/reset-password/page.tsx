"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle, Eye, EyeOff, RefreshCw, KeyRound, Lock, Mail, Info } from "lucide-react"
import { authClient } from "@/lib/auth-client"

const RESEND_COOLDOWN = 60

function ResetPasswordInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailFromUrl = searchParams.get("email") || ""

  const [email, setEmail] = useState(emailFromUrl)
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
  const [needsEmail, setNeedsEmail] = useState(!emailFromUrl)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const sendingRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

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

  const handleSendOtp = useCallback(async (targetEmail: string) => {
    if (!targetEmail || sendingRef.current) return
    sendingRef.current = true
    setSendingOtp(true)
    setError(null)
    try {
      console.log("[OTP-TRACE] >>> reset-page sendVerificationOtp BEFORE", { targetEmail, type: "forget-password", stack: new Error().stack })
      const { error } = await authClient.emailOtp.sendVerificationOtp({ email: targetEmail, type: "forget-password" })
      console.log("[OTP-TRACE] <<< reset-page sendVerificationOtp AFTER", { targetEmail, error })
      if (error) throw new Error(error.message || "Failed to send reset code")
      if (mountedRef.current) setResendCooldown(RESEND_COOLDOWN)
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : "Failed to send code")
    } finally {
      if (mountedRef.current) setSendingOtp(false)
      sendingRef.current = false
    }
  }, [])

  const handleResend = () => {
    if (resendCooldown > 0 || sendingOtp || sendingRef.current) return
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

  const handleSubmit = async () => {
    const code = otp.join("")
    if (code.length !== 6) return
    if (password !== confirmPassword) { setError("Passwords do not match"); return }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return }
    setLoading(true)
    setError(null)
    try {
      const { error } = await authClient.emailOtp.resetPassword({ email, otp: code, password })
      if (error) {
        if (error.message?.toLowerCase().includes("expired")) throw new Error("Code expired. Request a new one.")
        throw new Error(error.message || "Invalid code")
      }
      if (mountedRef.current) {
        setSuccess(true)
        setTimeout(() => { mountedRef.current && (router.push("/"), router.refresh()) }, 1500)
      }
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : "Verification failed")
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}>
          <CheckCircle2 className="h-14 w-14 text-emerald" />
        </motion.div>
        <h2 className="dm-heading dm-heading--small mt-5">Password reset!</h2>
        <p className="dm-body mt-1.5">Redirecting to your home…</p>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      <Link href="/forgot-password" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>
      <div className="dm-card dm-card--inset overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full blur-[120px] bg-primary/[0.04]" />
        <div className="relative">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="font-heading text-base font-semibold tracking-tight text-foreground">Lumora</span>
          </div>

          {needsEmail ? (
            <>
              <h1 className="dm-heading dm-heading--small text-center">Reset your password</h1>
              <p className="dm-body mt-1.5 text-center">Enter your email to receive a reset code.</p>
              <div className="mt-6">
                <label className="flex flex-col gap-1">
                  <span className="dm-meta flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="glass-input" />
                </label>
              </div>
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }}
                    className="mt-4 flex items-start gap-2 rounded-xl border border-red/20 bg-red/[0.06] px-3.5 py-2.5 text-xs text-red">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button
                onClick={() => { if (!email) { setError("Please enter your email"); return }; setNeedsEmail(false); handleSendOtp(email) }}
                disabled={sendingOtp || !email}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="mt-5 w-full rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-2">
                  {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  {sendingOtp ? "Sending…" : "Send reset code"}
                </span>
              </motion.button>
            </>
          ) : (
            <>
              <h1 className="dm-heading dm-heading--small text-center">Reset your password</h1>
              <p className="dm-body mt-1.5 text-center">
                Code sent to <strong className="text-foreground">{email}</strong>
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

              <div className="mt-5 flex flex-col gap-3">
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required minLength={8} value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="glass-input pr-10"
                    autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} required minLength={8} value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="glass-input pr-10"
                    autoComplete="new-password" />
                  <button type="button" onClick={() => setShowConfirm((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors p-1"
                    aria-label={showConfirm ? "Hide password" : "Show password"}>
                    {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {password && confirmPassword && password !== confirmPassword && (
                <p className="mt-2 text-xs text-red/80">Passwords do not match</p>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }}
                    className="mt-4 flex items-start gap-2 rounded-xl border border-red/20 bg-red/[0.06] px-3.5 py-2.5 text-xs text-red">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                onClick={handleSubmit}
                disabled={loading || otp.some((d) => !d) || !password || !confirmPassword || password !== confirmPassword}
                whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                className="mt-5 w-full rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {loading ? "Resetting…" : "Reset password"}
                </span>
              </motion.button>

              <AnimatePresence mode="wait">
                {resendCooldown > 0 ? (
                  <motion.div
                    key="cooldown"
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-4 flex items-center justify-center"
                  >
                    <button disabled className="flex items-center gap-1.5 text-xs text-muted-foreground/40">
                      <RefreshCw className="h-3 w-3" />
                      Resend in {resendCooldown}s
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-4 flex items-center justify-center"
                  >
                    <button onClick={handleResend} disabled={sendingOtp}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-foreground transition-colors disabled:opacity-40"
                    >
                      {sendingOtp ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      {sendingOtp ? "Sending…" : "Resend code"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Wrong email?{" "}
                <button onClick={() => setNeedsEmail(true)} className="font-medium text-foreground hover:text-foreground/80 transition-colors underline underline-offset-2">
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="dm-card dm-card--inset h-64 w-full max-w-sm animate-pulse" />}>
      <ResetPasswordInner />
    </Suspense>
  )
}
