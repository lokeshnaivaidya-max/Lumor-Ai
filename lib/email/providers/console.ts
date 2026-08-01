import type { EmailProvider, SendEmailOptions, SendEmailResult } from "../adapter"

export const consoleProvider: EmailProvider = {
  name: "console",

  async sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
    const start = Date.now()
    console.log("[EMAIL:CONSOLE]", JSON.stringify({ to: opts.to, subject: opts.subject, htmlLength: opts.html.length }))
    return {
      success: true,
      messageId: `console-${Date.now()}`,
      provider: "console",
      latency: Date.now() - start,
      accepted: [opts.to],
      rejected: [],
    }
  },
}
