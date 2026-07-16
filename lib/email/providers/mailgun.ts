import type { EmailProvider, SendEmailOptions, SendEmailResult } from "../adapter"

export const mailgunProvider: EmailProvider = {
  name: "mailgun",
  async sendEmail(_opts: SendEmailOptions): Promise<SendEmailResult> {
    const start = Date.now()
    return {
      success: true,
      messageId: "mailgun-mock",
      provider: "mailgun",
      latency: Date.now() - start,
      accepted: [_opts.to],
      rejected: [],
    }
  },
}
