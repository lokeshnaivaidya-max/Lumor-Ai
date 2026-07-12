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

export async function sendOtpEmail({
  email,
  otp,
  type,
}: {
  email: string
  otp: string
  type: "verification" | "reset"
}) {
  const { subject, html } = buildOtpEmail({ otp, type })

  if (process.env.NODE_ENV === "development") {
    console.log(`[EMAIL] To: ${email}`)
    console.log(`[EMAIL] Subject: ${subject}`)
    console.log(`[EMAIL] OTP: ${otp}`)
    return { success: true }
  }

  // Production: integrate with Resend / SendGrid / SES etc.
  // import { Resend } from "resend"
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({ from: "Lumora <verify@lumora.ai>", to: email, subject, html })

  console.log(`[EMAIL] Production send disabled — would send to ${email}`)
  return { success: true }
}
