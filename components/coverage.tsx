"use client"

import { motion } from "motion/react"
import { Globe2, BarChart3, TrendingUp } from "lucide-react"
import { CountUp } from "./count-up"
import { useRef } from "react"

const exchanges = [
  { name: "NYSE", country: "USA" },
  { name: "NASDAQ", country: "USA" },
  { name: "NSE", country: "India" },
  { name: "BSE", country: "India" },
  { name: "LSE", country: "UK" },
  { name: "TSE", country: "Japan" },
  { name: "FSE", country: "Germany" },
  { name: "HKEX", country: "HK" },
  { name: "ASX", country: "Australia" },
  { name: "SSE", country: "China" },
  { name: "TSX", country: "Canada" },
  { name: "Euronext", country: "EU" },
]

const stats = [
  {
    value: 60,
    suffix: "+",
    label: "Exchanges",
    glow: "oklch(0.55 0.18 255 / 0.2)",
    icon: Globe2,
    accent: "text-blue",
  },
  {
    value: 12,
    suffix: "K+",
    label: "Instruments",
    glow: "oklch(0.6 0.16 168 / 0.2)",
    icon: BarChart3,
    accent: "text-emerald",
  },
  {
    value: 40,
    suffix: "+",
    label: "Countries",
    glow: "oklch(0.48 0.16 280 / 0.2)",
    icon: Globe2,
    accent: "text-violet",
  },
  {
    value: 500,
    suffix: "B+",
    label: "Data Points",
    glow: "oklch(0.75 0.1 85 / 0.2)",
    icon: TrendingUp,
    accent: "text-gold",
  },
]

function StatCard({ stat, index }: { stat: (typeof stats)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div ref={ref} className="glass-stat group h-full">
        <div className="pointer-events-none absolute -inset-[1px] rounded-[32px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `linear-gradient(135deg, ${stat.glow}, transparent 50%, ${stat.glow})`,
            filter: "blur(2px)",
          }}
        />
        <div className="relative z-10 flex flex-col items-center p-6 text-center">
          <motion.div
            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
            transition={{ type: "spring", stiffness: 300, damping: 12 }}
            className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: `linear-gradient(135deg, ${stat.glow}, transparent)` }}
          >
            <stat.icon className={`h-5 w-5 ${stat.accent}`} />
          </motion.div>
          <div className="flex items-baseline gap-0.5">
            <span className="font-heading text-3xl font-semibold tabular-nums text-foreground">
              <CountUp to={stat.value} />
            </span>
            <span className="font-heading text-xl font-semibold text-foreground">{stat.suffix}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
        </div>
      </div>
    </motion.div>
  )
}

export function Coverage() {
  return (
    <section id="coverage" className="relative overflow-hidden px-4 py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet/[0.02] via-transparent to-blue/[0.02]" />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[150px]"
        style={{ background: "oklch(0.48 0.16 280 / 0.04)" }}
      />

      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue/20 bg-blue/[0.06] px-4 py-1.5 text-xs font-medium text-blue"
          >
            <Globe2 className="h-3 w-3" />
            Coverage
          </motion.span>
          <h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Global <span className="text-gradient">Market</span> Coverage
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Every major exchange, every asset class. One unified intelligence layer.
          </p>
        </motion.div>

        <div className="mb-20 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s, i) => (
            <StatCard key={s.label} stat={s} index={i} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3"
        >
          {exchanges.map((ex, i) => (
            <motion.div
              key={ex.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -2, scale: 1.02 }}
              transition={{ duration: 0.25, delay: i * 0.02 }}
              className="glass-pill transform-gpu px-5 py-2.5 text-center transition-all duration-300 hover:shadow-lg"
            >
              <p className="font-heading text-sm font-semibold text-foreground">{ex.name}</p>
              <p className="text-[10px] text-muted-foreground/60">{ex.country}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
