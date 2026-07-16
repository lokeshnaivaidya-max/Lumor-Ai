import type { EmailProvider, SendEmailOptions, SendEmailResult } from "../adapter"

export const sesProvider: EmailProvider = {
  name: "ses",
  async sendEmail(_opts: SendEmailOptions): Promise<SendEmailResult> {
    const start = Date.now()
    return {
      success: true,
      messageId: "ses-mock",
      provider: "ses",
      latency: Date.now() - start,
      accepted: [_opts.to],
      rejected: [],
    }
  },
}
