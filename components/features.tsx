"use client"

import { motion } from "motion/react"
import { Brain, BarChart3, Globe2, Shield, Zap, TrendingUp, Sparkles } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Deep learning models analyze technical indicators, market sentiment, and price patterns in real time.",
    gradient: "from-blue/20 via-violet/20 to-transparent",
    glow: "oklch(0.55 0.18 255 / 0.15)",
    accent: "text-blue",
    tag: "Deep Learning",
  },
  {
    icon: Globe2,
    title: "Global Coverage",
    description: "60+ exchanges across US, India, UK, Japan, and Europe. One terminal for worldwide markets.",
    gradient: "from-emerald/20 via-cyan/20 to-transparent",
    glow: "oklch(0.62 0.16 168 / 0.15)",
    accent: "text-emerald",
    tag: "60+ Exchanges",
  },
  {
    icon: BarChart3,
    title: "Advanced Charts",
    description: "TradingView-quality charts with 20+ technical indicators, multiple timeframes, and drawing tools.",
    gradient: "from-violet/20 via-pink/20 to-transparent",
    glow: "oklch(0.48 0.16 280 / 0.15)",
    accent: "text-violet",
    tag: "20+ Indicators",
  },
  {
    icon: Shield,
    title: "Risk Intelligence",
    description: "Real-time risk assessment, position sizing, and portfolio health monitoring powered by AI.",
    gradient: "from-gold/20 via-amber/20 to-transparent",
    glow: "oklch(0.75 0.12 75 / 0.15)",
    accent: "text-gold",
    tag: "AI-driven",
  },
  {
    icon: Zap,
    title: "Real-Time Data",
    description: "Sub-second latency market data with WebSocket streaming. Never miss a price movement.",
    gradient: "from-cyan/20 via-blue/20 to-transparent",
    glow: "oklch(0.62 0.15 195 / 0.15)",
    accent: "text-cyan",
    tag: "WebSocket",
  },
  {
    icon: TrendingUp,
    title: "Smart Recommendations",
    description: "Multi-horizon AI recommendations from day trading to long-term position analysis.",
    gradient: "from-emerald/20 via-teal/20 to-transparent",
    glow: "oklch(0.65 0.14 160 / 0.15)",
    accent: "text-emerald",
    tag: "Multi-horizon",
  },
]

function FeatureBlob({ f, i }: { f: (typeof features)[number]; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 30 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="relative group"
    >
      <motion.div
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative cursor-default"
      >
        {/* Organic blob background */}
        <svg className="w-full h-auto" viewBox="0 0 400 300" preserveAspectRatio="none">
          <defs>
            <radialGradient id={`blob-glow-${i}`} cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor={f.glow} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <filter id={`blob-shadow-${i}`}>
              <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor={f.glow} floodOpacity="0.3" />
            </filter>
          </defs>
          <ellipse cx="200" cy="160" rx="180" ry="130" fill={`url(#blob-glow-${i})`} opacity="0.6" />
          <motion.ellipse
            cx="200" cy="160" rx="180" ry="130"
            fill="none"
            stroke={f.glow}
            strokeWidth="1"
            strokeOpacity="0.3"
            filter={`url(#blob-shadow-${i})`}
            animate={{
              rx: [180, 170, 185, 180],
              ry: [130, 140, 125, 130],
            }}
            transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>

        {/* Content absolutely positioned over blob */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <motion.div
            whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.15 }}
            transition={{ type: "spring", stiffness: 250, damping: 12 }}
            className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              background: `radial-gradient(circle at 40% 35%, ${f.glow.replace(" / 0.15)", " / 0.3)")}, transparent 70%)`,
            }}
          >
            <f.icon className={`h-6 w-6 ${f.accent}`} />
          </motion.div>
          <h3 className="font-heading text-base font-semibold text-foreground">{f.title}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.description}</p>
          <span
            className="mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium"
            style={{
              background: `${f.glow.replace(" / 0.15)", " / 0.12)")}`,
              color: f.accent.replace("text-", ""),
            }}
          >
            <span className={`inline-block h-1 w-1 rounded-full ${f.accent.replace("text-", "bg-")}`} />
            {f.tag}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function Features() {
  return (
    <section id="intelligence" className="relative overflow-hidden px-4 py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-blue/[0.015] via-transparent to-violet/[0.015]" />
      <div className="pointer-events-none absolute -top-[30%] left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 rounded-full blur-[150px]" style={{ background: "oklch(0.55 0.18 255 / 0.04)" }} />

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
            className="inline-flex items-center gap-1.5 rounded-full border border-blue/20 bg-blue/[0.06] px-4 py-1.5 text-xs font-medium text-blue mb-4"
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

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
          {features.map((f, i) => (
            <FeatureBlob key={f.title} f={f} i={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
