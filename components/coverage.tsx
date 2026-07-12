"use client"

import { motion } from "motion/react"
import { CountUp } from "./count-up"

const EXCHANGES = [
  "NYSE", "NASDAQ", "NSE", "BSE", "LSE", "TSE", "HKEX", "ASX", "FWB", "SIX", "TSX", "KRX", "SSE", "B3", "JSE", "MOEX",
]

const stats = [
  { label: "Exchanges", value: 60, suffix: "+" },
  { label: "Symbols", value: 40, suffix: "K+" },
  { label: "Latency", value: 2, prefix: "<", suffix: "s" },
  { label: "Uptime", value: 99.9, suffix: "%" },
]

export function Coverage() {
  return (
    <section id="coverage" className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 text-center"
        >
          <span className="inline-block rounded-full bg-emerald/10 px-4 py-1.5 text-xs font-medium text-emerald tracking-wide uppercase">Global Coverage</span>
          <h2 className="font-heading mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Every market. <span className="text-gradient-emerald">One terminal.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-pretty">
            From Wall Street to Dalal Street — Lumora tracks the world&apos;s most
            important exchanges in real time.
          </p>
        </motion.div>

        <div className="mb-16 flex flex-wrap justify-center gap-2">
          {EXCHANGES.map((ex, i) => (
            <motion.span
              key={ex}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="rounded-full border border-border/50 px-4 py-1.5 text-xs font-medium text-muted-foreground bg-white/[0.02] hover:border-primary/30 hover:text-foreground transition-colors"
            >
              {ex}
            </motion.span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6 text-center"
            >
              <p className="font-heading text-4xl font-semibold tracking-tight text-gradient">
                {s.prefix || ""}<CountUp to={s.value} duration={2} />{s.suffix || ""}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
