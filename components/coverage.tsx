"use client"

import { Reveal } from "./reveal"

const exchanges = [
  "NYSE", "NASDAQ", "LSE", "TSE", "HKEX", "SSE", "Euronext", "NSE",
  "BSE", "TSX", "ASX", "SIX", "JSE", "B3", "KRX", "TWSE",
]

const stats = [
  { k: "60+", v: "Global exchanges" },
  { k: "40k+", v: "Tradable symbols" },
  { k: "<2s", v: "AI analysis latency" },
  { k: "24/7", v: "Market monitoring" },
]

export function Coverage() {
  return (
    <section id="coverage" className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <p className="font-mono text-xs tracking-widest text-accent uppercase">
              Truly global
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              One terminal for{" "}
              <span className="font-serif italic font-normal">every market</span>{" "}
              on earth.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              Lumora detects your region and instantly tailors exchange,
              currency, timezone and session hours — while keeping the whole
              planet a single search away.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-6">
              {stats.map((s) => (
                <div key={s.v}>
                  <div className="text-3xl font-semibold tracking-tight text-gradient">
                    {s.k}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{s.v}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative flex flex-wrap gap-3">
              {exchanges.map((e, i) => (
                <span
                  key={e}
                  className="animate-float rounded-full glass px-4 py-2 font-mono text-sm text-foreground/80"
                  style={{ animationDelay: `${(i % 6) * -1.1}s` }}
                >
                  {e}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
