"use client"

import { motion } from "motion/react"
import { BarChart3, Brain, PieChart, Shield, Sparkles } from "lucide-react"

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

const blobPolygons = [
  "polygon(50% 2%, 82% 8%, 97% 30%, 100% 58%, 92% 82%, 68% 96%, 35% 98%, 12% 88%, 2% 65%, 4% 35%, 18% 12%)",
  "polygon(48% 4%, 78% 6%, 95% 28%, 98% 55%, 85% 80%, 60% 95%, 30% 94%, 8% 78%, 3% 52%, 10% 28%, 28% 10%)",
  "polygon(55% 3%, 82% 12%, 96% 35%, 92% 62%, 75% 85%, 50% 97%, 22% 90%, 6% 70%, 8% 42%, 20% 16%)",
  "polygon(52% 1%, 80% 10%, 98% 32%, 100% 60%, 88% 84%, 65% 98%, 40% 96%, 15% 82%, 2% 58%, 5% 30%, 22% 8%)",
]

function FeatureBlob({ f, i }: { f: (typeof features)[number]; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 30 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex items-center justify-center"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${f.glow}, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />

      <motion.div
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative w-full cursor-default"
        style={{ aspectRatio: "4/3" }}
      >
        <div
          className={`absolute inset-0 ${f.glassClass} transform-gpu`}
          style={{
            clipPath: blobPolygons[i],
            WebkitClipPath: blobPolygons[i],
          }}
        >
          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <motion.div
              whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.15 }}
              transition={{ type: "spring", stiffness: 250, damping: 12 }}
              className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                background: `radial-gradient(circle at 40% 35%, ${f.glow.replace(/ \/ 0\.2\)/, " / 0.35)")}, transparent 70%)`,
              }}
            >
              <f.icon className={`h-6 w-6 ${f.accent}`} />
            </motion.div>
            <h3 className="font-heading text-base font-semibold text-foreground">{f.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.description}</p>
            <span
              className="mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium"
              style={{
                background: `${f.glow.replace(/ \/ 0\.2\)/, " / 0.12)")}`,
              }}
            >
              <span className={`inline-block h-1 w-1 rounded-full ${f.accent.replace("text-", "bg-")}`} />
              {f.tag}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function Features() {
  return (
    <section id="intelligence" className="relative overflow-hidden px-4 py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue/[0.015] via-transparent to-violet/[0.015]" />
      <div
        className="pointer-events-none absolute -top-[30%] left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 rounded-full blur-[150px]"
        style={{ background: "oklch(0.55 0.18 255 / 0.04)" }}
      />

      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue/20 bg-blue/[0.06] px-4 py-1.5 text-xs font-medium text-blue"
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

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <FeatureBlob key={f.title} f={f} i={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
