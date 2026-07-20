import Link from "next/link"
import { LandingNav } from "@/components/landing-nav"
import { HeroParallax } from "@/components/hero-parallax"
import { StatsSection } from "@/components/stats-section"
import { HowItWorks } from "@/components/how-it-works"
import { FadeScale, FadeUp, CardReveal } from "@/components/reveal"

const EXCHANGES = [
  ["NYSE", "USA"], ["NASDAQ", "USA"], ["NSE", "India"], ["BSE", "India"],
  ["LSE", "UK"], ["TSE", "Japan"], ["FSE", "Germany"], ["HKEX", "HK"],
  ["ASX", "Australia"], ["SSE", "China"], ["TSX", "Canada"], ["Euronext", "EU"],
]

const CAPABILITIES = [
  {
    number: "01",
    title: "Multi-Exchange Data",
    desc: "Real-time feeds from 60+ exchanges across 40+ countries. One connection.",
  },
  {
    number: "02",
    title: "AI-Powered Analysis",
    desc: "Every insight explained in plain language. Know why behind the move.",
  },
  {
    number: "03",
    title: "Portfolio Oversight",
    desc: "Track holdings, watchlists, and risk — all in one place.",
  },
  {
    number: "04",
    title: "Smart Trade Planning",
    desc: "AI-assisted plans with clear risk/reward and confidence scoring.",
  },
]

export default async function HomePage() {
  return (
    <>
      <LandingNav />

      {/* Hero */}
      <HeroParallax />

      {/* How It Works */}
      <section className="scene" style={{ background: "var(--bg-alt)" }}>
        <FadeScale>
          <HowItWorks />
        </FadeScale>
      </section>

      {/* Stats + Exchanges */}
      <section className="scene" id="reach">
        <FadeScale>
          <p className="subheading mb-6 text-center">Global coverage</p>
          <StatsSection />
        </FadeScale>

        <FadeUp delay={0.2}>
          <div className="mt-10">
            <p className="meta mb-4 text-center">Supported exchanges</p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXCHANGES.map(([ex, country]) => (
                <span key={ex} className="pill">
                  <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{ex}</span>
                  <span className="text-[10px]">{country}</span>
                </span>
              ))}
            </div>
          </div>
        </FadeUp>
      </section>

      {/* Capabilities — asymmetric editorial grid */}
      <section className="scene" id="offerings" style={{ background: "var(--bg-alt)" }}>
        <FadeUp>
          <p className="subheading">Platform capabilities</p>
          <h2 className="title mt-3">Built for the modern desk</h2>
        </FadeUp>

        <div className="relative mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {CAPABILITIES.map((item, i) => (
            <CardReveal key={item.number} delay={0.1 + i * 0.08} index={i}>
              <div className="flex h-full flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-7 transition-colors duration-300 hover:border-[var(--gold-line)]">
                <div className="flex items-center justify-between">
                  <span className="meta" style={{ color: "var(--gold)" }}>{item.number}</span>
                  <span className="h-px flex-1 ml-4" style={{ background: "linear-gradient(90deg, var(--gold-line), transparent)" }} />
                </div>
                <h3 className="heading-sm mt-2">{item.title}</h3>
                <p className="body mt-1">{item.desc}</p>
              </div>
            </CardReveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="scene">
        <FadeScale delay={0.1}>
          <div className="bento-card relative mx-auto flex w-full max-w-2xl flex-col items-center overflow-hidden px-10 py-14 text-center">
            <div className="pointer-events-none absolute -inset-24 opacity-50" style={{ background: "radial-gradient(circle at 50% 0%, var(--gold-glow-strong), transparent 60%)" }} />
            <span className="dot-gold" />
            <h2 className="title mt-4">Ready to see clearly?</h2>
            <p className="body mt-4 text-center">
              Join Lumora and transform how you understand global markets.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/sign-up" className="btn btn--gold">Get started free</Link>
              <Link href="/markets" className="btn">Explore dashboard</Link>
            </div>
          </div>
        </FadeScale>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--line)", background: "var(--bg)" }}>
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-14 text-center">
          <span className="font-serif text-2xl" style={{ color: "var(--text-primary)" }}>Lumora</span>
          <p className="meta mt-2">AI-powered global market intelligence</p>
          <div className="mt-6 flex gap-6">
            <Link href="/privacy" className="nav-link">Privacy</Link>
            <Link href="/terms" className="nav-link">Terms</Link>
            <Link href="/markets" className="nav-link">Markets</Link>
          </div>
          <div className="mt-8 w-full max-w-xs pt-6" style={{ borderTop: "1px solid var(--line)" }}>
            <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              Designed &amp; developed by Lokesh &middot;{" "}
              <a href="mailto:lumora.verify@gmail.com" style={{ color: "var(--gold)" }}>lumora.verify@gmail.com</a>
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
