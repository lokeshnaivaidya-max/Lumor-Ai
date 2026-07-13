"use client"

import { motion } from "motion/react"
import { BarChart3, Brain, PieChart, Shield, Sparkles, ArrowUpRight } from "lucide-react"

const features = [
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Sub-second latency market data with AI-driven pattern recognition. Never miss a move.",
    glow: "oklch(0.55 0.18 255 / 0.2)",
    accent: "text-blue",
    glassClass: "glass-blob-blue",
    tag: "Real-time",
  },
  {
    icon: Brain,
    title: "AI Predictions",
    description: "Deep learning models that analyze sentiment, technicals, and macro data for accurate forecasts.",
    glow: "oklch(0.6 0.16 168 / 0.2)",
    accent: "text-emerald",
    glassClass: "glass-blob-emerald",
    tag: "AI-driven",
  },
  {
    icon: PieChart,
    title: "Portfolio Intelligence",
    description: "Holistic portfolio analysis with risk-adjusted returns, correlation mapping, and optimization.",
    glow: "oklch(0.48 0.16 280 / 0.2)",
    accent: "text-violet",
    glassClass: "glass-blob-violet",
    tag: "Smart",
  },
  {
    icon: Shield,
    title: "Risk Management",
    description: "Real-time exposure tracking, drawdown limits, and automated position sizing safeguards.",
    glow: "oklch(0.75 0.1 85 / 0.2)",
    accent: "text-gold",
    glassClass: "glass-blob-gold",
    tag: "Automated",
  },
]

function FeatureCard({ f, i }: { f: (typeof features)[number]; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, mass: 0.6 }}
        className="group relative cursor-default overflow-hidden rounded-[28px] border border-white/20 bg-white/15 p-7 backdrop-blur-xl transition-all duration-500 hover:border-white/40 hover:shadow-2xl hover:shadow-black/10"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-[28px]" />
        <div className="relative" style={{ transform: "translateZ(20px)" }}>
          <motion.div
            whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.15 }}
            transition={{ type: "spring", stiffness: 250, damping: 12 }}
            className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${f.glow}, transparent)`,
            }}
          >
            <f.icon className={`h-6 w-6 ${f.accent}`} />
          </motion.div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading text-lg font-semibold text-foreground">{f.title}</h3>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-all duration-300 group-hover:text-foreground/60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
          <span
            className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium"
            style={{
              background: `${f.glow.replace(/ \/ 0\.2\)/, " / 0.12)")}`,
            }}
          >
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${f.accent.replace("text-", "bg-")}`} />
            {f.tag}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function Features() {
  return (
    <section id="intelligence" className="relative overflow-hidden px-4 py-32">

      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-blue/20 bg-blue/[0.06] px-4 py-1.5 text-xs font-medium text-blue"
          >
            <Sparkles className="h-3 w-3" />
            Intelligence
          </motion.span>
          <h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            What <span className="text-gradient">Lumora</span> Delivers
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Every tool you need to make smarter investment decisions, powered by cutting-edge AI.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <FeatureCard key={f.title} f={f} i={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
