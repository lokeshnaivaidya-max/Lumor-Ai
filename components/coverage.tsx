"use client"

import { motion } from "motion/react"
import { Globe2, Building2, Landmark, Banknote, Orbit } from "lucide-react"
import { CountUp } from "./count-up"

const exchanges = [
  { name: "NYSE", icon: Building2 },
  { name: "NASDAQ", icon: Building2 },
  { name: "NSE", icon: Landmark },
  { name: "BSE", icon: Landmark },
  { name: "LSE", icon: Banknote },
  { name: "TSE", icon: Banknote },
  { name: "FSE", icon: Banknote },
  { name: "HKEX", icon: Banknote },
  { name: "ASX", icon: Building2 },
  { name: "SSE", icon: Banknote },
  { name: "TSX", icon: Building2 },
  { name: "Euronext", icon: Globe2 },
]

const stats = [
  { value: 60, suffix: "+", label: "Exchanges", icon: Globe2, accent: "border-blue/30 bg-blue/[0.08]" },
  { value: 12000, suffix: "+", label: "Instruments", icon: Orbit, accent: "border-emerald/30 bg-emerald/[0.08]" },
  { value: 40, suffix: "+", label: "Countries", icon: Building2, accent: "border-violet/30 bg-violet/[0.08]" },
  { value: 99.9, suffix: "%", label: "Uptime", icon: Landmark, accent: "border-gold/30 bg-gold/[0.08]" },
]

export function Coverage() {
  return (
    <section id="coverage" className="section-violet relative overflow-hidden px-4 py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 text-center"
        >
          <span className="inline-block rounded-full badge-violet px-3 py-1 text-xs font-medium mb-4">
            Coverage
          </span>
          <h2 className="font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Global{" "}
            <span className="text-gradient-violet">Market</span>{" "}
            Coverage
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/50">
            Every major exchange, every asset class. One unified intelligence layer.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`flex items-center gap-4 rounded-2xl border p-5 ${s.accent}`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                <s.icon className="h-5 w-5 text-white/70" />
              </div>
              <div>
                <div className="flex items-baseline gap-0.5">
                  <span className="font-heading text-3xl font-semibold tabular-nums text-white">
                    <CountUp to={s.value} />
                  </span>
                  <span className="font-heading text-xl font-semibold text-white">{s.suffix}</span>
                </div>
                <p className="text-xs text-white/50">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Exchange grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap justify-center gap-3"
        >
          {exchanges.map((ex, i) => (
            <motion.div
              key={ex.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, scale: 1.05 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-xl transition-all hover:border-blue/30 hover:bg-blue/[0.08] hover:shadow-lg"
            >
              <ex.icon className="h-3.5 w-3.5 text-white/50" />
              <span className="text-sm font-medium text-white/70">{ex.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
