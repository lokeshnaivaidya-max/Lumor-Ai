"use client"

import { motion } from "motion/react"
import { Reveal } from "./reveal"
import { CountUp } from "./count-up"

const exchanges = [
  "NYSE", "NASDAQ", "LSE", "TSE", "HKEX", "SSE", "Euronext", "NSE",
  "BSE", "TSX", "ASX", "SIX", "JSE", "B3", "KRX", "TWSE",
]

const stats = [
  { to: 60, suffix: "+", label: "Global exchanges" },
  { to: 40, suffix: "k+", label: "Tradable symbols" },
  { to: 2, prefix: "<", suffix: "s", label: "AI analysis latency" },
  { to: 24, suffix: "/7", label: "Market monitoring" },
]

export function Coverage() {
  return (
    <section id="coverage" className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase">
              Truly global
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              One terminal for{" "}
              <span className="font-serif italic font-normal text-gradient-aurora">
                every market
              </span>{" "}
              on earth.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              Lumora detects your region and instantly tailors exchange,
              currency, timezone and session hours — while keeping the whole
              planet a single search away.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-4xl font-semibold tracking-tight text-gradient tabular-nums">
                    <CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} />
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative flex flex-wrap gap-3">
              {/* soft glow behind the field */}
              <div
                className="animate-pulse-glow pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
                style={{ background: "oklch(0.6 0.17 250 / 0.35)" }}
              />
              {exchanges.map((e, i) => (
                <motion.span
                  key={e}
                  initial={{ opacity: 0, scale: 0.85, y: 8 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.08, y: -4 }}
                  className="animate-float relative rounded-full glass px-4 py-2 font-mono text-sm text-foreground/80 transition-colors hover:text-foreground"
                  style={{ animationDelay: `${(i % 6) * -1.3}s` }}
                >
                  {e}
                </motion.span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
