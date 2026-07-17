import Link from "next/link"
import { LandingNav } from "@/components/landing-nav"
import { HeroParallax } from "@/components/hero-parallax"
import { StatsSection } from "@/components/stats-section"

export default async function HomePage() {
  return (
    <>
      <LandingNav />

      {/* Scene 1 — Title card */}
      <section className="lm-scene lm-scene--hero">
        <div className="lm-light lm-ambient" />
        <div className="lm-vignette" />
        <HeroParallax />
        <div style={{ position: "absolute", bottom: "2.5rem", left: 0, right: 0, textAlign: "center" }}>
          <span className="lm-caption" style={{ display: "inline-block", animation: "lm-fade-up 1.4s 1.5s both" }}>
            Scroll
          </span>
        </div>
      </section>

      {/* Scene 2 — Insight */}
      <section className="lm-scene lm-scene--dark lm-scene--insight">
        <div className="lm-light lm-light--right lm-ambient" />
        <div className="lm-vignette" />
        <div className="lm-container lm-container--narrow">
          <p className="lm-meta lm-animate lm-animate--delay-1" style={{ marginBottom: "1.5rem" }}>
            The problem
          </p>
          <h2 className="lm-title lm-title--large lm-animate lm-animate--delay-2" style={{ margin: 0, border: "none", padding: 0 }}>
            Markets are the loudest when clarity matters most.
          </h2>
          <div className="lm-animate lm-animate--delay-3" style={{ marginTop: "3rem" }}>
            <hr className="lm-rule" style={{ marginBottom: "1.5rem" }} />
            <p className="lm-body" style={{ maxWidth: 420 }}>
              Noise isn't information. Yet every trading day, millions of signals compete for attention. Lumora cuts through — not by adding more data, but by finding what matters.
            </p>
          </div>
        </div>
      </section>

      {/* Scene 3 — Offerings */}
      <section className="lm-scene lm-scene--offerings" id="offerings">
        <div className="lm-light lm-ambient" />
        <div className="lm-container lm-container--narrow">
          <p className="lm-meta lm-animate" style={{ marginBottom: "4rem" }}>
            What Lumora does
          </p>

          {/* 1 — spacious, centered */}
          <div className="lm-animate lm-animate--delay-1" style={{ marginBottom: "6rem", maxWidth: 500 }}>
            <p className="lm-heading" style={{ marginBottom: "0.75rem", fontSize: "clamp(1.5rem, 3.5vw, 3rem)" }}>
              Listens across 60+ exchanges.
            </p>
            <p className="lm-body" style={{ maxWidth: 380 }}>
              Real-time data from every major market. One unified feed. No delays, no noise.
            </p>
          </div>

          {/* 2 — offset right, bordered */}
          <div className="lm-animate lm-animate--delay-2" style={{ marginBottom: "6rem", paddingLeft: "2rem", borderLeft: "1px solid rgba(232,228,221,0.08)", marginLeft: "auto", maxWidth: 500 }}>
            <p className="lm-heading" style={{ marginBottom: "0.75rem", fontSize: "clamp(1.5rem, 3.5vw, 3rem)" }}>
              Thinks before it speaks.
            </p>
            <p className="lm-body" style={{ maxWidth: 380 }}>
              AI analysis that explains its reasoning. Not black-box predictions — transparent, grounded, and contextual.
            </p>
          </div>

          {/* 3 — left, compact */}
          <div className="lm-animate lm-animate--delay-3" style={{ maxWidth: 440 }}>
            <p className="lm-heading" style={{ marginBottom: "0.75rem", fontSize: "clamp(1.5rem, 3.5vw, 3rem)" }}>
              Puts you in control.
            </p>
            <p className="lm-body" style={{ maxWidth: 380 }}>
              Portfolio intelligence, risk tracking, and trade planning — tools that inform decisions without making them for you.
            </p>
          </div>
        </div>
      </section>

      {/* Scene 4 — Reach */}
      <section className="lm-scene lm-scene--dark lm-scene--reach" id="reach">
        <div className="lm-light lm-ambient" />
        <div className="lm-vignette" />
        <div className="lm-container lm-container--wide">
          <p className="lm-meta lm-animate" style={{ marginBottom: "2rem" }}>
            Reach
          </p>
          <StatsSection />
          <p className="lm-caption lm-animate lm-animate--delay-2" style={{ marginTop: "3rem", marginBottom: "1rem" }}>
            Exchanges tracked
          </p>
          <div className="lm-ticker lm-animate lm-animate--delay-3">
            <span className="lm-exchange"><strong>NYSE</strong> USA</span>
            <span className="lm-exchange"><strong>NASDAQ</strong> USA</span>
            <span className="lm-exchange"><strong>NSE</strong> India</span>
            <span className="lm-exchange"><strong>BSE</strong> India</span>
            <span className="lm-exchange"><strong>LSE</strong> UK</span>
            <span className="lm-exchange"><strong>TSE</strong> Japan</span>
            <span className="lm-exchange"><strong>FSE</strong> Germany</span>
            <span className="lm-exchange"><strong>HKEX</strong> HK</span>
            <span className="lm-exchange"><strong>ASX</strong> Australia</span>
            <span className="lm-exchange"><strong>SSE</strong> China</span>
            <span className="lm-exchange"><strong>TSX</strong> Canada</span>
            <span className="lm-exchange"><strong>Euronext</strong> EU</span>
          </div>
        </div>
      </section>

      {/* Scene 5 — Closing */}
      <section className="lm-scene lm-scene--closing">
        <div className="lm-light lm-light--right lm-ambient" />
        <div className="lm-vignette" />
        <div className="lm-container lm-container--narrow" style={{ textAlign: "center" }}>
          <hr className="lm-rule lm-rule--gold lm-animate" style={{ margin: "0 auto 2.5rem" }} />
          <h2 className="lm-title lm-animate lm-animate--delay-1" style={{ marginBottom: "1rem" }}>
            See the market clearly.
          </h2>
          <p className="lm-body lm-animate lm-animate--delay-2" style={{ margin: "0 auto 2.5rem", maxWidth: 360, textAlign: "center" }}>
            No noise. No clutter. Just signal.
          </p>
          <div className="lm-animate lm-animate--delay-3" style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <Link href="/sign-up" className="lm-btn lm-btn--gold">
              Get started
            </Link>
            <Link href="/markets" className="lm-btn">
              Explore markets
            </Link>
          </div>
        </div>
      </section>

      {/* Scene 6 — Footer / Closing title card */}
      <footer className="lm-footer">
        <div className="lm-footer__inner">
          <hr className="lm-rule lm-rule--gold" style={{ margin: "0 auto 1.5rem" }} />
          <p className="lm-display lm-display--small" style={{ marginBottom: "0.75rem" }}>
            Lumora
          </p>
          <p className="lm-caption" style={{ marginBottom: "1.5rem" }}>
            Market intelligence, distilled.
          </p>
          <div className="lm-footer__links">
            <Link href="/privacy" className="lm-footer__link">Privacy</Link>
            <Link href="/terms" className="lm-footer__link">Terms</Link>
            <Link href="/markets" className="lm-footer__link">Markets</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
