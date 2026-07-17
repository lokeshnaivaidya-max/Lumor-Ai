"use client"

import { motion } from "motion/react"
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
  { value: 60, suffix: "+", label: "Exchanges" },
  { value: 12, suffix: "K+", label: "Instruments" },
  { value: 40, suffix: "+", label: "Countries" },
  { value: 500, suffix: "B+", label: "Data Points" },
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
      <div ref={ref} className="glass-stat group h-full text-center">
        <div className="relative z-10 flex flex-col items-center p-6">
          <div className="flex items-baseline gap-0.5">
            <span className="font-heading text-4xl font-semibold tabular-nums text-foreground">
              <CountUp to={stat.value} />
            </span>
            <span className="font-heading text-xl font-semibold text-foreground">{stat.suffix}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
        </div>
      </div>
    </motion.div>
  )
}

export function Coverage() {
  return (
    <section id="coverage" className="relative overflow-hidden px-4 py-28">

      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="mb-4 badge badge-blue">Coverage</span>
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
