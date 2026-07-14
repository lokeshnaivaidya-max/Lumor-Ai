import Link from "next/link"
import { ArrowLeft, Shield, Database, Cookie, Users, Lock, Mail, Eye, AlertTriangle } from "lucide-react"

import { LumoraMark } from "@/components/lumora-mark"

export const metadata = {
  title: "Privacy Policy — Lumora AI",
  description: "How Lumora collects, uses, and protects your personal data.",
}

const lastUpdated = "July 13, 2026"

const SECTIONS = [
  { id: "information-we-collect", title: "Information We Collect" },
  { id: "how-we-use-data", title: "How We Use Data" },
  { id: "cookies", title: "Cookies" },
  { id: "third-parties", title: "Third Party Services" },
  { id: "security", title: "Security" },
  { id: "user-rights", title: "User Rights" },
  { id: "children", title: "Children" },
  { id: "changes", title: "Changes" },
  { id: "contact", title: "Contact" },
]

export default function PrivacyPage() {
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
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-emerald">Privacy Policy</p>
                <h1 className="font-heading mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Privacy Policy
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

                <div className="mt-12 space-y-12 text-sm leading-relaxed text-foreground/80" data-smooth-scroll>
                  <Section id="information-we-collect" title="Information We Collect" icon={Database}>
                    <p className="mb-3 font-medium text-foreground">When you create an account and use Lumora, we collect the following information:</p>
                    <ul className="list-disc space-y-2 pl-5">
                      <li><strong>Email</strong> — Your email address is required for account creation, authentication, and communication</li>
                      <li><strong>Name</strong> — Your chosen display name for your profile</li>
                      <li><strong>Portfolio</strong> — The stock symbols, quantities, and average prices you add to your portfolio</li>
                      <li><strong>Watchlist</strong> — The stocks and instruments you choose to track</li>
                      <li><strong>Saved Analyses</strong> — AI-generated analysis reports you choose to save</li>
                      <li><strong>Preferences</strong> — Your theme selection (dark/light/system), timezone, country, bio, and notification settings</li>
                      <li><strong>Authentication Data</strong> — Hashed password, email verification status, session information, and IP addresses</li>
                    </ul>
                    <p className="mt-4 text-muted-foreground">
                      We do not collect sensitive financial information such as bank account numbers, trading account credentials, or government identification numbers.
                    </p>
                  </Section>

                  <Section id="how-we-use-data" title="How We Use Data" icon={Eye}>
                    <p className="mb-3 font-medium text-foreground">We use your information exclusively for the following purposes:</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { label: "Authentication", desc: "Verify your identity, manage your session, and protect your account from unauthorized access." },
                        { label: "Security", desc: "Detect and prevent abuse, fraud, and unauthorized access attempts." },
                        { label: "AI Analysis", desc: "Generate market analysis and research based on the symbols and data you query." },
                        { label: "Personalization", desc: "Remember your theme, preferences, portfolio data, and saved analyses." },
                        { label: "Bug Fixes", desc: "Diagnose technical issues, improve performance, and enhance the user experience." },
                        { label: "Communication", desc: "Send important account notifications, including email verification, password resets, and policy updates." },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                          <p className="text-foreground font-medium text-xs mb-1">{item.label}</p>
                          <p className="text-xs text-muted-foreground/70">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-muted-foreground">
                      We do not sell your personal information to third parties. We do not use your data for advertising or marketing purposes beyond our own service communications.
                    </p>
                  </Section>

                  <Section id="cookies" title="Cookies" icon={Cookie}>
                    <p>Lumora uses minimal cookies necessary for the Service to function:</p>
                    <div className="mt-4 space-y-3">
                      {[
                        { name: "Authentication cookies", desc: "Essential for keeping you signed in across sessions. These are secure, HTTP-only cookies." },
                        { name: "Session cookies", desc: "Temporary cookies that maintain your session state while you browse the application." },
                        { name: "Theme preference", desc: "Stores your selected theme (dark/light/system) in local storage." },
                        { name: "Analytics", desc: "Minimal, anonymized usage data to help us improve the application. No personal information is collected." },
                      ].map((c) => (
                        <div key={c.name} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                          <div className="rounded-lg bg-white/[0.05] p-1.5 shrink-0 mt-0.5">
                            <Cookie className="h-3.5 w-3.5 text-muted-foreground/60" />
                          </div>
                          <div>
                            <p className="text-foreground text-xs font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground/70 mt-0.5">{c.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4">
                      You can control cookie preferences through your browser settings. However, disabling essential cookies may affect the functionality of the Service.
                    </p>
                  </Section>

                  <Section id="third-parties" title="Third Party Services" icon={Shield}>
                    <p className="mb-4">Lumora relies on a limited set of trusted third-party services to operate. Each service processes only the data necessary for its specific function:</p>
                    {[
                      {
                        name: "Yahoo Finance",
                        what: "Market data, stock prices, technical indicators, and company fundamentals",
                        data: "Symbol names and market data queries. No personally identifiable information is shared.",
                      },
                      {
                        name: "Google / OpenRouter AI",
                        what: "AI-powered analysis generation",
                        data: "Stock symbols, market data, and news headlines are sent for AI processing. No personal information (name, email, portfolio contents) is included in AI analysis requests.",
                      },
                      {
                        name: "Resend",
                        what: "Transactional email delivery",
                        data: "Email address is shared solely for sending verification codes, password reset links, and account notifications.",
                      },
                      {
                        name: "Neon (PostgreSQL)",
                        what: "Database hosting",
                        data: "All account data, preferences, portfolio, watchlist, saved analyses, and chat history are stored securely in our Neon database.",
                      },
                      {
                        name: "Better Auth",
                        what: "Authentication infrastructure",
                        data: "Email, hashed password, session tokens, and authentication metadata are processed through Better Auth for secure authentication.",
                      },
                    ].map((svc) => (
                      <div key={svc.name} className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <p className="text-foreground text-xs font-medium">{svc.name}</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5"><span className="text-muted-foreground/80">Purpose:</span> {svc.what}</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5"><span className="text-muted-foreground/80">Data shared:</span> {svc.data}</p>
                      </div>
                    ))}
                  </Section>

                  <Section id="security" title="Security" icon={Lock}>
                    <p>We implement industry-standard security measures to protect your data:</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        { label: "Encryption", desc: "All data in transit is encrypted using TLS/HTTPS. Data at rest is encrypted using industry-standard encryption." },
                        { label: "HTTPS Everywhere", desc: "All communications between your browser and Lumora servers are encrypted end-to-end." },
                        { label: "Password Hashing", desc: "Passwords are never stored in plain text. They are hashed using bcrypt with strong salt rounds." },
                        { label: "Secure Authentication", desc: "Authentication uses HTTP-only, secure cookies. OAuth flows use industry-standard protocols." },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                          <p className="text-foreground text-xs font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground/70 mt-0.5">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-muted-foreground">
                      While we take every reasonable precaution, no method of electronic storage or transmission is 100% secure. We cannot guarantee absolute security.
                    </p>
                  </Section>

                  <Section id="user-rights" title="User Rights" icon={Users}>
                    <p className="mb-3 font-medium text-foreground">You have full control over your data. You can:</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { action: "Delete account", desc: "Permanently remove your account and all associated data from our systems." },
                        { action: "Export data", desc: "Request a copy of all personal data we hold about you." },
                        { action: "Update profile", desc: "Modify your name, bio, timezone, country, and profile image at any time." },
                        { action: "Delete portfolio", desc: "Remove your portfolio holdings individually or entirely." },
                        { action: "Delete watchlist", desc: "Remove stocks from your watchlist at any time." },
                        { action: "Delete saved analyses", desc: "Remove individual saved analysis reports from your account." },
                      ].map((item) => (
                        <div key={item.action} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                          <div className="rounded-lg bg-white/[0.05] p-1.5 shrink-0 mt-0.5">
                            <Users className="h-3.5 w-3.5 text-muted-foreground/60" />
                          </div>
                          <div>
                            <p className="text-foreground text-xs font-medium">{item.action}</p>
                            <p className="text-xs text-muted-foreground/70 mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4">
                      Most of these actions can be performed directly through your profile settings. For data export or any other requests, contact us at the email below.
                    </p>
                  </Section>

                  <Section id="children" title="Children" icon={AlertTriangle}>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
                      <p>
                        Lumora is <strong>not intended for users under the age of 18</strong>. We do not knowingly collect personal information from individuals under 18 years of age.
                      </p>
                      <p className="mt-3">
                        If we become aware that a user under 18 has provided us with personal information, we will take steps to delete that information and terminate the account. If you believe a minor has provided us with personal data, please contact us immediately.
                      </p>
                    </div>
                  </Section>

                  <Section id="changes" title="Changes to This Policy" icon={FileTextIcon}>
                    <p>
                      We may update this Privacy Policy from time to time. Material changes will be notified via email or through the Lumora application.
                    </p>
                    <p className="mt-4">
                      Your continued use of Lumora after changes take effect constitutes your acceptance of the updated policy. If you do not agree with any changes, you should stop using the Service and delete your account.
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      The latest version of this policy will always be available at this page with the &ldquo;Last updated&rdquo; date.
                    </p>
                  </Section>

                  <Section id="contact" title="Contact" icon={Mail}>
                    <p>
                      If you have questions about this Privacy Policy, your data, or would like to exercise any of your rights, please contact us:
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
                  <Link href="/terms" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors">Terms &amp; Conditions</Link>
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

function FileTextIcon(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}
