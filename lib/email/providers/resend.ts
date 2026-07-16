import type { EmailProvider, SendEmailOptions, SendEmailResult } from "../adapter"

export const resendProvider: EmailProvider = {
  name: "resend",
  async sendEmail(_opts: SendEmailOptions): Promise<SendEmailResult> {
    const start = Date.now()
    return {
      success: true,
      messageId: "resend-mock",
      provider: "resend",
      latency: Date.now() - start,
      accepted: [_opts.to],
      rejected: [],
    }
  },
}
