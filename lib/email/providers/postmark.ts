import type { EmailProvider, SendEmailOptions, SendEmailResult } from "../adapter"

export const postmarkProvider: EmailProvider = {
  name: "postmark",
  async sendEmail(_opts: SendEmailOptions): Promise<SendEmailResult> {
    const start = Date.now()
    return {
      success: true,
      messageId: "postmark-mock",
      provider: "postmark",
      latency: Date.now() - start,
      accepted: [_opts.to],
      rejected: [],
    }
  },
}
