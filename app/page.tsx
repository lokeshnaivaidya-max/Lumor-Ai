import Link from "next/link"
import { LandingNav } from "@/components/landing-nav"
import { HeroParallax } from "@/components/hero-parallax"
import { StatsSection } from "@/components/stats-section"

const EXCHANGES = [
  ["NYSE", "USA"], ["NASDAQ", "USA"], ["NSE", "India"], ["BSE", "India"],
  ["LSE", "UK"], ["TSE", "Japan"], ["FSE", "Germany"], ["HKEX", "HK"],
  ["ASX", "Australia"], ["SSE", "China"], ["TSX", "Canada"], ["Euronext", "EU"],
]

const CAPABILITIES = [
  {
    number: "01",
    title: "Multi-Exchange Coverage",
    desc: "Real-time data from over 60 exchanges across 40+ countries. One unified feed, no delays.",
  },
  {
    number: "02",
    title: "AI-Powered Analysis",
    desc: "Every insight explained in plain language. Know not just what the market is doing, but why.",
  },
  {
    number: "03",
    title: "Portfolio Intelligence",
    desc: "Track holdings, watchlists, and risk metrics in real time. Decisions backed by data.",
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
      <section
        className="scene"
        style={{
          background: "linear-gradient(180deg, var(--depth-bg) 0%, var(--depth-surface) 100%)",
        }}
      >
        <div className="ambient" />
        <HeroParallax />
      </section>

      {/* Stats / Proof */}
      <section className="scene" style={{ background: "var(--depth-surface)" }}>
        <div className="ambient" />
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <div className="animate-fade-up">
            <StatsSection />
          </div>
          <div className="mt-10 animate-fade-up delay-3">
            <p className="meta mb-4">Supported exchanges</p>
            <div className="flex flex-wrap gap-3">
              {EXCHANGES.map(([ex, country]) => (
                <span
                  key={ex}
                  className="flex items-center gap-2 rounded-lg border px-3 py-1.5"
                  style={{
                    borderColor: "var(--glass-border)",
                    background: "var(--glass-base)",
                    boxShadow: "0 2px 8px -4px rgba(0,0,0,0.2)",
                  }}
                >
                  <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{ex}</span>
                  <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{country}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="scene" id="offerings" style={{ background: "var(--depth-bg)" }}>
        <div className="ambient" />
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <p className="subheading animate-fade-up">Platform capabilities</p>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            {CAPABILITIES.map((item, i) => (
              <div
                key={item.number}
                className="animate-fade-up rounded-2xl border p-6"
                style={{
                  animationDelay: `${0.1 + i * 0.08}s`,
                  borderColor: "var(--glass-border)",
                  background: "linear-gradient(160deg, var(--glass-base), transparent 70%)",
                  backdropFilter: "blur(24px)",
                  boxShadow: "0 8px 32px -12px rgba(0,0,0,0.4)",
                }}
              >
                <span className="text-[10px] font-semibold tracking-widest" style={{ color: "var(--gold)" }}>{item.number}</span>
                <h3 className="heading heading--small mt-3">{item.title}</h3>
                <p className="body mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="scene"
        style={{
          background: "linear-gradient(180deg, var(--depth-surface), var(--depth-bg))",
        }}
      >
        <div className="ambient" />
        <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center text-center">
          <div
            className="mb-6 h-px w-10"
            style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)", opacity: 0.6 }}
          />
          <h2 className="title animate-fade-up mb-4">
            Ready to see the market clearly?
          </h2>
          <p className="body animate-fade-up delay-1 text-center mb-8">
            Join Lumora and transform how you understand global markets.
          </p>
          <div className="flex gap-3 animate-fade-up delay-2">
            <Link href="/sign-up" className="btn btn--gold">Get started free</Link>
            <Link href="/markets" className="btn">Explore dashboard</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-14" style={{ borderColor: "var(--glass-border)" }}>
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
