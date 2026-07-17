"use client"

import { motion } from "motion/react"

const features = [
  {
    title: "Real-time Data",
    description: "Live market quotes across 60+ global exchanges with sub-second refresh rates.",
  },
  {
    title: "Market Analysis",
    description: "Deep learning models that analyze sentiment, technicals, and macro data for accurate forecasts.",
  },
  {
    title: "Portfolio Intelligence",
    description: "Holistic portfolio analysis with risk-adjusted returns, correlation mapping, and optimization.",
  },
  {
    title: "Risk Management",
    description: "Real-time exposure tracking, drawdown limits, and automated position sizing safeguards.",
  },
]

export function Features() {
  return (
    <section className="relative overflow-hidden px-6 py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20 max-w-2xl"
        >
          <h2 className="font-heading text-4xl font-light tracking-tight text-foreground sm:text-5xl">
            Everything you need to{' '}
            <span className="font-semibold text-gradient">decide</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From real-time quotes to AI-powered analysis — Lumora brings institutional-grade tools to a single terminal.
          </p>
        </motion.div>

        <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] sm:grid-cols-2">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative bg-background p-8 transition-colors hover:bg-white/[0.02] sm:p-10"
            >
              <div className="mb-3 font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground/50">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="font-heading text-xl font-medium text-foreground">{f.title}</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
