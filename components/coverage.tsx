"use client"

import { motion } from "motion/react"
import { Globe2, Building2, Landmark, Banknote } from "lucide-react"
import { CountUp } from "./count-up"

const exchanges = [
  { name: "NYSE", icon: Building2 }, { name: "NASDAQ", icon: Building2 },
  { name: "NSE", icon: Landmark }, { name: "BSE", icon: Landmark },
  { name: "LSE", icon: Banknote }, { name: "TSE", icon: Banknote },
  { name: "FSE", icon: Banknote }, { name: "HKEX", icon: Banknote },
  { name: "ASX", icon: Building2 }, { name: "SSE", icon: Banknote },
  { name: "TSX", icon: Building2 }, { name: "Euronext", icon: Globe2 },
]

const stats = [
  { value: 60, suffix: "+", label: "Exchanges", accent: "border-blue/20 bg-blue/[0.04]", icon: Globe2 },
  { value: 12, suffix: "K+", label: "Instruments", accent: "border-emerald/20 bg-emerald/[0.04]", icon: Building2 },
  { value: 40, suffix: "+", label: "Countries", accent: "border-violet/20 bg-violet/[0.04]", icon: Landmark },
]

export function Coverage() {
  return (
    <section id="coverage" className="section-violet relative overflow-hidden px-4 py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="badge-violet mb-4 inline-block rounded-full px-3 py-1 text-xs font-medium">Coverage</span>
          <h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Global <span className="text-gradient-violet">Market</span> Coverage
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Every major exchange, every asset class. One unified intelligence layer.
          </p>
        </motion.div>

        {/* Floating stat widgets — asymmetrical */}
        <div className="mb-16 flex flex-wrap justify-center gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`float-up glass-card relative rounded-2xl border p-6 ${s.accent}`}
              style={{ animationDelay: `${-i * 2}s` }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/60">
                  <s.icon className="h-5 w-5 text-foreground/60" />
                </div>
                <div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="font-heading text-3xl font-semibold tabular-nums">
                      <CountUp to={s.value} />
                    </span>
                    <span className="font-heading text-xl font-semibold">{s.suffix}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Exchange tags — animated grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3"
        >
          {exchanges.map((ex, i) => (
            <motion.div
              key={ex.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ y: -3, scale: 1.05 }}
              transition={{ duration: 0.3, delay: i * 0.02 }}
              className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all hover:border-blue/30 hover:bg-blue/[0.04] hover:shadow-md"
            >
              <ex.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{ex.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
