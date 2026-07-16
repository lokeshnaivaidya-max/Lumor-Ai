import { createCorrelationId, createLog, normalizeEmail, type EmailProvider, type SendEmailOptions, type SendEmailLog } from "./adapter"
import { brevoProvider } from "./providers/brevo"
import { consoleProvider } from "./providers/console"

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1_000
const isDev = process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "development"

function selectProvider(): EmailProvider {
  if (isDev) return consoleProvider
  const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM)
  if (hasSmtp) return brevoProvider
  if (process.env.RESEND_API_KEY) {
    const { resendProvider } = require("./providers/resend") as { resendProvider: EmailProvider }
    return resendProvider
  }
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    const { mailgunProvider } = require("./providers/mailgun") as { mailgunProvider: EmailProvider }
    return mailgunProvider
  }
  if (process.env.POSTMARK_SERVER_TOKEN) {
    const { postmarkProvider } = require("./providers/postmark") as { postmarkProvider: EmailProvider }
    return postmarkProvider
  }
  if (process.env.SES_REGION && process.env.SES_ACCESS_KEY && process.env.SES_SECRET_KEY) {
    const { sesProvider } = require("./providers/ses") as { sesProvider: EmailProvider }
    return sesProvider
  }
  return consoleProvider
}

const provider = selectProvider()

export function getActiveProviderName(): string {
  return provider.name
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailLog> {
  const correlationId = createCorrelationId()
  const to = normalizeEmail(opts.to)
  const log: SendEmailLog = {
    correlationId,
    timestamp: new Date().toISOString(),
    to,
    subject: opts.subject,
    provider: provider.name,
    messageId: null,
    success: false,
    retryCount: 0,
    latency: 0,
    accepted: [],
    rejected: [],
    error: null,
  }

  console.log("[EMAIL:SEND]", JSON.stringify({ correlationId, to, provider: provider.name, subject: opts.subject, retries: MAX_RETRIES }))

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const attemptLog = { ...log, retryCount: attempt }
    try {
      const result = await provider.sendEmail({ ...opts, to })
      attemptLog.success = result.success
      attemptLog.messageId = result.messageId
      attemptLog.latency = result.latency
      attemptLog.accepted = result.accepted
      attemptLog.rejected = result.rejected

      if (result.success) {
        console.log("[EMAIL:SUCCESS]", JSON.stringify(createLog(attemptLog)))
        return createLog(attemptLog)
      }

      attemptLog.error = `Provider returned rejected recipients: ${result.rejected.join(", ")}`
      console.error("[EMAIL:REJECTED]", JSON.stringify(createLog(attemptLog)))

      if (attempt < MAX_RETRIES - 1) {
        console.log("[EMAIL:RETRY]", JSON.stringify({ correlationId, attempt: attempt + 1, delay: RETRY_DELAY_MS }))
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      attemptLog.error = msg
      console.error("[EMAIL:ERROR]", JSON.stringify(createLog(attemptLog)))

      if (attempt < MAX_RETRIES - 1) {
        console.log("[EMAIL:RETRY]", JSON.stringify({ correlationId, attempt: attempt + 1, delay: RETRY_DELAY_MS }))
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
      }
    }
  }

  console.error("[EMAIL:FAILED]", JSON.stringify(createLog(log)))
  return createLog(log)
}
