"use client"

import { useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "motion/react"

// Deterministic pseudo chart path so SSR and client match.
function buildPath(points: number[], w: number, h: number) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const step = w / (points.length - 1)
  const norm = (v: number) => h - ((v - min) / (max - min)) * h
  let d = `M 0 ${norm(points[0]).toFixed(1)}`
  for (let i = 1; i < points.length; i++) {
    const x = i * step
    const cx = x - step / 2
    d += ` Q ${cx.toFixed(1)} ${norm(points[i - 1]).toFixed(1)} ${x.toFixed(
      1,
    )} ${norm(points[i]).toFixed(1)}`
  }
  return d
}

const series = [42, 48, 45, 55, 60, 57, 68, 74, 70, 82, 88, 95, 90, 104]

export function HeroOrb() {
  const ref = useRef<HTMLDivElement>(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 120, damping: 18 })
  const sry = useSpring(ry, { stiffness: 120, damping: 18 })
  const rotateX = useTransform(srx, [-0.5, 0.5], [8, -8])
  const rotateY = useTransform(sry, [-0.5, 0.5], [-10, 10])

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    rx.set((e.clientY - rect.top) / rect.height - 0.5)
    ry.set((e.clientX - rect.left) / rect.width - 0.5)
  }
  const reset = () => {
    rx.set(0)
    ry.set(0)
  }

  const w = 900
  const h = 340
  const path = buildPath(series, w, h)

  return (
    <div style={{ perspective: 1400 }}>
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={reset}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative mx-auto w-full overflow-hidden rounded-3xl glass-strong p-6 shadow-2xl shadow-black/50 sm:p-8"
      >
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              LUMORA · GLOBAL INDEX
            </span>
          </div>
          <span className="rounded-full bg-accent/15 px-2.5 py-1 font-mono text-xs text-accent">
            +2.41%
          </span>
        </div>

        {/* Chart */}
        <div className="relative">
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="h-auto w-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="oklch(0.68 0.17 245)" stopOpacity="0.4" />
                <stop offset="1" stopColor="oklch(0.68 0.17 245)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="oklch(0.7 0.16 245)" />
                <stop offset="1" stopColor="oklch(0.82 0.14 165)" />
              </linearGradient>
            </defs>

            {[0.25, 0.5, 0.75].map((g) => (
              <line
                key={g}
                x1="0"
                x2={w}
                y1={h * g}
                y2={h * g}
                stroke="oklch(0.99 0 0 / 0.05)"
                strokeWidth="1"
              />
            ))}

            <motion.path
              d={`${path} L ${w} ${h} L 0 ${h} Z`}
              fill="url(#fill)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.4, delay: 1 }}
            />
            <motion.path
              d={path}
              fill="none"
              stroke="url(#stroke)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut", delay: 0.9 }}
            />
          </svg>

          {/* Floating tickers */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { s: "AAPL", v: "+1.2%", up: true },
              { s: "TSLA", v: "-0.8%", up: false },
              { s: "MSFT", v: "+0.6%", up: true },
              { s: "BTC", v: "+3.4%", up: true },
            ].map((t) => (
              <div
                key={t.s}
                className="rounded-xl border border-white/5 bg-white/[0.03] p-3"
              >
                <div className="font-mono text-xs text-muted-foreground">
                  {t.s}
                </div>
                <div
                  className={`mt-1 text-sm font-medium ${
                    t.up ? "text-accent" : "text-foreground/60"
                  }`}
                >
                  {t.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
