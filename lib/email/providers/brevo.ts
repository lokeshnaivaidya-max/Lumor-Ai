import nodemailer from "nodemailer"
import type { EmailProvider, SendEmailOptions, SendEmailResult } from "../adapter"

let transporter: nodemailer.Transporter | null = null
let poolReady = false

function getConfig() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT) || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM
  if (!host || !user || !pass || !from) {
    const missing = []
    if (!host) missing.push("SMTP_HOST")
    if (!user) missing.push("SMTP_USER")
    if (!pass) missing.push("SMTP_PASS")
    if (!from) missing.push("SMTP_FROM")
    return null
  }
  return { host, port, user, pass, from }
}

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter
  const cfg = getConfig()
  if (!cfg) throw new Error("SMTP not configured")
  transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: false,
    auth: { user: cfg.user, pass: cfg.pass },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 10,
    socketTimeout: 10_000,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
  })
  return transporter
}

async function verifyConnection(): Promise<void> {
  if (poolReady) return
  const t = getTransporter()
  await t.verify()
  poolReady = true
}

export const brevoProvider: EmailProvider = {
  name: "brevo",

  async sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
    const start = Date.now()
    const cfg = getConfig()
    if (!cfg) {
      return { success: false, messageId: null, provider: "brevo", latency: Date.now() - start, accepted: [], rejected: [], error: "SMTP not configured" }
    }

    const t = getTransporter()
    await verifyConnection().catch(() => { poolReady = false; throw new Error("SMTP connection verification failed") })

    const info = await t.sendMail({
      from: cfg.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    })

    return {
      success: info.rejected.length === 0,
      messageId: info.messageId || null,
      provider: "brevo",
      latency: Date.now() - start,
      accepted: info.accepted || [],
      rejected: info.rejected || [],
    }
  },
}
