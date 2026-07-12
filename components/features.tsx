"use client"

import { motion, useMotionValue } from "motion/react"
import { Brain, BarChart3, Globe2, Shield, Zap, TrendingUp } from "lucide-react"

const features = [
  { icon: Brain, title: "AI-Powered Analysis", description: "Deep learning models analyze technical indicators, market sentiment, and price patterns in real time.", accent: "from-blue/20 to-violet/20 border-blue/30" },
  { icon: Globe2, title: "Global Coverage", description: "60+ exchanges across US, India, UK, Japan, and Europe. One terminal for worldwide markets.", accent: "from-emerald/20 to-cyan/20 border-emerald/30" },
  { icon: BarChart3, title: "Advanced Charts", description: "TradingView-quality charts with 20+ technical indicators, multiple timeframes, and drawing tools.", accent: "from-violet/20 to-blue/20 border-violet/30" },
  { icon: Shield, title: "Risk Intelligence", description: "Real-time risk assessment, position sizing, and portfolio health monitoring powered by AI.", accent: "from-gold/20 to-amber/20 border-gold/30" },
  { icon: Zap, title: "Real-Time Data", description: "Sub-second latency market data with WebSocket streaming. Never miss a price movement.", accent: "from-cyan/20 to-blue/20 border-cyan/30" },
  { icon: TrendingUp, title: "Smart Recommendations", description: "Multi-horizon AI recommendations from day trading to long-term position analysis.", accent: "from-emerald/20 to-teal/20 border-emerald/30" },
]

function FeatureCard({ f, i }: { f: typeof features[0]; i: number }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all duration-500 hover:shadow-2xl ${f.accent}`}
      style={{
        transformStyle: "preserve-3d",
        perspective: 800,
      }}
    >
      <motion.div
        className="relative z-10"
        style={{ transform: useMotionValue(`translateX(${x.get() * 8}px) translateY(${y.get() * 8}px)`) }}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-xl">
          <f.icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-white">{f.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{f.description}</p>
      </motion.div>
      <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: "radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), oklch(0.6 0.22 255 / 0.08), transparent 60%)",
        }}
      />
    </motion.div>
  )
}

export function Features() {
  return (
    <section id="intelligence" className="section-blue relative overflow-hidden px-4 py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 text-center"
        >
          <span className="inline-block rounded-full badge-blue px-3 py-1 text-xs font-medium mb-4">
            Intelligence
          </span>
          <h2 className="font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            What{" "}
            <span className="text-gradient-aurora">Lumora</span>{" "}
            Delivers
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/50">
            Every tool you need to make smarter investment decisions, powered by cutting-edge AI.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FeatureCard key={f.title} f={f} i={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
