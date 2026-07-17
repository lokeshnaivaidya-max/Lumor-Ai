"use client"

import { useRef } from "react"
import { useInView } from "motion/react"
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
    <div ref={ref} className="lm-animate lm-animate--delay-1">
      {inView && (
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <div>
                <p className="lm-stat">
                  <CountUp to={s.value} suffix={s.suffix} />
                </p>
                <p className="lm-stat-label">{s.label}</p>
              </div>
              {i < stats.length - 1 && <div className="lm-stat-sep" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
