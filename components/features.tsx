"use client"

import { motion } from "motion/react"
import { Brain, BarChart3, Globe2, Shield, Zap, TrendingUp } from "lucide-react"

const features = [
  { icon: Brain, title: "AI-Powered Analysis", description: "Deep learning models analyze technical indicators, market sentiment, and price patterns in real time.", accent: "border-blue/20 bg-blue/[0.03] hover:bg-blue/[0.06]" },
  { icon: Globe2, title: "Global Coverage", description: "60+ exchanges across US, India, UK, Japan, and Europe. One terminal for worldwide markets.", accent: "border-emerald/20 bg-emerald/[0.03] hover:bg-emerald/[0.06]" },
  { icon: BarChart3, title: "Advanced Charts", description: "TradingView-quality charts with 20+ technical indicators, multiple timeframes, and drawing tools.", accent: "border-violet/20 bg-violet/[0.03] hover:bg-violet/[0.06]" },
  { icon: Shield, title: "Risk Intelligence", description: "Real-time risk assessment, position sizing, and portfolio health monitoring powered by AI.", accent: "border-gold/20 bg-gold/[0.03] hover:bg-gold/[0.06]" },
  { icon: Zap, title: "Real-Time Data", description: "Sub-second latency market data with WebSocket streaming. Never miss a price movement.", accent: "border-cyan/20 bg-cyan/[0.03] hover:bg-cyan/[0.06]" },
  { icon: TrendingUp, title: "Smart Recommendations", description: "Multi-horizon AI recommendations from day trading to long-term position analysis.", accent: "border-emerald/20 bg-emerald/[0.03] hover:bg-emerald/[0.06]" },
]

export function Features() {
  return (
    <section id="intelligence" className="section-blue relative overflow-hidden px-4 py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="badge-blue mb-4 inline-block rounded-full px-3 py-1 text-xs font-medium">Intelligence</span>
          <h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            What <span className="text-gradient">Lumora</span> Delivers
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Every tool you need to make smarter investment decisions, powered by cutting-edge AI.
          </p>
        </motion.div>

        {/* Asymmetrical layout — 2 large + 4 smaller */}
        <div className="grid gap-5 md:grid-cols-6">
          {/* Featured: AI Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0 }}
            className="shadow-card-hover glass-card relative col-span-full overflow-hidden rounded-2xl p-8 md:col-span-3"
          >
            <div className="flex items-start gap-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue/10 to-violet/10">
                <Brain className="h-7 w-7 text-blue" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold">AI-Powered Analysis</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">{features[0].description}</p>
                <div className="mt-4 flex gap-2">
                  <span className="rounded-full bg-blue/10 px-3 py-1 text-xs font-medium text-blue">Real-time</span>
                  <span className="rounded-full bg-violet/10 px-3 py-1 text-xs font-medium text-violet">Deep Learning</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Featured: Charts */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="shadow-card-hover glass-card relative col-span-full overflow-hidden rounded-2xl p-8 md:col-span-3"
          >
            <div className="flex items-start gap-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald/10 to-cyan/10">
                <BarChart3 className="h-7 w-7 text-emerald" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold">Advanced Charts</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">{features[2].description}</p>
                <div className="mt-4 flex gap-2">
                  <span className="rounded-full bg-emerald/10 px-3 py-1 text-xs font-medium text-emerald">20+ Indicators</span>
                  <span className="rounded-full bg-cyan/10 px-3 py-1 text-xs font-medium text-cyan">Multi-timeframe</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Smaller cards */}
          {[features[1], features[3], features[4], features[5]].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.05 }}
              className={`shadow-card-hover relative rounded-2xl border p-6 transition-all md:col-span-3 lg:col-span-1 ${f.accent}`}
            >
              <f.icon className="mb-4 h-6 w-6 text-foreground/60" />
              <h3 className="font-heading text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
