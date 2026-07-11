"use client"

import { useRef } from "react"
import { motion, useInView, useMotionValue, useSpring, useTransform } from "motion/react"

// Deterministic smooth path so SSR and client match.
function buildPath(points: number[], w: number, h: number, pad = 0) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const iw = w - pad * 2
  const step = iw / (points.length - 1)
  const norm = (v: number) => pad + (h - pad * 2) - ((v - min) / (max - min)) * (h - pad * 2)
  let d = `M ${pad} ${norm(points[0]).toFixed(1)}`
  for (let i = 1; i < points.length; i++) {
    const x = pad + i * step
    const cx = x - step / 2
    d += ` Q ${cx.toFixed(1)} ${norm(points[i - 1]).toFixed(1)} ${x.toFixed(1)} ${norm(points[i]).toFixed(1)}`
  }
  return d
}

const series = [42, 48, 45, 55, 60, 57, 68, 74, 70, 82, 88, 95, 90, 104]

// Deterministic orbit nodes around the AI core.
const W = 900
const H = 380
const CX = W * 0.5
const CY = H * 0.44
const NODES = [
  { s: "AAPL", ang: -160, rad: 300, r: 5, hue: 250 },
  { s: "NVDA", ang: -120, rad: 240, r: 6, hue: 168 },
  { s: "TSLA", ang: -70, rad: 300, r: 5, hue: 300 },
  { s: "MSFT", ang: -25, rad: 235, r: 5, hue: 250 },
  { s: "BTC", ang: 20, rad: 300, r: 6, hue: 87 },
  { s: "META", ang: 62, rad: 240, r: 4, hue: 168 },
  { s: "AMZN", ang: 110, rad: 290, r: 5, hue: 250 },
  { s: "GOOG", ang: 155, rad: 245, r: 4, hue: 300 },
].map((n) => ({
  ...n,
  x: CX + Math.cos((n.ang * Math.PI) / 180) * n.rad,
  y: CY + Math.sin((n.ang * Math.PI) / 180) * n.rad * 0.62,
}))

export function HeroOrb() {
  const ref = useRef<HTMLDivElement>(null)
  const viewRef = useRef<HTMLDivElement>(null)
  // Only run the perpetual node/pulse/core animations while the orb is on
  // screen. When scrolled away they collapse to a static frame, freeing the GPU.
  const inView = useInView(viewRef, { margin: "0px 0px -15% 0px" })
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 120, damping: 18 })
  const sry = useSpring(ry, { stiffness: 120, damping: 18 })
  const rotateX = useTransform(srx, [-0.5, 0.5], [10, -10])
  const rotateY = useTransform(sry, [-0.5, 0.5], [-12, 12])

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

  const path = buildPath(series, W, H, 8)

  return (
    <div ref={viewRef} style={{ perspective: 1600 }}>
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={reset}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="edge-light relative mx-auto w-full overflow-hidden rounded-[2rem] glass-strong p-5 shadow-2xl shadow-black/60 sm:p-7"
      >
        {/* Top bar */}
        <div className="mb-5 flex items-center justify-between" style={{ transform: "translateZ(40px)" }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-neg/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-gold/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-pos/60" />
            </div>
            <span className="font-mono text-[11px] tracking-widest text-muted-foreground">
              LUMORA · INTELLIGENCE CORE
            </span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 font-mono text-[11px] text-accent">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            LIVE
          </span>
        </div>

        {/* Network + chart */}
        <div className="relative" style={{ transform: "translateZ(20px)" }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" preserveAspectRatio="none">
            <defs>
              <radialGradient id="core" cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="oklch(0.85 0.15 250)" />
                <stop offset="0.5" stopColor="oklch(0.7 0.18 260)" stopOpacity="0.6" />
                <stop offset="1" stopColor="oklch(0.6 0.2 280)" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="oklch(0.68 0.17 250)" stopOpacity="0.32" />
                <stop offset="1" stopColor="oklch(0.68 0.17 250)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="oklch(0.72 0.16 250)" />
                <stop offset="0.5" stopColor="oklch(0.7 0.19 285)" />
                <stop offset="1" stopColor="oklch(0.82 0.14 168)" />
              </linearGradient>
            </defs>

            {/* grid */}
            {[0.25, 0.5, 0.75].map((g) => (
              <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="oklch(0.99 0 0 / 0.05)" strokeWidth="1" />
            ))}

            {/* network edges */}
            {NODES.map((n, i) => (
              <motion.line
                key={`e-${n.s}`}
                x1={CX}
                y1={CY}
                x2={n.x}
                y2={n.y}
                stroke={`oklch(0.75 0.15 ${n.hue})`}
                strokeWidth="1"
                strokeOpacity="0.25"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: inView ? [0.12, 0.4, 0.12] : 0.2 }}
                transition={{
                  pathLength: { duration: 1.2, delay: 0.9 + i * 0.08 },
                  opacity: { duration: 3.5, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" },
                }}
              />
            ))}

            {/* pulses travelling along edges */}
            {NODES.map((n, i) => (
              <motion.circle
                key={`p-${n.s}`}
                r="2.4"
                fill={`oklch(0.85 0.16 ${n.hue})`}
                initial={{ cx: CX, cy: CY, opacity: 0 }}
                animate={inView ? { cx: [CX, n.x], cy: [CY, n.y], opacity: [0, 1, 0] } : { opacity: 0 }}
                transition={{ duration: 2.4, repeat: Infinity, delay: 1.2 + i * 0.3, ease: "easeInOut" }}
              />
            ))}

            {/* nodes */}
            {NODES.map((n, i) => (
              <motion.g
                key={`n-${n.s}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                <circle cx={n.x} cy={n.y} r={n.r + 5} fill={`oklch(0.8 0.15 ${n.hue} / 0.12)`} />
                <circle cx={n.x} cy={n.y} r={n.r} fill={`oklch(0.86 0.15 ${n.hue})`} />
              </motion.g>
            ))}

            {/* AI core */}
            <motion.circle
              cx={CX}
              cy={CY}
              r="46"
              fill="url(#core)"
              animate={inView ? { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] } : { scale: 1, opacity: 0.8 }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: `${CX}px ${CY}px` }}
            />
            <circle cx={CX} cy={CY} r="9" fill="oklch(0.95 0.05 250)" />

            {/* chart line + fill */}
            <motion.path
              d={`${path} L ${W - 8} ${H - 8} L 8 ${H - 8} Z`}
              fill="url(#fill)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.4, delay: 1.2 }}
            />
            <motion.path
              d={path}
              fill="none"
              stroke="url(#stroke)"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut", delay: 0.9 }}
            />
          </svg>

          {/* Floating tickers */}
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4" style={{ transform: "translateZ(50px)" }}>
            {[
              { s: "AAPL", v: "+1.2%", up: true },
              { s: "TSLA", v: "-0.8%", up: false },
              { s: "MSFT", v: "+0.6%", up: true },
              { s: "BTC", v: "+3.4%", up: true },
            ].map((tk) => (
              <div key={tk.s} className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                <div className="font-mono text-[11px] text-muted-foreground">{tk.s}</div>
                <div className={`mt-0.5 text-sm font-medium tabular-nums ${tk.up ? "text-pos" : "text-neg"}`}>
                  {tk.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
