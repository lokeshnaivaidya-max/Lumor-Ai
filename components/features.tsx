"use client"

import { useRef } from "react"
import { motion, useMotionValue, useSpring } from "motion/react"
import { Brain, Globe, Activity, Newspaper, Timer, Shield } from "lucide-react"

const features = [
  { icon: Brain, title: "AI Research Desk", desc: "Deep institutional-grade analysis powered by generative AI — bull cases, bear cases, and price targets in seconds.", color: "from-blue/20 to-transparent", iconColor: "text-blue", featured: true },
  { icon: Globe, title: "60+ Global Exchanges", desc: "Real-time data from NYSE, NASDAQ, NSE, LSE, TSE, and crypto markets worldwide.", color: "from-emerald/20 to-transparent", iconColor: "text-emerald" },
  { icon: Activity, title: "Deep Technicals", desc: "RSI, MACD, EMA, VWAP, ATR, ADX, Bollinger, Ichimoku, Fibonacci — 15+ indicators computed live.", color: "from-cyan/20 to-transparent", iconColor: "text-cyan" },
  { icon: Newspaper, title: "News + Sentiment", desc: "Real headlines, AI-summarized sentiment analysis, and thematic impact scoring.", color: "from-violet/20 to-transparent", iconColor: "text-violet" },
  { icon: Timer, title: "Market Status", desc: "Pre-market, regular, after-hours — live countdowns for every global exchange.", color: "from-gold/20 to-transparent", iconColor: "text-gold" },
  { icon: Shield, title: "Risk Lens", desc: "Beta, VaR, correlation heatmaps, and position-sizing models for smarter allocations.", color: "from-primary/20 to-transparent", iconColor: "text-primary" },
]

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rx = useSpring(x, { stiffness: 200, damping: 20 })
  const ry = useSpring(y, { stiffness: 200, damping: 20 })

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    x.set((py - 0.5) * 8)
    y.set((px - 0.5) * -8)
  }

  const handleLeave = () => { x.set(0); y.set(0) }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX: rx, rotateY: ry }}
      className={`group relative rounded-2xl p-[1px] transition-shadow duration-300 hover:shadow-lg ${className}`}
    >
      <div className="relative h-full rounded-2xl bg-background/90 p-6 backdrop-blur-sm">
        {children}
      </div>
    </motion.div>
  )
}

export function Features() {
  return (
    <section id="intelligence" className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 text-center"
        >
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary tracking-wide uppercase">Intelligence Layer</span>
          <h2 className="font-heading mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Beyond the <span className="text-gradient">ticker tape</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-pretty">
            Every data point, headline, and technical signal feeds into a unified intelligence layer
            designed for clarity, not noise.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={f.featured ? "lg:col-span-2 lg:row-span-1" : ""}
            >
              <TiltCard className={f.featured ? "border-primary/20 shadow-primary/5" : "border-border/50"}>
                <div className={`mb-4 inline-flex rounded-xl p-2.5 ${f.color} ${f.iconColor}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-base font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
