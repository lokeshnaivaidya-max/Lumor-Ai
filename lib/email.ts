import { sendEmail, getActiveProviderName } from "@/lib/email/index"
import { createCorrelationId } from "@/lib/email/adapter"

export function buildOtpEmail({ otp, type }: { otp: string; type: "verification" | "reset" }): { subject: string; html: string } {
  const isVerify = type === "verification"
  const subject = isVerify ? "Verify your Lumora AI account" : "Reset your Lumora AI password"

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${subject}</title></head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%">
<tr><td style="background:#fff;border-radius:28px;padding:40px 32px;box-shadow:0 8px 32px rgba(0,0,0,0.04)">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:24px"><span style="font-size:22px;font-weight:600;color:#1a1a1a">&#10022; Lumora</span></td></tr></table>
<h1 style="font-size:20px;font-weight:600;color:#1a1a1a;margin:0 0 8px;text-align:center">${isVerify ? "Verify your email address" : "Reset your password"}</h1>
<p style="font-size:14px;color:#6b6b6b;margin:0 0 24px;text-align:center">${isVerify ? "Enter this code to verify your Lumora AI account." : "Enter this code to reset your Lumora AI account password."} This code expires in <strong>5 minutes</strong>.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="background:linear-gradient(135deg,rgba(59,130,246,0.06),rgba(139,92,246,0.06));border-radius:20px;padding:28px 24px">
<span style="font-family:monospace;font-size:40px;font-weight:700;letter-spacing:12px;color:#1a1a1a">${otp}</span>
</td></tr></table>
<p style="font-size:13px;color:#6b6b6b;margin:20px 0 0;text-align:center">&#9200; Valid for 5 minutes &middot; Do not share this code.</p>
<div style="height:1px;background:rgba(0,0,0,0.06);margin:24px 0"></div>
<p style="font-size:12px;color:#a3a3a3;margin:0;text-align:center">Sent by Lumora AI &middot; <a href="mailto:support@lumora.ai" style="color:#6b6b6b">support@lumora.ai</a></p>
</td></tr></table></td></tr></table></body></html>`

  return { subject, html }
}

let lastLog: Record<string, unknown> | null = null

export async function sendOtpEmail({ email, otp, type }: { email: string; otp: string; type: "verification" | "reset" }) {
  const { subject, html } = buildOtpEmail({ otp, type })
  const correlationId = createCorrelationId()

  console.log("[EMAIL] sendOtpEmail", JSON.stringify({ correlationId, email, type, provider: getActiveProviderName() }))

  const result = await sendEmail({ to: email, subject, html })
  lastLog = result

  if (!result.success) {
    // Do NOT throw: an unconfigured/down email provider must not crash the auth
    // flow (sign-up OTP, password reset). The OTP is already emitted to logs
    // via the [OTP-TRACE] callback, so the flow remains usable in dev/demo
    // environments. We surface the failure as a non-throwing result and let the
    // caller proceed.
    console.warn(
      `[EMAIL] OTP email not delivered (provider ${getActiveProviderName()}): ${result.error}`,
    )
    return { success: false, messageId: result.messageId, correlationId, accepted: result.accepted }
  }

  return { success: true, messageId: result.messageId, correlationId, accepted: result.accepted }
}

export function getLastEmailLog(): Record<string, unknown> | null {
  return lastLog
}


