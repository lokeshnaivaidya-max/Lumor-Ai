"use client"

import { useRef } from "react"
import { useInView, motion } from "motion/react"
import { CountUp } from "./count-up"

const stats = [
  { value: 60, suffix: "+", label: "Exchanges" },
  { value: 12, suffix: "K+", label: "Instruments" },
  { value: 40, suffix: "+", label: "Countries" },
  { value: 500, suffix: "B+", label: "Data points" },
]

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <div ref={ref}>
      {inView && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center gap-6"
        >
          {stats.map((s, i) => (
            <div key={s.label} className="flex items-center gap-6">
              <div>
                <p className="stat-number">
                  <CountUp to={s.value} suffix={s.suffix} />
                </p>
                <p className="stat-label">{s.label}</p>
              </div>
              {i < stats.length - 1 && (
                <div className="h-12 w-px" style={{ background: "var(--glass-border)" }} />
              )}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
