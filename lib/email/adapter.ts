import { createHash, randomUUID } from "node:crypto"

export type SendEmailOptions = {
  to: string
  subject: string
  html: string
}

export type SendEmailResult = {
  success: boolean
  messageId: string | null
  provider: string
  latency: number
  accepted: string[]
  rejected: string[]
  error?: string
}

export type SendEmailLog = {
  correlationId: string
  timestamp: string
  to: string
  subject: string
  provider: string
  messageId: string | null
  success: boolean
  retryCount: number
  latency: number
  accepted: string[]
  rejected: string[]
  error: string | null
}

export interface EmailProvider {
  readonly name: string
  sendEmail(opts: SendEmailOptions): Promise<SendEmailResult>
}

export function createCorrelationId(): string {
  return randomUUID()
}

export function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 16)
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function createLog(partial: Omit<SendEmailLog, "timestamp">): SendEmailLog {
  return { ...partial, timestamp: new Date().toISOString() }
}
