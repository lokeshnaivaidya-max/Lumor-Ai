import Link from "next/link"

export default async function HomePage() {
  return (
    <>
      {/* Scene 1 — Title card */}
      <section className="lm-scene">
        <div className="lm-light" />
        <div className="lm-container">
          <div className="lm-animate" style={{ maxWidth: 800, marginLeft: "auto", marginRight: "auto" }}>
            <hr className="lm-rule lm-rule--gold lm-animate lm-animate--delay-1" style={{ marginBottom: "2.5rem" }} />
            <h1 className="lm-display" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              Lumora
            </h1>
            <p className="lm-body lm-body--large" style={{ textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
              Market intelligence, distilled.
            </p>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: "2.5rem", left: 0, right: 0, textAlign: "center" }}>
          <span className="lm-caption" style={{ display: "inline-block", animation: "lm-fade-up 1.4s 1.5s both" }}>
            Scroll
          </span>
        </div>
      </section>

      {/* Scene 2 — Insight */}
      <section className="lm-scene lm-scene--dark">
        <div className="lm-light lm-light--right" />
        <div className="lm-container lm-container--narrow">
          <p className="lm-meta lm-animate lm-animate--delay-1" style={{ marginBottom: "1.5rem" }}>
            The problem
          </p>
          <blockquote className="lm-title lm-title--large lm-animate lm-animate--delay-2" style={{ margin: 0, border: "none", padding: 0 }}>
            Markets are the loudest when clarity matters most.
          </blockquote>
          <div className="lm-animate lm-animate--delay-3" style={{ marginTop: "3rem" }}>
            <hr className="lm-rule" style={{ marginBottom: "1.5rem" }} />
            <p className="lm-body" style={{ maxWidth: 420 }}>
              Noise isn't information. Yet every trading day, millions of signals compete for attention. Lumora cuts through — not by adding more data, but by finding what matters.
            </p>
          </div>
        </div>
      </section>

      {/* Scene 3 — What it does */}
      <section className="lm-scene" style={{ paddingTop: "8rem", paddingBottom: "8rem" }}>
        <div className="lm-container lm-container--narrow">
          <p className="lm-meta lm-animate" style={{ marginBottom: "4rem" }}>
            What Lumora does
          </p>

          {/* Offering 1 — simple, spacious */}
          <div className="lm-animate lm-animate--delay-1" style={{ marginBottom: "6rem" }}>
            <p className="lm-heading" style={{ marginBottom: "0.75rem" }}>
              Listens across 60+ exchanges.
            </p>
            <p className="lm-body" style={{ maxWidth: 380 }}>
              Real-time data from every major market. One unified feed. No delays, no noise.
            </p>
          </div>

          {/* Offering 2 — tighter, different spacing */}
          <div className="lm-animate lm-animate--delay-2" style={{ marginBottom: "6rem", paddingLeft: "2rem", borderLeft: "1px solid rgba(232,228,221,0.08)" }}>
            <p className="lm-heading" style={{ marginBottom: "0.75rem" }}>
              Thinks before it speaks.
            </p>
            <p className="lm-body" style={{ maxWidth: 380 }}>
              AI analysis that explains its reasoning. Not black-box predictions — transparent, grounded, and contextual.
            </p>
          </div>

          {/* Offering 3 — offset, different treatment */}
          <div className="lm-animate lm-animate--delay-3" style={{ textAlign: "right" }}>
            <p className="lm-heading" style={{ marginBottom: "0.75rem" }}>
              Puts you in control.
            </p>
            <p className="lm-body" style={{ maxWidth: 380, marginLeft: "auto" }}>
              Portfolio intelligence, risk tracking, and trade planning — tools that inform decisions without making them for you.
            </p>
          </div>
        </div>
      </section>

      {/* Scene 4 — Reach */}
      <section className="lm-scene lm-scene--tight" style={{ alignItems: "flex-start", justifyContent: "flex-start", paddingTop: "8rem" }}>
        <div className="lm-light" />
        <div className="lm-container lm-container--wide">
          <p className="lm-meta lm-animate" style={{ marginBottom: "0.5rem" }}>
            Reach
          </p>
          <div className="lm-animate lm-animate--delay-1" style={{ marginBottom: "4rem" }}>
            <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
              <div>
                <p className="lm-stat">60+</p>
                <p className="lm-stat-label">Exchanges</p>
              </div>
              <div>
                <p className="lm-stat">12K</p>
                <p className="lm-stat-label">Instruments</p>
              </div>
              <div>
                <p className="lm-stat">40+</p>
                <p className="lm-stat-label">Countries</p>
              </div>
              <div>
                <p className="lm-stat">500B+</p>
                <p className="lm-stat-label">Data points</p>
              </div>
            </div>
          </div>
          <p className="lm-caption lm-animate lm-animate--delay-2" style={{ marginBottom: "1rem" }}>
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
      <section className="lm-scene lm-scene--short" style={{ justifyContent: "center", paddingTop: "6rem", paddingBottom: "6rem" }}>
        <div className="lm-container lm-container--narrow" style={{ textAlign: "center" }}>
          <hr className="lm-rule lm-rule--gold lm-animate" style={{ margin: "0 auto 2rem" }} />
          <h2 className="lm-heading lm-animate lm-animate--delay-1" style={{ marginBottom: "2rem" }}>
            See the market clearly.
          </h2>
          <div className="lm-animate lm-animate--delay-2">
            <Link href="/sign-up" className="lm-link lm-link--gold">
              Get started
              <span style={{ display: "inline-block", transition: "transform 0.3s" }}>→</span>
            </Link>
          </div>
          <p className="lm-caption lm-animate lm-animate--delay-3" style={{ marginTop: "5rem" }}>
            <Link href="/markets" className="lm-caption" style={{ color: "#5a5650", textDecoration: "none", transition: "color 0.3s" }}>
              Explore markets without an account →
            </Link>
          </p>
        </div>
      </section>
    </>
  )
}
