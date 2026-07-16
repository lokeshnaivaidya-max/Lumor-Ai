import nodemailer from "nodemailer"

function logEnvVars() {
  console.log(`[EMAIL] SMTP_HOST: ${!!process.env.SMTP_HOST}`)
  console.log(`[EMAIL] SMTP_PORT: ${!!process.env.SMTP_PORT}`)
  console.log(`[EMAIL] SMTP_USER: ${!!process.env.SMTP_USER}`)
  console.log(`[EMAIL] SMTP_PASS: ${!!process.env.SMTP_PASS}`)
  console.log(`[EMAIL] SMTP_FROM: ${!!process.env.SMTP_FROM}`)
}

export function buildOtpEmail({ otp, type }: { otp: string; type: "verification" | "reset" }): {
  subject: string
  html: string
} {
  const isVerify = type === "verification"
  const subject = isVerify ? "Verify your Lumora AI account" : "Reset your Lumora AI password"
  const actionLabel = isVerify ? "Verify Email" : "Reset Password"

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%">
          <!-- Glass card -->
          <tr>
            <td style="background:rgba(255,255,255,0.7);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:28px;border:1px solid rgba(0,0,0,0.06);padding:40px 32px;box-shadow:0 8px 32px rgba(0,0,0,0.04),0 2px 8px rgba(0,0,0,0.02)">
              <!-- Logo -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px">
                    <span style="font-family:'Sora',-apple-system,BlinkMacSystemFont,sans-serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;color:#1a1a1a">✦ Lumora</span>
                  </td>
                </tr>
              </table>

              <!-- Title -->
              <h1 style="font-family:'Sora',-apple-system,BlinkMacSystemFont,sans-serif;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#1a1a1a;margin:0 0 8px;text-align:center">
                ${isVerify ? "Verify your email address" : "Reset your password"}
              </h1>
              <p style="font-size:14px;line-height:1.6;color:#6b6b6b;margin:0 0 24px;text-align:center">
                ${isVerify ? "Enter this code to verify your Lumora AI account." : "Enter this code to reset your Lumora AI account password."} This code expires in <strong style="color:#1a1a1a">10 minutes</strong>.
              </p>

              <!-- OTP box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,rgba(59,130,246,0.06),rgba(139,92,246,0.06));border-radius:20px;padding:28px 24px;border:1px solid rgba(59,130,246,0.12)">
                    <span style="font-family:'SF Mono','Fira Code','Courier New',monospace;font-size:40px;font-weight:700;letter-spacing:12px;color:#1a1a1a;display:inline-block">${otp}</span>
                  </td>
                </tr>
              </table>

              <!-- Validity -->
              <p style="font-size:13px;line-height:1.5;color:#6b6b6b;margin:20px 0 0;text-align:center">
                ⏱ Valid for 10 minutes · Do not share this code with anyone.
              </p>

              <!-- Security warning -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px">
                <tr>
                  <td style="background:rgba(239,68,68,0.06);border-radius:14px;padding:16px;border:1px solid rgba(239,68,68,0.1)">
                    <p style="font-size:12px;line-height:1.5;color:#dc2626;margin:0;text-align:center">
                      ⚠ Never share this verification code. Lumora will never ask for your password or OTP.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="height:1px;background:rgba(0,0,0,0.06);margin:24px 0"></div>

              <!-- Footer -->
              <p style="font-size:12px;line-height:1.5;color:#a3a3a3;margin:0;text-align:center">
                Sent by Lumora AI · <a href="mailto:support@lumora.ai" style="color:#6b6b6b;text-decoration:underline">support@lumora.ai</a>
              </p>
              <p style="font-size:11px;line-height:1.5;color:#c0c0c0;margin:8px 0 0;text-align:center">
                If you did not request this, please ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html }
}

function createTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM

  console.log(`[EMAIL] createTransporter: checking env vars`)
  logEnvVars()

  const missing: string[] = []
  if (!host) missing.push("SMTP_HOST")
  if (!port) missing.push("SMTP_PORT")
  if (!user) missing.push("SMTP_USER")
  if (!pass) missing.push("SMTP_PASS")
  if (!from) missing.push("SMTP_FROM")
  if (missing.length > 0) {
    const msg = `SMTP not configured. Missing: ${missing.join(", ")}.`
    console.error(`[EMAIL] ${msg}`)
    throw new Error(msg)
  }

  console.log(`[EMAIL] Creating SMTP transporter: host=${host} port=${port} secure=false auth=PLAIN`)
  const transporter = nodemailer.createTransport({
    host: host!,
    port,
    secure: false,
    auth: { user: user!, pass: pass! },
  })

  console.log(`[EMAIL] SMTP transporter created`)
  return { transporter, from: from! }
}

export async function sendOtpEmail({
  email,
  otp,
  type,
}: {
  email: string
  otp: string
  type: "verification" | "reset"
}) {
  const normalizedEmail = email.trim().toLowerCase()
  const { subject, html } = buildOtpEmail({ otp, type })

  console.log(`[EMAIL] sendOtpEmail called`)
  console.log(`[EMAIL] To: ${normalizedEmail}`)
  console.log(`[EMAIL] Subject: ${subject}`)
  console.log(`[EMAIL] OTP: ${otp}`)

  const { transporter, from } = createTransporter()

  console.log(`[EMAIL] transporter.verify() started`)
  let verifyResult: any
  try {
    verifyResult = await transporter.verify()
    console.log(`[EMAIL] transporter.verify() result: ${JSON.stringify(verifyResult)}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : ""
    console.error(`[EMAIL] transporter.verify() FAILED: ${msg}`)
    if (stack) console.error(`[EMAIL] transporter.verify() stack: ${stack}`)
    throw err
  }

  console.log(`[EMAIL] Sending email via SMTP...`)
  console.log(`[EMAIL] SMTP envelope: from="${from}" to="${normalizedEmail}"`)

  let info: nodemailer.SentMessageInfo
  try {
    info = await transporter.sendMail({
      from,
      to: normalizedEmail,
      subject: "Your Lumora Verification Code",
      html,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : ""
    console.error(`[EMAIL] sendMail() threw: ${msg}`)
    if (stack) console.error(`[EMAIL] sendMail() stack: ${stack}`)
    throw err
  }

  console.log(`[EMAIL] sendMail() completed`)
  console.log(`[EMAIL] messageId: ${info.messageId}`)
  console.log(`[EMAIL] accepted: ${JSON.stringify(info.accepted)}`)
  console.log(`[EMAIL] rejected: ${JSON.stringify(info.rejected)}`)
  console.log(`[EMAIL] response: ${info.response}`)

  if (info.rejected.length > 0) {
    console.error(`[EMAIL] SMTP rejected recipients: ${info.rejected.join(", ")}`)
    throw new Error(`SMTP rejected delivery to: ${info.rejected.join(", ")}`)
  }

  console.log(`[EMAIL] Email sent successfully`)
  return { success: true, messageId: info.messageId, accepted: info.accepted }
}
