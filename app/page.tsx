import Link from "next/link"
import { LandingNav } from "@/components/landing-nav"
import { HeroParallax } from "@/components/hero-parallax"
import { StatsSection } from "@/components/stats-section"

const EXCHANGES = [
  ["NYSE", "USA"], ["NASDAQ", "USA"], ["NSE", "India"], ["BSE", "India"],
  ["LSE", "UK"], ["TSE", "Japan"], ["FSE", "Germany"], ["HKEX", "HK"],
  ["ASX", "Australia"], ["SSE", "China"], ["TSX", "Canada"], ["Euronext", "EU"],
]

const INSIGHTS = [
  {
    number: "01",
    title: "Multi-Exchange Coverage",
    desc: "Real-time data from over 60 exchanges across 40+ countries. One unified feed, no delays, no gaps.",
  },
  {
    number: "02",
    title: "AI-Powered Analysis",
    desc: "Every insight is explained in plain language. Know not just what the market is doing, but why.",
  },
  {
    number: "03",
    title: "Portfolio Intelligence",
    desc: "Track holdings, watchlists, and risk metrics in real time. Make decisions backed by data, not noise.",
  },
  {
    number: "04",
    title: "Smart Trade Planning",
    desc: "AI-assisted trade plans with risk/reward analysis, position sizing, and confidence scoring built in.",
  },
]

export default async function HomePage() {
  return (
    <>
      <LandingNav />

      {/* Hero */}
      <section className="scene">
        <div className="ambient" />
        <HeroParallax />
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <span className="meta" style={{ opacity: 0.3 }}>&#x25BC;</span>
        </div>
      </section>

      {/* Stats / Proof */}
      <section className="scene" style={{ background: "var(--depth-surface)" }}>
        <div className="ambient" />
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <p className="subheading animate-fade-up">Global Coverage</p>
          <div className="mt-6 animate-fade-up delay-1">
            <StatsSection />
          </div>
          <div className="mt-10 animate-fade-up delay-3">
            <p className="meta mb-3">Supported exchanges</p>
            <div className="flex flex-wrap gap-4">
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
        </div>
      </section>

      {/* Features Grid */}
      <section className="scene" id="offerings">
        <div className="ambient" />
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <p className="subheading animate-fade-up">Platform Capabilities</p>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {INSIGHTS.map((item, i) => (
              <div
                key={item.number}
                className="glass-card animate-fade-up rounded-2xl p-6"
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              >
                <p className="meta text-[10px]" style={{ color: "var(--gold)" }}>{item.number}</p>
                <h3 className="heading heading--small mt-2">{item.title}</h3>
                <p className="body mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="scene" style={{ background: "var(--depth-surface)" }}>
        <div className="ambient" />
        <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center text-center">
          <div className="rule animate-fade-up mb-6" />
          <h2 className="title animate-fade-up delay-1 mb-4">
            Ready to see the market clearly?
          </h2>
          <p className="body animate-fade-up delay-2 text-center mb-8">
            Join Lumora and transform how you understand global markets.
          </p>
          <div className="flex gap-3 animate-fade-up delay-3">
            <Link href="/sign-up" className="btn btn--gold">Get started free</Link>
            <Link href="/markets" className="btn">Explore dashboard</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12" style={{ borderColor: "var(--glass-border)" }}>
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
          <p className="font-serif text-2xl italic" style={{ color: "var(--text-primary)" }}>Lumora</p>
          <p className="meta mt-2">AI-powered global market intelligence</p>
          <div className="mt-6 flex gap-6">
            <Link href="/privacy" className="nav-link">Privacy</Link>
            <Link href="/terms" className="nav-link">Terms</Link>
            <Link href="/markets" className="nav-link">Markets</Link>
          </div>
          <div className="mt-8 border-t pt-6" style={{ borderColor: "var(--glass-border)", width: "100%", maxWidth: 320 }}>
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
