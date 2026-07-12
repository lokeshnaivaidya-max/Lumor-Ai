"use client"

import { useRef, useCallback } from "react"
import { motion, useMotionValue, useSpring } from "motion/react"
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

function FeatureCard({ f, i }: { f: (typeof features)[number]; i: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const rawX = useMotionValue(-500)
  const rawY = useMotionValue(-500)
  const x = useSpring(rawX, { stiffness: 65, damping: 25, mass: 0.8 })
  const y = useSpring(rawY, { stiffness: 65, damping: 25, mass: 0.8 })

  const handleMove = useCallback((e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (r) { rawX.set(e.clientX - r.left); rawY.set(e.clientY - r.top) }
  }, [rawX, rawY])

  const handleTilt = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ref.current?.style.setProperty("--rotateX", `${(py - 0.5) * -6}deg`)
    ref.current?.style.setProperty("--rotateY", `${(px - 0.5) * 6}deg`)
  }

  const resetTilt = () => {
    ref.current?.style.setProperty("--rotateX", "0deg")
    ref.current?.style.setProperty("--rotateY", "0deg")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        ref={ref}
        onMouseMove={(e) => { handleMove(e); handleTilt(e) }}
        onMouseLeave={resetTilt}
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, mass: 0.6 }}
        className="group relative cursor-default overflow-hidden rounded-[28px] border border-white/20 bg-white/15 p-7 backdrop-blur-xl transition-all duration-500 hover:border-white/40 hover:shadow-2xl hover:shadow-black/10"
        style={{
          transform: "perspective(800px) rotateX(var(--rotateX, 0deg)) rotateY(var(--rotateY, 0deg))",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
          <motion.div
            className="absolute left-0 top-0 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ x, y, background: `radial-gradient(circle at center, ${f.glow}, transparent 60%)` }}
          />
        </div>
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
          <h3 className="font-heading text-lg font-semibold text-foreground">{f.title}</h3>
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
