"use client"

import { motion, useMotionValue, useSpring, useTransform } from "motion/react"
import { Brain, BarChart3, Globe2, Shield, Zap, TrendingUp, Sparkles } from "lucide-react"
import { useRef } from "react"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Deep learning models analyze technical indicators, market sentiment, and price patterns in real time.",
    gradient: "from-blue/20 via-violet/20 to-transparent",
    glow: "oklch(0.55 0.18 255 / 0.12)",
    accent: "text-blue",
    tag: "Real-time",
    tag2: "Deep Learning",
    tagAccent: "bg-blue/10 text-blue",
    tag2Accent: "bg-violet/10 text-violet",
  },
  {
    icon: Globe2,
    title: "Global Coverage",
    description: "60+ exchanges across US, India, UK, Japan, and Europe. One terminal for worldwide markets.",
    gradient: "from-emerald/20 via-cyan/20 to-transparent",
    glow: "oklch(0.62 0.16 168 / 0.12)",
    accent: "text-emerald",
    tag: "60+ Exchanges",
    tag2: "5 Regions",
    tagAccent: "bg-emerald/10 text-emerald",
    tag2Accent: "bg-cyan/10 text-cyan",
  },
  {
    icon: BarChart3,
    title: "Advanced Charts",
    description: "TradingView-quality charts with 20+ technical indicators, multiple timeframes, and drawing tools.",
    gradient: "from-violet/20 via-pink/20 to-transparent",
    glow: "oklch(0.48 0.16 280 / 0.12)",
    accent: "text-violet",
    tag: "20+ Indicators",
    tag2: "Multi-timeframe",
    tagAccent: "bg-violet/10 text-violet",
    tag2Accent: "bg-pink/10 text-pink",
  },
  {
    icon: Shield,
    title: "Risk Intelligence",
    description: "Real-time risk assessment, position sizing, and portfolio health monitoring powered by AI.",
    gradient: "from-gold/20 via-amber/20 to-transparent",
    glow: "oklch(0.75 0.12 75 / 0.12)",
    accent: "text-gold",
    tag: "AI-driven",
    tag2: "Real-time",
    tagAccent: "bg-gold/10 text-gold",
    tag2Accent: "bg-amber/10 text-amber",
  },
  {
    icon: Zap,
    title: "Real-Time Data",
    description: "Sub-second latency market data with WebSocket streaming. Never miss a price movement.",
    gradient: "from-cyan/20 via-blue/20 to-transparent",
    glow: "oklch(0.62 0.15 195 / 0.12)",
    accent: "text-cyan",
    tag: "WebSocket",
    tag2: "Sub-second",
    tagAccent: "bg-cyan/10 text-cyan",
    tag2Accent: "bg-blue/10 text-blue",
  },
  {
    icon: TrendingUp,
    title: "Smart Recommendations",
    description: "Multi-horizon AI recommendations from day trading to long-term position analysis.",
    gradient: "from-emerald/20 via-teal/20 to-transparent",
    glow: "oklch(0.65 0.14 160 / 0.12)",
    accent: "text-emerald",
    tag: "Multi-horizon",
    tag2: "AI-driven",
    tagAccent: "bg-emerald/10 text-emerald",
    tag2Accent: "bg-teal/10 text-teal",
  },
]

function MagneticCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 150, damping: 15 })
  const springY = useSpring(y, { stiffness: 150, damping: 15 })
  const rotateX = useTransform(springY, [-0.5, 0.5], ["-3deg", "3deg"])
  const rotateY = useTransform(springX, [-0.5, 0.5], ["3deg", "-3deg"])

  function handleMouse(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    x.set(px)
    y.set(py)
  }

  function handleLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, perspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function GlowOrb({ color, className }: { color: string; className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-[80px] ${className}`}
      style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }}
    />
  )
}

export function Features() {
  return (
    <section id="intelligence" className="relative overflow-hidden px-4 py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-blue/[0.02] via-transparent to-violet/[0.02]" />
      <GlowOrb color="oklch(0.55 0.18 255 / 0.06)" className="-top-[20%] -left-[10%] h-[50vh] w-[50vh]" />
      <GlowOrb color="oklch(0.62 0.16 168 / 0.05)" className="-bottom-[20%] -right-[10%] h-[50vh] w-[50vh]" />

      <div className="mx-auto max-w-6xl relative">
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

        <div className="grid gap-5 md:grid-cols-6">
          {features.map((f, i) => {
            const isFeatured = i < 2
            return (
              <MagneticCard
                key={f.title}
                className={`shadow-card-hover glass-card edge-light relative overflow-hidden rounded-[28px] transition-all duration-500 hover:shadow-2xl col-span-full ${
                  isFeatured ? "md:col-span-3 p-8" : "md:col-span-3 lg:col-span-1 p-6"
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
                <GlowOrb color={f.glow} className="-top-12 -right-12 h-32 w-32" />

                <div className="relative">
                  {/* Icon — organic circle with animated glow */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                    transition={{ type: "spring", stiffness: 300, damping: 12 }}
                    className={`relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full border ${isFeatured ? "h-14 w-14" : "h-10 w-10"}`}
                    style={{ borderColor: f.glow.replace(" / 0.12)", " / 0.3)") }}
                  >
                    <div
                      className="absolute inset-0 rounded-full blur-md"
                      style={{ background: f.glow }}
                    />
                    <f.icon className={`relative ${f.accent} ${isFeatured ? "h-6 w-6" : "h-5 w-5"}`} />
                  </motion.div>

                  <h3 className={`font-heading font-semibold text-foreground ${isFeatured ? "text-xl" : "text-base"}`}>
                    {f.title}
                  </h3>
                  <p className={`mt-2 text-muted-foreground leading-relaxed ${isFeatured ? "text-sm" : "text-sm"}`}>
                    {f.description}
                  </p>

                  {isFeatured && (
                    <div className="mt-5 flex gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${f.tagAccent}`}>{f.tag}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${f.tag2Accent}`}>{f.tag2}</span>
                    </div>
                  )}

                  {!isFeatured && (
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground/60">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${f.accent.replace("text-", "bg-")}`} />
                      {f.tag}
                    </div>
                  )}
                </div>
              </MagneticCard>
            )
          })}
        </div>
      </div>
    </section>
  )
}
