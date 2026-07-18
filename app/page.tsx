import Link from "next/link"
import { LandingNav } from "@/components/landing-nav"
import { HeroParallax } from "@/components/hero-parallax"
import { StatsSection } from "@/components/stats-section"

export default async function HomePage() {
  return (
    <>
      <LandingNav />

      {/* Hero */}
      <section className="scene">
        <div className="ambient" />
        <HeroParallax />
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <span className="meta animate-pulse-glow">Scroll</span>
        </div>
      </section>

      {/* Problem */}
      <section className="scene" style={{ background: "var(--depth-surface)" }}>
        <div className="ambient" />
        <div className="relative z-10 mx-auto w-full max-w-2xl">
          <p className="subheading animate-fade-up">The problem</p>
          <h2 className="title title--large mt-4 animate-fade-up delay-2">
            Markets are the loudest when clarity matters most.
          </h2>
          <div className="mt-10 animate-fade-up delay-3">
            <div className="rule mb-4" />
            <p className="body" style={{ maxWidth: 420 }}>
              Noise isn&apos;t information. Yet every trading day, millions of signals compete for
              attention. Lumora cuts through — not by adding more data, but by finding what matters.
            </p>
          </div>
        </div>
      </section>

      {/* Offerings */}
      <section className="scene" id="offerings">
        <div className="ambient" />
        <div className="relative z-10 mx-auto w-full max-w-2xl">
          <p className="subheading animate-fade-up">What Lumora does</p>

          <div className="mt-12 space-y-16">
            <div className="animate-fade-up delay-1" style={{ maxWidth: 500 }}>
              <h3 className="heading" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.75rem)" }}>
                Listens across 60+ exchanges.
              </h3>
              <p className="body mt-3" style={{ maxWidth: 380 }}>
                Real-time data from every major market. One unified feed. No delays, no noise.
              </p>
            </div>

            <div className="animate-fade-up delay-2 ml-auto" style={{ maxWidth: 500, paddingLeft: "2rem", borderLeft: "1px solid var(--glass-border)" }}>
              <h3 className="heading" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.75rem)" }}>
                Thinks before it speaks.
              </h3>
              <p className="body mt-3" style={{ maxWidth: 380 }}>
                AI analysis that explains its reasoning. Not black-box predictions — transparent,
                grounded, and contextual.
              </p>
            </div>

            <div className="animate-fade-up delay-3" style={{ maxWidth: 440 }}>
              <h3 className="heading" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.75rem)" }}>
                Puts you in control.
              </h3>
              <p className="body mt-3" style={{ maxWidth: 380 }}>
                Portfolio intelligence, risk tracking, and trade planning — tools that inform
                decisions without making them for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reach */}
      <section className="scene" id="reach" style={{ background: "var(--depth-surface)" }}>
        <div className="ambient" />
        <div className="relative z-10 mx-auto w-full max-w-4xl">
          <p className="subheading animate-fade-up">Reach</p>
          <div className="mt-6">
            <StatsSection />
          </div>
          <p className="meta mt-10 animate-fade-up delay-2">Exchanges tracked</p>
          <div className="mt-4 flex gap-8 overflow-x-auto animate-fade-up delay-3" style={{ scrollbarWidth: "none", paddingBottom: "1rem" }}>
            {[
              ["NYSE", "USA"], ["NASDAQ", "USA"], ["NSE", "India"], ["BSE", "India"],
              ["LSE", "UK"], ["TSE", "Japan"], ["FSE", "Germany"], ["HKEX", "HK"],
              ["ASX", "Australia"], ["SSE", "China"], ["TSX", "Canada"], ["Euronext", "EU"],
            ].map(([ex, country]) => (
              <span key={ex} className="flex-shrink-0 text-sm" style={{ color: "var(--text-tertiary)" }}>
                <strong style={{ color: "var(--text-secondary)" }}>{ex}</strong> {country}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="scene">
        <div className="ambient" />
        <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center text-center">
          <div className="rule rule--light animate-fade-up mb-8" />
          <h2 className="title animate-fade-up delay-1 mb-4">
            See the market clearly.
          </h2>
          <p className="body animate-fade-up delay-2 text-center" style={{ maxWidth: 360 }}>
            No noise. No clutter. Just signal.
          </p>
          <div className="mt-8 flex gap-3 animate-fade-up delay-3">
            <Link href="/sign-up" className="btn btn--gold">Get started</Link>
            <Link href="/markets" className="btn">Explore markets</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12" style={{ borderColor: "var(--glass-border)" }}>
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
          <div className="rule rule--light mb-4" />
          <p className="display display--small mb-2">Lumora</p>
          <p className="meta mb-6">Market intelligence, distilled.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="nav-link">Privacy</Link>
            <Link href="/terms" className="nav-link">Terms</Link>
            <Link href="/markets" className="nav-link">Markets</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
