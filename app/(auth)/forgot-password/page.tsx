"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { Loader2, ArrowLeft, CheckCircle2, Mail, ArrowRight, AlertCircle, Info, RefreshCw, Eye, EyeOff, Lock, KeyRound, ShieldCheck } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { LumoraMark } from "@/components/lumora-mark"

const RESEND_COOLDOWN = 60

type Step = "email" | "check_email" | "otp" | "new_password" | "success"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [focusedIdx, setFocusedIdx] = useState(0)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const sendingRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Timer effect for resend cooldown
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

  const showToastMsg = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // Send or resend OTP
  const sendResetCode = useCallback(async (targetEmail: string) => {
    if (!targetEmail || sendingRef.current) return
    sendingRef.current = true
    setSendingOtp(true)
    setError(null)
    try {
      const { error } = await authClient.emailOtp.requestPasswordReset({ email: targetEmail })
      if (error) throw new Error(error.message || "Failed to send reset code")
      if (mountedRef.current) {
        setResendCooldown(RESEND_COOLDOWN)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to send reset code")
      }
    } finally {
      if (mountedRef.current) setSendingOtp(false)
      sendingRef.current = false
    }
  }, [])

  // Handle Step 1: Submit email
  async function handleSubmitEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { error } = await authClient.emailOtp.requestPasswordReset({ email })
      if (error) throw new Error(error.message || "Could not send reset code")
      setResendCooldown(RESEND_COOLDOWN)
      setStep("check_email")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  // Handle Resend in OTP step
  const handleResendOtp = () => {
    if (resendCooldown > 0 || sendingOtp || sendingRef.current) return
    sendResetCode(email)
    showToastMsg("New verification code sent to your email.")
  }

  const [isShaking, setIsShaking] = useState(false)

  // Handle OTP digit inputs
  const handleOtpChange = (index: number, value: string) => {
    if (loading) return
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("")
      const newOtp = ["", "", "", "", "", ""]
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d
      })
      setOtp(newOtp)
      setError(null)
      const nextIdx = Math.min(digits.length, 5)
      inputRefs.current[nextIdx]?.focus()
      setFocusedIdx(nextIdx)
      return
    }

    const cleanVal = value.replace(/\D/g, "")
    const newOtp = [...otp]
    newOtp[index] = cleanVal
    setOtp(newOtp)
    setError(null)

    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus()
      setFocusedIdx(index + 1)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    if (loading) return
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pastedData) return
    const digits = pastedData.split("")
    const newOtp = ["", "", "", "", "", ""]
    digits.forEach((d, i) => {
      if (i < 6) newOtp[i] = d
    })
    setOtp(newOtp)
    setError(null)
    const nextIdx = Math.min(digits.length, 5)
    inputRefs.current[nextIdx]?.focus()
    setFocusedIdx(nextIdx)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (loading) return
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
      setFocusedIdx(index - 1)
    }
  }

  // Handle Verify Code button on OTP step
  const handleVerifyOtp = async () => {
    const code = otp.join("")
    if (code.length !== 6) {
      setError("Please enter all 6 digits of the verification code")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { error } = await authClient.emailOtp.checkVerificationOtp({
        email,
        type: "forget-password",
        otp: code,
      })
      if (error) {
        throw new Error(error.message || "Invalid verification code")
      }
      setError(null)
      setStep("new_password")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid verification code")
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
    } finally {
      setLoading(false)
    }
  }

  const triggerOtpFailure = (errMsg: string) => {
    setError(errMsg)
    setIsShaking(true)
    setTimeout(() => {
      setIsShaking(false)
    }, 500)
  }

  // Handle Final Password Reset submit
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join("")
    if (code.length !== 6) {
      setError("Verification code must be 6 digits")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { error } = await authClient.emailOtp.resetPassword({
        email,
        otp: code,
        password,
      })
      if (error) {
        let msg = error.message || "Failed to reset password"
        if (error.message?.toLowerCase().includes("expired")) {
          msg = "Code expired. Please request a new verification code."
        }
        setError(msg)
        return
      }
      setStep("success")
      setTimeout(() => {
        router.push("/sign-in?reset=success")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed")
    } finally {
      setLoading(false)
    }
  }

  const allOtpFilled = otp.every((d) => d !== "")

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      {/* Top Back Navigation */}
      {step === "email" ? (
        <Link href="/sign-in" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
      ) : step === "check_email" ? (
        <button onClick={() => setStep("email")} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to email
        </button>
      ) : step === "otp" ? (
        <button onClick={() => setStep("check_email")} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to email check
        </button>
      ) : step === "new_password" ? (
        <button onClick={() => setStep("otp")} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to OTP code
        </button>
      ) : null}

      <div className="glass rounded-[28px] p-8 sm:p-10 overflow-hidden">
        {/* Header Logo */}
        <div className="mb-6 flex items-center justify-start">
          <LumoraMark showText className="h-8 w-8" />
        </div>

        {/* STEP 1: Enter Email */}
        {step === "email" && (
          <div>
            <h1 className="heading">Forgot password?</h1>
            <p className="body mt-1.5">Enter your email and we&apos;ll send a reset code.</p>

            <form onSubmit={handleSubmitEmail} className="mt-6 space-y-4">
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

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }}
                    className="flex items-start gap-2 rounded-xl border border-red/20 bg-red/[0.06] px-3.5 py-2.5 text-xs text-red">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading || !email}
                className="btn btn--gold w-full justify-center mt-5"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {loading ? "Sending…" : "Send reset code"}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Check Email Screen */}
        {step === "check_email" && (
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/10 border border-emerald/20">
              <CheckCircle2 className="h-7 w-7 text-emerald" />
            </div>
            <h2 className="heading mt-4">Check your email</h2>
            <p className="body mt-2">
              We sent a 6-digit reset code to <strong className="text-foreground">{email}</strong>
            </p>

            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-[var(--glass-border)] px-4 py-3 text-xs leading-relaxed text-left" style={{ background: "var(--glass-bg)" }}>
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
              <div>
                <p style={{ color: "var(--text-secondary)" }}>
                  Didn&apos;t receive the code? Please check your <strong>Spam</strong> or <strong>Junk</strong> folder.
                </p>
                <p className="mt-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  The code expires in 5 minutes.
                </p>
              </div>
            </div>

            <button
              onClick={() => setStep("otp")}
              className="btn btn--gold mt-6 w-full justify-center"
            >
              Enter Verification Code
            </button>

            <p className="mt-4 text-xs" style={{ color: "var(--text-tertiary)" }}>
              Didn&apos;t receive it?{" "}
              <button onClick={() => setStep("email")} className="font-medium underline underline-offset-2 hover:opacity-80 transition-opacity" style={{ color: "var(--gold)" }}>
                Try again
              </button>
            </p>
          </div>
        )}

        {/* STEP 3: Enter 6-Digit OTP */}
        {step === "otp" && (
          <div>
            <h1 className="heading">Enter Verification Code</h1>
            <p className="body mt-1.5">
              Code sent to <strong className="text-foreground">{email}</strong>
            </p>

            {/* 6-Digit OTP Inputs */}
            <motion.div
              animate={isShaking ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              className="mt-6 flex justify-center gap-2"
            >
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={loading}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onFocus={() => setFocusedIdx(i)}
                  className={`h-12 w-10 sm:h-14 sm:w-11 rounded-xl border text-center font-mono text-xl font-semibold transition-all duration-150 outline-none ${
                    focusedIdx === i && !loading
                      ? "border-[var(--gold)] bg-[var(--gold-glow)] shadow-[0_0_0_3px_var(--gold-glow)]"
                      : digit
                        ? "border-[var(--glass-border-hover)]"
                        : "border-[var(--glass-border)]"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{ color: "var(--text-primary)", background: "transparent" }}
                  autoComplete="one-time-code"
                  autoFocus={i === 0}
                />
              ))}
            </motion.div>

            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[var(--glass-border)] px-3.5 py-2.5 text-xs leading-relaxed" style={{ background: "var(--glass-bg)", color: "var(--text-tertiary)" }}>
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--gold)" }} />
              <span>
                Enter the 6-digit code sent to your email to verify your identity.
              </span>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }}
                  className="mt-3 flex items-start gap-2 rounded-xl border border-red/20 bg-red/[0.06] px-3.5 py-2.5 text-xs text-red">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Verify Button */}
            <button
              onClick={handleVerifyOtp}
              disabled={!allOtpFilled}
              className="btn btn--gold mt-5 w-full justify-center"
            >
              Verify Code
            </button>

            {/* Resend Code Button & Countdown Timer (60s) */}
            <div className="mt-4 flex items-center justify-center">
              {resendCooldown > 0 ? (
                <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Resend in {resendCooldown}s
                </span>
              ) : (
                <button
                  onClick={handleResendOtp}
                  disabled={sendingOtp}
                  className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80 disabled:opacity-40"
                  style={{ color: "var(--gold)" }}
                >
                  {sendingOtp ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  {sendingOtp ? "Sending…" : "Resend Code"}
                </button>
              )}
            </div>

            {/* Back Button */}
            <div className="mt-4 text-center">
              <button
                onClick={() => setStep("check_email")}
                className="text-xs transition-colors hover:opacity-80"
                style={{ color: "var(--text-tertiary)" }}
              >
                Back to email check
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Enter New Password */}
        {step === "new_password" && (
          <form onSubmit={handleResetPassword}>
            <h1 className="heading">Enter New Password</h1>
            <p className="body mt-1.5">
              Set a strong password for <strong className="text-foreground">{email}</strong>
            </p>

            <div className="mt-5 space-y-4">
              <div className="field">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=" "
                  className="field__input pr-10"
                  autoComplete="new-password"
                />
                <label className="field__label">New Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="field">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder=" "
                  className="field__input pr-10"
                  autoComplete="new-password"
                />
                <label className="field__label">Confirm Password</label>
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <p className="mt-2 text-xs text-red">Passwords do not match</p>
            )}

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }}
                  className="mt-3 flex items-start gap-2 rounded-xl border border-red/20 bg-red/[0.06] px-3.5 py-2.5 text-xs text-red">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
              className="btn btn--gold mt-6 w-full justify-center"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        )}

        {/* STEP 5: Password Reset Success */}
        {step === "success" && (
          <div className="text-center py-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald/10 border border-emerald/20">
                <CheckCircle2 className="h-8 w-8 text-emerald" />
              </div>
            </motion.div>
            <h2 className="heading mt-5">Password Reset Success!</h2>
            <p className="body mt-1.5">Your password has been updated successfully. Redirecting to sign in…</p>
            <button
              onClick={() => router.push("/sign-in")}
              className="btn btn--gold mt-6 w-full justify-center"
            >
              Sign In Now
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-2 rounded-2xl border border-emerald/20 bg-emerald/10 px-5 py-3 text-xs text-emerald backdrop-blur-2xl">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
