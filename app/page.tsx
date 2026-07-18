import Link from "next/link"
import { LandingNav } from "@/components/landing-nav"
import { HeroParallax } from "@/components/hero-parallax"
import { StatsSection } from "@/components/stats-section"
import { SceneReveal, CardReveal } from "@/components/reveal"

const EXCHANGES = [
  ["NYSE", "USA"], ["NASDAQ", "USA"], ["NSE", "India"], ["BSE", "India"],
  ["LSE", "UK"], ["TSE", "Japan"], ["FSE", "Germany"], ["HKEX", "HK"],
  ["ASX", "Australia"], ["SSE", "China"], ["TSX", "Canada"], ["Euronext", "EU"],
]

const CAPABILITIES = [
  {
    number: "01",
    title: "Multi-Exchange Coverage",
    desc: "Real-time data from over 60 exchanges across 40+ countries. One unified feed.",
  },
  {
    number: "02",
    title: "AI-Powered Analysis",
    desc: "Every insight explained in plain language. Know not just what, but why.",
  },
  {
    number: "03",
    title: "Portfolio Intelligence",
    desc: "Track holdings, watchlists, and risk metrics. Decisions backed by data.",
  },
  {
    number: "04",
    title: "Smart Trade Planning",
    desc: "AI-assisted trade plans with risk/reward analysis and confidence scoring.",
  },
]

export default async function HomePage() {
  return (
    <>
      <LandingNav />

      {/* Hero */}
      <section className="scene" style={{ background: "var(--bg-deep)" }}>
        <HeroParallax />
      </section>

      {/* Stats / Proof */}
      <section className="scene" id="reach" style={{ background: "var(--bg-surface)" }}>
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <SceneReveal>
            <p className="subheading mb-6">Global coverage</p>
            <StatsSection />
          </SceneReveal>
          <SceneReveal delay={0.2}>
            <div className="mt-12">
              <p className="meta mb-4">Supported exchanges</p>
              <div className="flex flex-wrap gap-3">
                {EXCHANGES.map(([ex, country]) => (
                  <span
                    key={ex}
                    className="glass-card flex items-center gap-2 rounded-lg px-3 py-1.5"
                  >
                    <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{ex}</span>
                    <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{country}</span>
                  </span>
                ))}
              </div>
            </div>
          </SceneReveal>
        </div>
      </section>

      {/* Features */}
      <section className="scene" id="offerings" style={{ background: "var(--bg-deep)" }}>
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <SceneReveal>
            <p className="subheading">Platform capabilities</p>
          </SceneReveal>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            {CAPABILITIES.map((item, i) => (
              <CardReveal key={item.number} delay={0.1 + i * 0.08}>
                {item.number && (
                  <span className="meta" style={{ color: "var(--gold)" }}>{item.number}</span>
                )}
                <h3 className="heading--small mt-3">{item.title}</h3>
                <p className="body mt-2">{item.desc}</p>
              </CardReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="scene" style={{ background: "var(--bg-surface)" }}>
        <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center text-center">
          <SceneReveal>
            <div
              className="mb-6 h-px w-10"
              style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)", opacity: 0.6 }}
            />
            <h2 className="title mb-4">Ready to see the market clearly?</h2>
            <p className="body text-center mx-auto mb-8">
              Join Lumora and transform how you understand global markets.
            </p>
            <div className="flex gap-3">
              <Link href="/sign-up" className="btn btn--gold">Get started free</Link>
              <Link href="/markets" className="btn">Explore dashboard</Link>
            </div>
          </SceneReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-14" style={{ borderColor: "var(--glass-border)", background: "var(--bg-deep)" }}>
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
          <p className="font-serif text-2xl italic" style={{ color: "var(--text-primary)" }}>Lumora</p>
          <p className="meta mt-2">AI-powered global market intelligence</p>
          <div className="mt-6 flex gap-6">
            <Link href="/privacy" className="nav-link">Privacy</Link>
            <Link href="/terms" className="nav-link">Terms</Link>
            <Link href="/markets" className="nav-link">Markets</Link>
          </div>
          <div className="mt-8 w-full max-w-xs border-t pt-6" style={{ borderColor: "var(--glass-border)" }}>
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
