import nodemailer from "nodemailer"
import type { EmailProvider, SendEmailOptions, SendEmailResult } from "../adapter"

let transporter: nodemailer.Transporter | null = null
let poolReady = false

function getConfig() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT) || 465
  const secure = process.env.SMTP_SECURE !== "false"
  const user = process.env.SMTP_USER
  const pass_raw = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM

  // Strip any accidental newline/whitespace from the env var
  const pass = pass_raw ? pass_raw.trim() : pass_raw
  if (!host || !user || !pass || !from) {
    const missing = []
    if (!host) missing.push("SMTP_HOST")
    if (!user) missing.push("SMTP_USER")
    if (!pass) missing.push("SMTP_PASS")
    if (!from) missing.push("SMTP_FROM")
    return null
  }
  return { host, port, secure, user, pass, from }
}

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter
  const cfg = getConfig()
  if (!cfg) {
    console.error("[SMTP] getTransporter() failed — SMTP not configured")
    throw new Error("SMTP not configured")
  }
  console.log("[SMTP] Creating transporter", JSON.stringify({ host: cfg.host, port: cfg.port, secure: cfg.secure, user: cfg.user }))
  transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
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
  console.log("[SMTP] Verifying transporter")
  try {
    await t.verify()
    console.log("[SMTP] verify() success — pool ready")
    poolReady = true
  } catch (err: unknown) {
    poolReady = false
    const msg = err instanceof Error ? err.message : String(err)
    const code = err instanceof Object && "code" in (err as object) ? (err as Record<string, unknown>).code : undefined
    const command = err instanceof Object && "command" in (err as object) ? (err as Record<string, unknown>).command : undefined
    const response = err instanceof Object && "response" in (err as object) ? (err as Record<string, unknown>).response : undefined
    const responseCode = err instanceof Object && "responseCode" in (err as object) ? (err as Record<string, unknown>).responseCode : undefined
    const stack = err instanceof Error ? err.stack : undefined

    console.error("[SMTP ERROR] verify() failed")
    console.error("[SMTP ERROR] message:", msg)
    if (code !== undefined) console.error("[SMTP ERROR] code:", code)
    if (command !== undefined) console.error("[SMTP ERROR] command:", command)
    if (response !== undefined) console.error("[SMTP ERROR] response:", response)
    if (responseCode !== undefined) console.error("[SMTP ERROR] responseCode:", responseCode)
    if (stack) console.error("[SMTP ERROR] stack:", stack)

    const cfg = getConfig()
    if (cfg) {
      if (responseCode === 535 || responseCode === 530 || (typeof response === "string" && (response.includes("535") || response.includes("530") || response.toLowerCase().includes("auth")))) {
        console.error("[SMTP ERROR] Authentication rejected by Gmail. Check SMTP_USER and App Password:")
        console.error("[SMTP ERROR]   SMTP_USER =", cfg.user)
        console.error("[SMTP ERROR]   App Password valid? If using 2FA, generate an App Password at https://myaccount.google.com/apppasswords")
        console.error("[SMTP ERROR]   Regular Gmail passwords do NOT work — must use App Password")
      }
    }

    throw err
  }
}

export const gmailProvider: EmailProvider = {
  name: "gmail",

  async sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
    const start = Date.now()
    const cfg = getConfig()
    if (!cfg) {
      const missing = []
      if (!process.env.SMTP_HOST) missing.push("SMTP_HOST")
      if (!process.env.SMTP_USER) missing.push("SMTP_USER")
      if (!process.env.SMTP_PASS) missing.push("SMTP_PASS")
      if (!process.env.SMTP_FROM) missing.push("SMTP_FROM")
      console.error("[SMTP ERROR] Missing config:", missing.join(", "))
      return { success: false, messageId: null, provider: "gmail", latency: Date.now() - start, accepted: [], rejected: [], error: `SMTP not configured — missing: ${missing.join(", ")}` }
    }

    await verifyConnection()

    console.log("[SMTP] Sending mail", JSON.stringify({ to: opts.to, subject: opts.subject }))
    try {
      const info = await transporter!.sendMail({
        from: cfg.from,
        replyTo: cfg.user,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      })

      console.log("[SMTP] sendMail() success", JSON.stringify({ messageId: info.messageId, accepted: info.accepted, rejected: info.rejected }))

      return {
        success: info.rejected.length === 0,
        messageId: info.messageId || null,
        provider: "gmail",
        latency: Date.now() - start,
        accepted: info.accepted || [],
        rejected: info.rejected || [],
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      const code = err instanceof Object && "code" in (err as object) ? (err as Record<string, unknown>).code : undefined
      const command = err instanceof Object && "command" in (err as object) ? (err as Record<string, unknown>).command : undefined
      const response = err instanceof Object && "response" in (err as object) ? (err as Record<string, unknown>).response : undefined
      const responseCode = err instanceof Object && "responseCode" in (err as object) ? (err as Record<string, unknown>).responseCode : undefined
      const stack = err instanceof Error ? err.stack : undefined

      console.error("[SMTP ERROR] sendMail() failed")
      console.error("[SMTP ERROR] message:", msg)
      if (code !== undefined) console.error("[SMTP ERROR] code:", code)
      if (command !== undefined) console.error("[SMTP ERROR] command:", command)
      if (response !== undefined) console.error("[SMTP ERROR] response:", response)
      if (responseCode !== undefined) console.error("[SMTP ERROR] responseCode:", responseCode)
      if (stack) console.error("[SMTP ERROR] stack:", stack)

      if (responseCode === 535 || responseCode === 530 || (typeof response === "string" && (response.includes("535") || response.includes("530") || response.toLowerCase().includes("auth")))) {
        console.error("[SMTP ERROR] Authentication rejected by Gmail. Check SMTP_USER and App Password:")
        console.error("[SMTP ERROR]   SMTP_USER =", cfg.user)
        console.error("[SMTP ERROR]   App Password valid? Generate at https://myaccount.google.com/apppasswords")
      }

      throw err
    }
  },
}
