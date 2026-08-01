import { createCorrelationId, createLog, normalizeEmail, type EmailProvider, type SendEmailOptions, type SendEmailLog } from "./adapter"
import { gmailProvider } from "./providers/gmail"
import { consoleProvider } from "./providers/console"

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1_000

function selectProvider(): EmailProvider {
  const user = process.env.SMTP_USER || process.env.SMTP_USERNAME || process.env.EMAIL_USER || process.env.GMAIL_USER
  const pass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS || "").trim()
  const host = process.env.SMTP_HOST || (user ? "smtp.gmail.com" : undefined)

  if (user && pass && host) {
    return gmailProvider
  }
  return consoleProvider
}

declare global {
  var _emailLogs: SendEmailLog[] | undefined
}

function recordEmailLog(log: SendEmailLog) {
  if (!globalThis._emailLogs) {
    globalThis._emailLogs = []
  }
  globalThis._emailLogs.unshift(log)
  if (globalThis._emailLogs.length > 100) {
    globalThis._emailLogs.pop()
  }
}

export function getEmailHistory(): SendEmailLog[] {
  return globalThis._emailLogs || []
}

export function getActiveProviderName(): string {
  return selectProvider().name
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailLog> {
  const provider = selectProvider()
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

  let lastLog: SendEmailLog = log

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
        const finalLog = createLog(attemptLog)
        recordEmailLog(finalLog)
        console.log("[EMAIL:SUCCESS]", JSON.stringify(finalLog))
        return finalLog
      }

      attemptLog.error = `Provider returned rejected recipients: ${result.rejected.join(", ")}`
      console.error("[EMAIL:REJECTED]", JSON.stringify(createLog(attemptLog)))
      lastLog = attemptLog

      if (attempt < MAX_RETRIES - 1) {
        console.log("[EMAIL:RETRY]", JSON.stringify({ correlationId, attempt: attempt + 1, delay: RETRY_DELAY_MS }))
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      attemptLog.error = msg
      console.error("[EMAIL:ERROR]", JSON.stringify(createLog(attemptLog)))
      lastLog = attemptLog

      if (attempt < MAX_RETRIES - 1) {
        console.log("[EMAIL:RETRY]", JSON.stringify({ correlationId, attempt: attempt + 1, delay: RETRY_DELAY_MS }))
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
      }
    }
  }

  const finalFailedLog = createLog(lastLog)
  recordEmailLog(finalFailedLog)
  console.error("[EMAIL:FAILED]", JSON.stringify(finalFailedLog))
  return finalFailedLog
}
