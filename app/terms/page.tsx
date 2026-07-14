import Link from "next/link"
import { ArrowLeft, AlertTriangle, Scale, FileText, Shield, Gavel, Mail } from "lucide-react"

import { LumoraMark } from "@/components/lumora-mark"

export const metadata = {
  title: "Terms & Conditions — Lumora AI",
  description: "Terms and conditions for using the Lumora AI market intelligence platform.",
}

const lastUpdated = "July 13, 2026"

const SECTIONS = [
  { id: "acceptance", title: "1. Acceptance of Terms" },
  { id: "description", title: "2. Description of Service" },
  { id: "educational", title: "3. Educational Use Only" },
  { id: "not-financial-advice", title: "4. Not Financial Advice" },
  { id: "user-responsibilities", title: "5. User Responsibilities" },
  { id: "acceptable-use", title: "6. Acceptable Use" },
  { id: "data-accuracy", title: "7. Data Accuracy" },
  { id: "intellectual-property", title: "8. Intellectual Property" },
  { id: "termination", title: "9. Account Termination" },
  { id: "changes", title: "10. Changes" },
  { id: "governing-law", title: "11. Governing Law" },
  { id: "contact", title: "12. Contact" },
]

export default function TermsPage() {
  return (
    <>
      <header className="relative z-30 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5 text-foreground">
          <LumoraMark className="h-7 w-7" />
          <span className="font-heading font-semibold tracking-tight">Lumora</span>
        </Link>
        <Link href="/sign-up" className="glass-card flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Sign up
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-32 pt-8">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-16">
          {/* Sticky TOC */}
          <nav className="relative mb-10 lg:mb-0 lg:pt-2">
            <div className="lg:sticky lg:top-24">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Contents</p>
              <ul className="space-y-1.5">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="block rounded-lg px-3 py-1.5 text-sm text-muted-foreground/70 transition-colors hover:text-foreground hover:bg-white/[0.03]"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Content */}
          <div>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl sm:p-12 lg:p-16">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue/[0.04] via-transparent to-violet/[0.04]" />

              <div className="relative">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-emerald">Terms &amp; Conditions</p>
                <h1 className="font-heading mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Terms &amp; Conditions
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

                <div className="mt-12 space-y-12 text-sm leading-relaxed text-foreground/80" data-smooth-scroll>
                  <Section id="acceptance" title="1. Acceptance of Terms" icon={FileText}>
                    <p>
                      By creating an account or using Lumora (&ldquo;the Service&rdquo;), you agree to be bound by these Terms &amp; Conditions and our Privacy Policy. If you do not agree to any part of these terms, you must not create an account or use the Service.
                    </p>
                    <p className="mt-4">
                      These terms constitute a legally binding agreement between you and Lumora. Your continued use of the Service constitutes acceptance of any updates or modifications.
                    </p>
                  </Section>

                  <Section id="description" title="2. Description of Service" icon={Scale}>
                    <p>
                      Lumora provides AI-powered market analysis, research tools, and market intelligence for educational and informational purposes. The Service processes publicly available market data, technical indicators, and news to generate analysis, recommendations, and content.
                    </p>
                    <p className="mt-4">
                      Lumora is a research and educational tool. It is not a brokerage, a financial advisor, or a substitute for professional financial guidance. We do not execute trades, manage portfolios on your behalf, or provide personalized investment advice.
                    </p>
                  </Section>

                  <Section id="educational" title="3. Educational Use Only" icon={FileText}>
                    <p>
                      Lumora is designed and intended solely for educational and informational purposes. The platform helps users understand market dynamics, learn about technical and fundamental analysis, and explore investment concepts through AI-powered tools.
                    </p>
                    <p className="mt-4">
                      The Service should be used as a starting point for your own research, not as a substitute for comprehensive due diligence or professional financial guidance.
                    </p>
                  </Section>

                  <Section id="not-financial-advice" title="4. Not Financial Advice" icon={AlertTriangle}>
                    <div className="rounded-2xl border border-gold/20 bg-gold/[0.06] px-5 py-5">
                      <div className="flex items-start gap-4">
                        <div className="rounded-xl bg-gold/10 p-2.5 shrink-0">
                          <AlertTriangle className="h-5 w-5 text-gold" />
                        </div>
                        <div className="space-y-3">
                          <p className="font-semibold text-foreground">IMPORTANT DISCLAIMER</p>
                          <p className="text-foreground/80">
                            Lumora provides AI-generated market analysis and research tools for educational and informational purposes only.
                          </p>
                          <p className="text-foreground/80">
                            <strong>Nothing on Lumora constitutes:</strong>
                          </p>
                          <ul className="list-disc space-y-1 pl-5 text-foreground/80">
                            <li>Financial Advice</li>
                            <li>Investment Advice</li>
                            <li>Tax Advice</li>
                            <li>Legal Advice</li>
                          </ul>
                          <p className="text-foreground/80">
                            We are <strong>NOT</strong> SEBI registered investment advisors. Lumora does <strong>NOT</strong> recommend buying or selling any financial instrument.
                          </p>
                          <p className="text-foreground/80">
                            Users remain <strong>fully responsible</strong> for every investment decision. Stock markets involve risk. Past performance does not guarantee future returns.
                          </p>
                          <p className="text-foreground/80">
                            AI models may generate incorrect, incomplete, or outdated information. Always conduct your own research and consult a qualified financial advisor before investing.
                          </p>
                          <p className="text-foreground/80 font-medium">
                            Never invest money you cannot afford to lose.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Section>

                  <Section id="user-responsibilities" title="5. User Responsibilities" icon={Shield}>
                    <p>You are responsible for:</p>
                    <ul className="mt-3 list-disc space-y-1.5 pl-5">
                      <li>Maintaining the confidentiality of your account credentials</li>
                      <li>Providing accurate, current, and complete account information</li>
                      <li>Keeping your password secure and not sharing your account with others</li>
                      <li>Notifying us immediately of any unauthorized use of your account</li>
                      <li>Complying with all applicable laws when using the Service</li>
                      <li>Making your own independent investment decisions based on your own research and risk tolerance</li>
                      <li>Verifying any AI-generated information through independent sources before acting on it</li>
                    </ul>
                  </Section>

                  <Section id="acceptable-use" title="6. Acceptable Use" icon={Shield}>
                    <p>You agree not to:</p>
                    <ul className="mt-3 list-disc space-y-1.5 pl-5">
                      <li>Use the Service for any illegal purpose or in violation of any laws</li>
                      <li>Attempt to access, scrape, or extract data in ways that exceed normal usage limits</li>
                      <li>Reverse engineer, decompile, or tamper with the Service or its underlying systems</li>
                      <li>Use the Service to harm, abuse, or harass others</li>
                      <li>Impersonate any person or entity</li>
                      <li>Interfere with or disrupt the integrity or performance of the Service</li>
                      <li>Use the Service to distribute malware, spam, or other harmful content</li>
                      <li>Attempt to bypass any security measures or access restrictions</li>
                    </ul>
                  </Section>

                  <Section id="data-accuracy" title="7. Data Accuracy" icon={Scale}>
                    <p>
                      Market data displayed on Lumora comes from third-party providers, including Yahoo Finance and other financial data sources. We do not guarantee the accuracy, completeness, or timeliness of this data.
                    </p>
                    <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
                      <p className="text-foreground font-medium">Important notes:</p>
                      <ul className="list-disc space-y-1.5 pl-5 text-foreground/80">
                        <li>Market data may be delayed compared to real-time market conditions</li>
                        <li>Prices may occasionally be unavailable, outdated, or contain errors</li>
                        <li>Technical indicators are computed based on available historical data and may not reflect the most current market conditions</li>
                        <li>AI-generated analysis may contain inaccuracies, hallucinations, or incomplete reasoning</li>
                        <li>News headlines are aggregated from third-party sources and may not represent the full picture</li>
                        <li>Fundamental data may not reflect the most recent corporate actions or filings</li>
                      </ul>
                    </div>
                    <p className="mt-4">
                      Always verify critical information through independent, authoritative sources before making investment decisions.
                    </p>
                  </Section>

                  <Section id="intellectual-property" title="8. Intellectual Property" icon={FileText}>
                    <p>
                      The Lumora name, logo, design, software, and all related intellectual property are proprietary to Lumora and its operators. You may not copy, modify, distribute, sell, or create derivative works without our express written permission.
                    </p>
                    <p className="mt-4">
                      Your account data, portfolio information, watchlists, saved analyses, and personal content remain your property. Lumora claims no ownership over your personal data or investment preferences.
                    </p>
                    <p className="mt-4">
          AI-generated content produced by the Service is provided for your personal, non-commercial use. You may not republish, redistribute, or commercially exploit AI-generated content without attribution to Lumora.
        </p>
                  </Section>

                  <Section id="termination" title="9. Account Termination" icon={Gavel}>
                    <p>
                      We may suspend or terminate accounts that violate these Terms, applicable laws, or threaten the security or integrity of the Service.
                    </p>
                    <p className="mt-4">
                      You may delete your account at any time through your profile settings. Upon termination or deletion, your access to the Service will cease, and we will delete or anonymize your personal data in accordance with our Privacy Policy.
                    </p>
                    <p className="mt-4">
                      We reserve the right to refuse service, terminate accounts, or remove content at our discretion, without prior notice, for violations of these terms or for any conduct we believe is harmful to the Service, its users, or third parties.
                    </p>
                  </Section>

                  <Section id="changes" title="10. Changes to Terms" icon={FileText}>
                    <p>
                      We may update these Terms &amp; Conditions from time to time. Material changes will be notified via email or through the Service. Your continued use of Lumora after changes take effect constitutes your acceptance of the updated terms.
                    </p>
                    <p className="mt-4">
                      If you do not agree with any changes, you must stop using the Service and delete your account. The latest version of these terms will always be available at this page.
                    </p>
                  </Section>

                  <Section id="governing-law" title="11. Governing Law" icon={Gavel}>
                    <p>
                      These terms shall be governed by and construed in accordance with the laws of <strong>India</strong>.
                    </p>
                    <p className="mt-2">
                      Any disputes arising from these terms or your use of the Service shall be resolved in the courts of <strong>Hyderabad, Telangana, India</strong>.
                    </p>
                    <p className="mt-2 text-muted-foreground/60">
                      This section does not affect any mandatory consumer protection rights you may have under applicable law.
                    </p>
                  </Section>

                  <Section id="contact" title="12. Contact" icon={Mail}>
                    <p>
                      For questions about these Terms &amp; Conditions, please contact us:
                    </p>
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href="mailto:support@lumora.app" className="text-sm font-medium text-foreground hover:text-foreground/80 transition-colors">
                        support@lumora.app
                      </a>
                    </div>
                  </Section>
                </div>

                <div className="mt-12 flex items-center gap-4 border-t border-white/10 pt-6">
                  <Link href="/privacy" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors">Privacy Policy</Link>
                  <span className="text-muted-foreground/30">·</span>
                  <Link href="/sign-up" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors">Create account</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

function Section({ id, title, icon: Icon, children }: { id: string; title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="rounded-lg bg-white/[0.05] p-1.5">
          <Icon className="h-4 w-4 text-muted-foreground/60" />
        </div>
        <h2 className="font-heading text-base font-semibold tracking-tight text-foreground">{title}</h2>
      </div>
      <div>{children}</div>
    </section>
  )
}
