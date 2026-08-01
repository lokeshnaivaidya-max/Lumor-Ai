import { sendEmail, getActiveProviderName, getEmailHistory } from "@/lib/email/index"
import { createCorrelationId } from "@/lib/email/adapter"

export { getEmailHistory, getActiveProviderName }

function getAppBaseUrl(): string {
  const url =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ||
    (process.env.VERCEL_URL ? (process.env.VERCEL_URL.startsWith("http") ? process.env.VERCEL_URL : `https://${process.env.VERCEL_URL}`) : undefined) ||
    process.env.V0_RUNTIME_URL ||
    "http://localhost:3000"
  return url.replace(/\/$/, "")
}

function getAppLogoUrl(): string {
  const publicCdnUrl = "https://raw.githubusercontent.com/lokeshnaivaidya-max/Lumora-Ai/main/public/lumora-logo.png"
  const baseUrl = getAppBaseUrl()
  if (
    baseUrl &&
    baseUrl.startsWith("https://") &&
    !baseUrl.includes("localhost") &&
    !baseUrl.includes("127.0.0.1") &&
    !baseUrl.includes("run.app") &&
    !baseUrl.includes("vercel.app")
  ) {
    return `${baseUrl}/lumora-logo.png`
  }
  return publicCdnUrl
}

function getDynamicGreeting(name?: string): string {
  let hour = new Date().getHours()
  try {
    const kolkataTimeStr = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    }).format(new Date())
    const parsed = parseInt(kolkataTimeStr, 10)
    if (!isNaN(parsed)) hour = parsed
  } catch {
    /* fallback to server hour */
  }

  let greeting = "Good evening"
  if (hour >= 5 && hour < 12) {
    greeting = "Good morning"
  } else if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon"
  } else if (hour >= 17 && hour < 22) {
    greeting = "Good evening"
  } else {
    greeting = "Good evening"
  }

  const firstName = name ? name.trim().split(" ")[0] : ""
  return firstName ? `${greeting}, ${firstName} 👋` : `${greeting} 👋`
}

function renderOtpBoxes(otp: string): string {
  const digits = otp.replace(/\D/g, "").slice(0, 6).padEnd(6, " ").split("")
  const cells = digits
    .map(
      (d) => `
    <td align="center" valign="middle" width="48" height="58" style="width:48px;height:58px;background-color:#FFFFFF;border:2px solid #2563EB;border-radius:10px;font-family:'SF Mono',Consolas,'Liberation Mono',Menlo,monospace;font-size:26px;font-weight:700;color:#111827;text-align:center;line-height:58px;box-shadow:0 2px 8px rgba(37,99,235,0.12);">
      ${d.trim() || "&nbsp;"}
    </td>
  `,
    )
    .join('<td width="8" style="width:8px;"></td>')

  return `
    <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto;">
      <tr>
        ${cells}
      </tr>
    </table>
  `
}

function renderSessionInfo(device?: string, location?: string, requestedAt?: string): string {
  if (!device && !location && !requestedAt) return ""
  const timeStr =
    requestedAt ||
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;border:1px solid #E5E7EB;border-radius:12px;margin:20px 0;padding:16px;">
      <tr>
        <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#6B7280;line-height:1.8;">
          ${device ? `<div>🖥 &nbsp;<strong style="color:#111827;">Device:</strong> ${device}</div>` : ""}
          ${location ? `<div>📍 &nbsp;<strong style="color:#111827;">Location:</strong> ${location}</div>` : ""}
          <div>🕒 &nbsp;<strong style="color:#111827;">Requested:</strong> ${timeStr} (IST)</div>
        </td>
      </tr>
    </table>
  `
}

function renderSecurityNotice(): string {
  return `
    <div style="background-color:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:16px;margin:24px 0;text-align:left;">
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;color:#1E40AF;margin:0 0 8px 0;">🔒 Security Notice</p>
      <ul style="margin:0;padding-left:18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#374151;line-height:1.6;">
        <li style="margin-bottom:4px;">Never share this code with anyone.</li>
        <li style="margin-bottom:4px;">Lumora will never ask for your verification code.</li>
        <li>If this request was not made by you, please secure your account immediately.</li>
      </ul>
    </div>
  `
}

function renderSupportSection(): string {
  return `
    <div style="border-top:1px solid #E5E7EB;padding-top:20px;margin-top:28px;text-align:center;">
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#6B7280;margin:0 0 6px 0;">Need help with your account?</p>
      <a href="mailto:lumora.verify@gmail.com" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#2563EB;text-decoration:none;font-weight:600;">lumora.verify@gmail.com</a>
    </div>
  `
}

function renderFooter(): string {
  return `
    <div style="margin-top:24px;text-align:center;">
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;color:#111827;margin:0 0 4px 0;">&copy; 2026 Lumora AI</p>
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:#6B7280;margin:0;">AI-Powered Global Stock Intelligence</p>
    </div>
  `
}

function renderMasterEmailFrame({
  subject,
  greeting,
  contentHtml,
  logoUrl,
}: {
  subject: string
  greeting: string
  contentHtml: string
  logoUrl: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;background-color:#F8FAFC;border:1px solid #E5E7EB;border-radius:20px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.04);">
          <tr>
            <td style="padding:40px 32px;">
              
              <!-- Header with Logo & Badge -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <img src="${logoUrl}" alt="Lumora AI Logo" width="180" style="display:block;margin:0 auto;width:180px;max-width:100%;height:auto;border:0;outline:none;" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <span style="display:inline-block;padding:5px 14px;background-color:#EFF6FF;border:1px solid #BFDBFE;border-radius:20px;color:#2563EB;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">
                      AI-Powered Global Stock Intelligence
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Dynamic Greeting -->
              <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 16px;text-align:left;">
                ${greeting}
              </h2>

              <!-- Body Content -->
              ${contentHtml}

              <!-- Support Section -->
              ${renderSupportSection()}

              <!-- Footer -->
              ${renderFooter()}

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function buildSignupVerificationEmail({
  email,
  name,
  otp,
  device,
  location,
}: {
  email?: string
  name?: string
  otp: string
  device?: string
  location?: string
}) {
  const subject = "Verify your Lumora AI account"
  const baseUrl = getAppBaseUrl()
  const logoUrl = getAppLogoUrl()
  const ctaUrl = `${baseUrl}/verify-email${email ? `?email=${encodeURIComponent(email)}` : ""}`
  const greeting = getDynamicGreeting(name)

  const contentHtml = `
    <p style="font-size:14px;color:#4B5563;line-height:1.6;margin:0 0 16px;">
      Welcome to Lumora AI! Please verify your email address to complete your registration and activate your account.
    </p>

    <p style="font-size:14px;color:#111827;line-height:1.6;margin:0 0 12px;font-weight:600;">
      Your 6-digit verification code:
    </p>

    ${renderOtpBoxes(otp)}

    <div style="text-align:center;margin:24px 0;">
      <a href="${ctaUrl}" style="background-color:#2563EB;color:#FFFFFF;display:inline-block;padding:14px 36px;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;box-shadow:0 4px 12px rgba(37,99,235,0.25);">
        Verify Email Address
      </a>
    </div>

    <p style="font-size:13px;color:#6B7280;margin:16px 0;text-align:center;">
      ⏳ This verification code expires in <strong>5 minutes</strong>.
    </p>

    ${renderSessionInfo(device, location)}
    ${renderSecurityNotice()}
  `

  const text = `
Lumora AI - AI-Powered Global Stock Intelligence

${greeting}

Welcome to Lumora AI! Please verify your email address to complete your registration and activate your account.

Your Verification Code: ${otp}

Direct verification link: ${ctaUrl}

Expires in 5 minutes.

${device ? `Device: ${device}\n` : ""}${location ? `Location: ${location}\n` : ""}
Need help? lumora.verify@gmail.com
© 2026 Lumora AI
`.trim()

  return { subject, html: renderMasterEmailFrame({ subject, greeting, contentHtml, logoUrl }), text }
}

export function buildForgotPasswordEmail({
  email,
  name,
  otp,
  device,
  location,
}: {
  email?: string
  name?: string
  otp: string
  device?: string
  location?: string
}) {
  const subject = "Reset your Lumora AI password"
  const baseUrl = getAppBaseUrl()
  const logoUrl = getAppLogoUrl()
  const ctaUrl = `${baseUrl}/reset-password${email ? `?email=${encodeURIComponent(email)}` : ""}`
  const greeting = getDynamicGreeting(name)

  const contentHtml = `
    <p style="font-size:14px;color:#4B5563;line-height:1.6;margin:0 0 16px;">
      We received a request to reset your Lumora AI account password.
    </p>

    <p style="font-size:14px;color:#4B5563;line-height:1.6;margin:0 0 20px;">
      If this was you, use the verification code below or click the button to proceed. If you didn't request this, you can safely ignore this message.
    </p>

    ${renderOtpBoxes(otp)}

    <div style="text-align:center;margin:24px 0;">
      <a href="${ctaUrl}" style="background-color:#2563EB;color:#FFFFFF;display:inline-block;padding:14px 36px;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;box-shadow:0 4px 12px rgba(37,99,235,0.25);">
        Reset Password
      </a>
    </div>

    <p style="font-size:13px;color:#6B7280;margin:16px 0;text-align:center;">
      ⏳ This verification code expires in <strong>5 minutes</strong>.
    </p>

    ${renderSessionInfo(device, location)}
    ${renderSecurityNotice()}
  `

  const text = `
Lumora AI - AI-Powered Global Stock Intelligence

${greeting}

We received a request to reset your Lumora AI password.

Your Reset Code: ${otp}

Direct reset link: ${ctaUrl}

Expires in 5 minutes.

${device ? `Device: ${device}\n` : ""}${location ? `Location: ${location}\n` : ""}
Need help? lumora.verify@gmail.com
© 2026 Lumora AI
`.trim()

  return { subject, html: renderMasterEmailFrame({ subject, greeting, contentHtml, logoUrl }), text }
}

export function buildOtpEmail({
  email,
  name,
  otp,
  type,
  device,
  location,
}: {
  email?: string
  name?: string
  otp: string
  type: "verification" | "reset"
  device?: string
  location?: string
}): { subject: string; html: string; text: string } {
  if (type === "verification") {
    return buildSignupVerificationEmail({ email, name, otp, device, location })
  } else {
    return buildForgotPasswordEmail({ email, name, otp, device, location })
  }
}

export function buildWelcomeEmail({ email, name }: { email: string; name?: string }) {
  const subject = "Welcome to Lumora AI"
  const baseUrl = getAppBaseUrl()
  const logoUrl = getAppLogoUrl()
  const greeting = getDynamicGreeting(name)

  const contentHtml = `
    <p style="font-size:14px;color:#4B5563;line-height:1.6;margin:0 0 20px;">
      Thank you for joining Lumora AI, your institutional-grade AI investment copilot. We're excited to help you analyze markets, optimize portfolios, and discover intelligent trading opportunities.
    </p>

    <div style="background-color:#FFFFFF;border:1px solid #E5E7EB;border-radius:16px;padding:20px;margin:24px 0;box-shadow:0 2px 6px rgba(0,0,0,0.02);">
      <h3 style="font-size:15px;color:#111827;margin:0 0 12px;font-weight:600;">What you can do with Lumora:</h3>
      <ul style="margin:0;padding-left:18px;font-size:13px;color:#4B5563;line-height:1.8;">
        <li>⚡ <strong>Real-Time AI Trade Intelligence:</strong> Automated technical & fundamental scoring</li>
        <li>📊 <strong>Portfolio Optimization:</strong> Multi-asset risk modeling and rebalancing insights</li>
        <li>🔔 <strong>Smart Alerts:</strong> Immediate notifications on price breakouts & trend shifts</li>
      </ul>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a href="${baseUrl}" style="background-color:#2563EB;color:#FFFFFF;display:inline-block;padding:14px 36px;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;box-shadow:0 4px 12px rgba(37,99,235,0.25);">
        Explore Lumora AI
      </a>
    </div>
  `

  const text = `
Lumora AI - AI-Powered Global Stock Intelligence

${greeting}

Thank you for joining Lumora AI, your institutional-grade AI investment copilot.

What you can do with Lumora:
- Real-Time AI Trade Intelligence
- Portfolio Optimization
- Smart Alerts

Explore Lumora AI: ${baseUrl}

Need help? lumora.verify@gmail.com
© 2026 Lumora AI
`.trim()

  return { subject, html: renderMasterEmailFrame({ subject, greeting, contentHtml, logoUrl }), text }
}

export function buildPortfolioAlertEmail({
  email,
  name,
  symbol,
  title,
  message,
  alertType,
}: {
  email: string
  name?: string
  symbol: string
  title: string
  message: string
  alertType?: string
}) {
  const subject = `Lumora AI Market Alert: ${symbol} - ${title}`
  const baseUrl = getAppBaseUrl()
  const logoUrl = getAppLogoUrl()
  const greeting = getDynamicGreeting(name)

  const contentHtml = `
    <div style="background-color:#FFFFFF;border:1px solid #E5E7EB;border-radius:16px;padding:20px;margin:20px 0;box-shadow:0 2px 6px rgba(0,0,0,0.02);">
      <div style="margin-bottom:12px;">
        <span style="display:inline-block;padding:4px 10px;background-color:#2563EB;color:#FFFFFF;font-size:12px;font-weight:700;border-radius:6px;margin-right:8px;">${symbol}</span>
        <span style="font-size:12px;color:#6B7280;text-transform:uppercase;">${alertType || "Portfolio Alert"}</span>
      </div>
      <h3 style="font-size:16px;color:#111827;margin:8px 0;font-weight:700;">${title}</h3>
      <p style="font-size:14px;color:#4B5563;line-height:1.6;margin:8px 0 0;">${message}</p>
    </div>

    <div style="text-align:center;margin:24px 0;">
      <a href="${baseUrl}/dashboard" style="background-color:#2563EB;color:#FFFFFF;display:inline-block;padding:12px 32px;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;">
        View Position
      </a>
    </div>
  `

  const text = `
Lumora AI - AI-Powered Global Stock Intelligence

${greeting}

Symbol: ${symbol}
Alert: ${title}
${message}

View Position: ${baseUrl}/dashboard

Need help? lumora.verify@gmail.com
© 2026 Lumora AI
`.trim()

  return { subject, html: renderMasterEmailFrame({ subject, greeting, contentHtml, logoUrl }), text }
}

export function buildPortfolioPerformanceEmail({
  email,
  name,
  portfolioName,
  returnPct,
  totalValue,
  topGainers,
}: {
  email: string
  name?: string
  portfolioName?: string
  returnPct: number
  totalValue?: string
  topGainers?: string[]
}) {
  const isPositive = returnPct >= 0
  const returnColor = isPositive ? "#10B981" : "#EF4444"
  const sign = isPositive ? "+" : ""
  const subject = `Lumora AI Portfolio Performance: ${sign}${returnPct.toFixed(2)}%`
  const baseUrl = getAppBaseUrl()
  const logoUrl = getAppLogoUrl()
  const greeting = getDynamicGreeting(name)

  const contentHtml = `
    <p style="font-size:14px;color:#A1A1AA;line-height:1.6;margin:0 0 20px;">
      Here is your latest performance report for <strong>${portfolioName || "Main Portfolio"}</strong>.
    </p>

    <div style="background-color:#1E293B;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;margin:20px 0;text-align:center;">
      <p style="font-size:12px;color:#A1A1AA;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">Period Return</p>
      <div style="font-size:36px;font-weight:800;color:${returnColor};">${sign}${returnPct.toFixed(2)}%</div>
      ${totalValue ? `<p style="font-size:14px;color:#FFFFFF;margin:8px 0 0;font-weight:600;">Total Portfolio Value: ${totalValue}</p>` : ""}
    </div>

    ${
      topGainers && topGainers.length > 0
        ? `
      <div style="background-color:rgba(255,255,255,0.03);border-radius:12px;padding:16px;margin:20px 0;">
        <p style="font-size:12px;font-weight:700;color:#FFFFFF;margin:0 0 8px;text-transform:uppercase;">Top Movers:</p>
        <p style="font-size:13px;color:#A1A1AA;margin:0;line-height:1.6;">${topGainers.join(" &bull; ")}</p>
      </div>
    `
        : ""
    }

    <div style="text-align:center;margin:24px 0;">
      <a href="${baseUrl}/portfolio" style="background-color:#3B82F6;color:#FFFFFF;display:inline-block;padding:12px 32px;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;">
        Open Portfolio Analytics
      </a>
    </div>
  `

  const text = `
Lumora AI - AI-Powered Global Stock Intelligence

${greeting}

Portfolio Performance Report: ${portfolioName || "Main Portfolio"}
Period Return: ${sign}${returnPct.toFixed(2)}%
${totalValue ? `Total Value: ${totalValue}\n` : ""}${topGainers && topGainers.length > 0 ? `Top Movers: ${topGainers.join(", ")}\n` : ""}
Open Analytics: ${baseUrl}/portfolio

Need help? lumora.verify@gmail.com
© 2026 Lumora AI
`.trim()

  return { subject, html: renderMasterEmailFrame({ subject, greeting, contentHtml, logoUrl }), text }
}

export function buildSecurityAlertEmail({
  email,
  name,
  title,
  description,
  device,
  location,
}: {
  email: string
  name?: string
  title: string
  description: string
  device?: string
  location?: string
}) {
  const subject = `Lumora AI Security Notice: ${title}`
  const baseUrl = getAppBaseUrl()
  const logoUrl = getAppLogoUrl()
  const greeting = getDynamicGreeting(name)

  const contentHtml = `
    <div style="background-color:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:16px;padding:20px;margin:20px 0;">
      <h3 style="font-size:16px;color:#FCA5A5;margin:0 0 8px;font-weight:700;">Security Notice: ${title}</h3>
      <p style="font-size:14px;color:#FFFFFF;line-height:1.6;margin:0;">${description}</p>
    </div>

    ${renderSessionInfo(device, location)}

    <p style="font-size:13px;color:#A1A1AA;line-height:1.6;margin:20px 0 0;">
      If this was not authorized by you, please secure your account immediately or contact support.
    </p>

    <div style="text-align:center;margin:24px 0;">
      <a href="${baseUrl}/reset-password" style="background-color:#EF4444;color:#FFFFFF;display:inline-block;padding:12px 32px;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;">
        Secure Account
      </a>
    </div>
  `

  const text = `
Lumora AI - Security Notice

${greeting}

Security Notice: ${title}
${description}

${device ? `Device: ${device}\n` : ""}${location ? `Location: ${location}\n` : ""}
If this was not authorized by you, please secure your account at: ${baseUrl}/reset-password

Need help? lumora.verify@gmail.com
© 2026 Lumora AI
`.trim()

  return { subject, html: renderMasterEmailFrame({ subject, greeting, contentHtml, logoUrl }), text }
}

let lastLog: Record<string, unknown> | null = null

export async function sendOtpEmail({ email, name, otp, type }: { email: string; name?: string; otp: string; type: "verification" | "reset" }) {
  const { subject, html, text } = buildOtpEmail({ email, name, otp, type })
  const correlationId = createCorrelationId()

  console.log("[EMAIL] sendOtpEmail", JSON.stringify({ correlationId, email, type, provider: getActiveProviderName() }))

  const result = await sendEmail({ to: email, subject, html, text })
  lastLog = result

  if (!result.success) {
    console.warn(
      `[EMAIL] OTP email not delivered (provider ${getActiveProviderName()}): ${result.error}`,
    )
    return { success: false, messageId: result.messageId, correlationId, accepted: result.accepted, error: result.error }
  }

  return { success: true, messageId: result.messageId, correlationId, accepted: result.accepted }
}

export async function sendWelcomeEmail({ email, name }: { email: string; name?: string }) {
  const { subject, html, text } = buildWelcomeEmail({ email, name })
  const correlationId = createCorrelationId()
  console.log("[EMAIL] sendWelcomeEmail", JSON.stringify({ correlationId, email, provider: getActiveProviderName() }))
  const result = await sendEmail({ to: email, subject, html, text })
  lastLog = result
  return { success: result.success, messageId: result.messageId, correlationId, error: result.error }
}

export async function sendForgotPasswordEmail({ email, name, otp, device, location }: { email: string; name?: string; otp: string; device?: string; location?: string }) {
  const { subject, html, text } = buildForgotPasswordEmail({ email, name, otp, device, location })
  const correlationId = createCorrelationId()
  console.log("[EMAIL] sendForgotPasswordEmail", JSON.stringify({ correlationId, email, provider: getActiveProviderName() }))
  const result = await sendEmail({ to: email, subject, html, text })
  lastLog = result
  return { success: result.success, messageId: result.messageId, correlationId, error: result.error }
}

export async function sendSecurityAlertEmail({ email, name, title, description, device, location }: { email: string; name?: string; title: string; description: string; device?: string; location?: string }) {
  const { subject, html, text } = buildSecurityAlertEmail({ email, name, title, description, device, location })
  const correlationId = createCorrelationId()
  console.log("[EMAIL] sendSecurityAlertEmail", JSON.stringify({ correlationId, email, provider: getActiveProviderName() }))
  const result = await sendEmail({ to: email, subject, html, text })
  lastLog = result
  return { success: result.success, messageId: result.messageId, correlationId, error: result.error }
}

export function getLastEmailLog(): Record<string, unknown> | null {
  return lastLog
}



