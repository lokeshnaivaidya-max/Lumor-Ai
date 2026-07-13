import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { CursorGlow } from "@/components/cursor-glow"
import { LumoraMark } from "@/components/lumora-mark"

export const metadata = {
  title: "Privacy Policy — Lumora AI",
  description: "How Lumora collects, uses, and protects your personal data.",
}

const lastUpdated = "July 13, 2026"

export default function PrivacyPage() {
  return (
    <>
      <CursorGlow />
      <header className="relative z-30 mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-6">
        <Link href="/" className="flex items-center gap-2.5 text-foreground">
          <LumoraMark className="h-7 w-7" />
          <span className="font-heading font-semibold tracking-tight">Lumora</span>
        </Link>
        <Link href="/sign-up" className="glass-card flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Sign up
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-24 pt-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl sm:p-12">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue/[0.04] via-transparent to-violet/[0.04]" />

          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-emerald">Privacy Policy</p>
            <h1 className="font-heading mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

            <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/80">
              <Section title="1. Information We Collect">
                <p>We collect information you provide when creating an account, including your name, email address, and any profile details you choose to add (such as timezone, country, and notification preferences).</p>
                <p className="mt-3">We also collect technical information automatically when you use Lumora, including your IP address, browser type, device information, and usage patterns (pages visited, features used, symbols searched).</p>
                <p className="mt-3">When you analyze stocks or financial instruments, the symbols and data you query are processed by our AI service (Google Gemini) to generate analysis. This data is not stored beyond what is necessary to provide your analysis results.</p>
              </Section>

              <Section title="2. How We Use Your Information">
                <p>We use your information to:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Provide, maintain, and improve Lumora&apos;s AI analysis and market intelligence features</li>
                  <li>Send you important account-related notifications (e.g., email verification, password reset)</li>
                  <li>Personalize your experience, such as remembering your theme preference and portfolio data</li>
                  <li>Detect and prevent abuse, fraud, or unauthorized access</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </Section>

              <Section title="3. Data Sharing & Third Parties">
                <p>We do not sell your personal information to third parties.</p>
                <p className="mt-3">We share data only with trusted service providers who help us operate Lumora:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li><strong>Google Gemini API</strong> — Processes stock analysis requests. Symbol names and market data are sent for AI analysis. No personally identifiable information is included in analysis requests.</li>
                  <li><strong>Vercel</strong> — Hosts the Lumora application and stores server logs (IP addresses, request metadata).</li>
                  <li><strong>Resend</strong> — Sends transactional emails (verification, password reset).</li>
                  <li><strong>Neon (PostgreSQL)</strong> — Hosts the database that stores your account and preferences.</li>
                </ul>
              </Section>

              <Section title="4. Data Retention">
                <p>We retain your account information for as long as your account is active. If you delete your account, we delete or anonymize your personal data within 30 days, except where we are required to retain it by law.</p>
                <p className="mt-3">Server logs are retained for up to 30 days for security and debugging purposes.</p>
              </Section>

              <Section title="5. Data Security">
                <p>We implement industry-standard security measures, including encryption in transit (TLS) and at rest, to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
              </Section>

              <Section title="6. Your Rights">
                <p>Depending on your jurisdiction, you may have the right to:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Access the personal data we hold about you</li>
                  <li>Request correction or deletion of your data</li>
                  <li>Object to or restrict processing of your data</li>
                  <li>Request portability of your data</li>
                  <li>Withdraw consent at any time (where processing is based on consent)</li>
                </ul>
                <p className="mt-3">To exercise these rights, contact us at privacy@lumora.app or use the account deletion option in your profile settings.</p>
              </Section>

              <Section title="7. Cookies">
                <p>Lumora uses essential cookies to maintain your session, remember your theme preference, and provide basic functionality. We do not use third-party tracking cookies or advertising cookies. You can control cookies through your browser settings.</p>
              </Section>

              <Section title="8. Changes to This Policy">
                <p>We may update this Privacy Policy from time to time. Material changes will be notified via email or through the Lumora application. Your continued use of Lumora after changes constitutes acceptance of the updated policy.</p>
              </Section>

              <Section title="9. Contact">
                <p>If you have questions about this Privacy Policy, please contact us at privacy@lumora.app.</p>
              </Section>
            </div>

            <div className="mt-10 flex items-center gap-4 border-t border-white/10 pt-6">
              <Link href="/terms" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors">Terms & Conditions</Link>
              <span className="text-muted-foreground/30">·</span>
              <Link href="/sign-up" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors">Create account</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-heading text-base font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  )
}
