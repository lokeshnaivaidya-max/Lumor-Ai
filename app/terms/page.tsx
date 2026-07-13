import Link from "next/link"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { CursorGlow } from "@/components/cursor-glow"
import { LumoraMark } from "@/components/lumora-mark"

export const metadata = {
  title: "Terms & Conditions — Lumora AI",
  description: "Terms and conditions for using the Lumora AI stock intelligence platform.",
}

const lastUpdated = "July 13, 2026"

export default function TermsPage() {
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
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-emerald">Terms & Conditions</p>
            <h1 className="font-heading mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Terms & Conditions
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

            <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/80">
              <Section title="1. Acceptance of Terms">
                <p>By creating an account and using Lumora (&ldquo;the Service&rdquo;), you agree to be bound by these Terms & Conditions. If you do not agree to any part of these terms, you must not create an account or use the Service.</p>
              </Section>

              <Section title="2. Description of Service">
                <p>Lumora provides AI-powered analysis and insights on publicly traded financial instruments, including stocks, ETFs, and indices. The Service processes publicly available market data and news to generate analysis, recommendations, and educational content.</p>
                <p className="mt-3">Lumora is a tool for research and educational purposes. It is not a brokerage, a financial advisor, or a substitute for professional financial guidance.</p>
              </Section>

              <Section title="3. Not Financial Advice — Disclaimer">
                <div className="mt-2 rounded-xl border border-gold/20 bg-gold/[0.06] px-4 py-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    <div>
                      <p className="font-semibold text-foreground">Important Disclaimer</p>
                      <p className="mt-1 text-foreground/80">
                        Lumora is for research and educational purposes only. Nothing on this platform constitutes financial advice, 
                        investment advice, or a recommendation to buy, sell, or hold any security or financial instrument.
                      </p>
                      <p className="mt-2 text-foreground/80">
                        <strong>We do not take responsibility for any financial losses you may incur.</strong> All investment decisions 
                        are your own. The stock market involves risk, and past performance does not guarantee future results. 
                        You should never invest money you cannot afford to lose.
                      </p>
                      <p className="mt-2 text-foreground/80">
                        Before making any investment decision, we strongly recommend consulting with a qualified financial 
                        advisor or professional who understands your personal financial situation, risk tolerance, and goals.
                      </p>
                      <p className="mt-2 text-foreground/80">
                        <strong>Be careful. Do your own research. Never rely solely on AI-generated analysis for financial decisions.</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="4. User Accounts & Responsibilities">
                <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Provide accurate, current, and complete account information</li>
                  <li>Keep your password secure and not share your account with others</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                  <li>Comply with all applicable laws when using the Service</li>
                </ul>
              </Section>

              <Section title="5. Acceptable Use">
                <p>You agree not to:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Use the Service for any illegal purpose or in violation of any laws</li>
                  <li>Attempt to access, scrape, or extract data in ways that exceed normal API rate limits</li>
                  <li>Reverse engineer, decompile, or tamper with the Service</li>
                  <li>Use the Service to harm, abuse, or harass others</li>
                  <li>Impersonate any person or entity</li>
                </ul>
              </Section>

              <Section title="6. Limitation of Liability">
                <p>To the maximum extent permitted by law, Lumora and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Financial losses or trading losses resulting from use of the Service</li>
                  <li>Loss of profits, data, or business opportunities</li>
                  <li>Service interruptions, errors, or inaccuracies in AI-generated analysis</li>
                  <li>Actions taken or not taken based on information provided by the Service</li>
                </ul>
                <p className="mt-3">The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis, without warranties of any kind, either express or implied.</p>
              </Section>

              <Section title="7. Accuracy of Information">
                <p>While we strive for accuracy, Lumora makes no guarantees regarding the accuracy, completeness, or timeliness of market data, AI analysis, or any information provided through the Service. Market data is sourced from third-party providers and may be delayed or contain errors.</p>
                <p className="mt-3">AI-generated analysis may contain errors, hallucinations, or inaccuracies. Always verify critical information through independent sources.</p>
              </Section>

              <Section title="8. Intellectual Property">
                <p>The Lumora name, logo, design, and software are proprietary. You may not copy, modify, distribute, or create derivative works without our express written permission. Your account data and portfolio information remain your property.</p>
              </Section>

              <Section title="9. Termination">
                <p>We reserve the right to suspend or terminate your account at any time for violation of these terms, illegal activity, or any reason we deem necessary. You may delete your account at any time through your profile settings.</p>
              </Section>

              <Section title="10. Changes to Terms">
                <p>We may update these Terms & Conditions from time to time. Material changes will be notified via email or through the Service. Continued use after changes take effect constitutes acceptance of the updated terms.</p>
              </Section>

              <Section title="11. Governing Law">
                <p>These terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be resolved in the courts of Hyderabad, Telangana, India.</p>
              </Section>

              <Section title="12. Contact">
                <p>For questions about these terms, contact us at legal@lumora.app.</p>
              </Section>
            </div>

            <div className="mt-10 flex items-center gap-4 border-t border-white/10 pt-6">
              <Link href="/privacy" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors">Privacy Policy</Link>
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
