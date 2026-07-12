"use client"

import { useMemo, useState } from "react"
import { motion } from "motion/react"

export type Candle = { t: number; c: number }

export function PriceChart({
  candles,
  positive,
  height = 360,
}: {
  candles: Candle[]
  positive: boolean
  height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const width = 900

  const { path, area, min, max, pts, first, last } = useMemo(() => {
    const closes = candles.map((c) => c.c)
    const min = closes.length ? Math.min(...closes) : 0
    const max = closes.length ? Math.max(...closes) : 1
    const range = max - min || 1
    const padX = 8
    const padY = 20
    const w = width - padX * 2
    const h = height - padY * 2
    const pts = candles.map((c, i) => {
      const x = padX + (i / Math.max(1, candles.length - 1)) * w
      const y = padY + h - ((c.c - min) / range) * h
      return { x, y }
    })
    const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ")
    const area = `${path} L ${pts[pts.length - 1]?.x.toFixed(2)} ${height - padY} L ${pts[0]?.x.toFixed(2)} ${height - padY} Z`
    return { path, area, min, max, pts, first: pts[0], last: pts[pts.length - 1] }
  }, [candles, height])

  if (!candles.length) {
    return (
      <div
        className="glass-card flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        No chart data available
      </div>
    )
  }

  const tone = positive ? "oklch(0.8 0.14 168)" : "oklch(0.68 0.19 22)"
  const gradId = positive ? "chart-pos" : "chart-neg"
  const hp = hover != null ? pts[hover] : null
  const hc = hover != null ? candles[hover] : null

  return (
    <div className="edge-light glass-card relative w-full overflow-hidden">
      {/* soft directional glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: `radial-gradient(120% 90% at 50% 120%, ${tone.replace(")", " / 0.14)")}, transparent 60%)` }}
      />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="relative w-full"
        style={{ height }}
        preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const rel = ((e.clientX - rect.left) / rect.width) * width
          let best = 0
          let bd = Infinity
          pts.forEach((p, i) => {
            const d = Math.abs(p.x - rel)
            if (d < bd) {
              bd = d
              best = i
            }
          })
          setHover(best)
        }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tone} stopOpacity="0.32" />
            <stop offset="100%" stopColor={tone} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* horizontal gridlines */}
        {[0.2, 0.4, 0.6, 0.8].map((g) => (
          <line
            key={g}
            x1="0"
            x2={width}
            y1={height * g}
            y2={height * g}
            stroke="oklch(0.99 0 0 / 0.045)"
            strokeWidth="1"
          />
        ))}

        <motion.path
          d={area}
          fill={`url(#${gradId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        <motion.path
          key={path}
          d={path}
          fill="none"
          stroke={tone}
          strokeWidth="2.25"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${tone.replace(")", " / 0.5)")})` }}
        />

        {/* start / last markers */}
        {last && (
          <>
            <circle cx={last.x} cy={last.y} r="8" fill={tone} opacity="0.18" />
            <circle cx={last.x} cy={last.y} r="3.5" fill={tone} />
          </>
        )}
        {first && <circle cx={first.x} cy={first.y} r="2.5" fill={tone} opacity="0.5" />}

        {hp && (
          <g>
            <line x1={hp.x} y1={0} x2={hp.x} y2={height} stroke="oklch(0.99 0 0 / 0.18)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <circle cx={hp.x} cy={hp.y} r="9" fill={tone} opacity="0.2" />
            <circle cx={hp.x} cy={hp.y} r="4" fill={tone} stroke="oklch(0.99 0 0)" strokeWidth="1.5" />
          </g>
        )}
      </svg>

      {hc && (
        <div className="pointer-events-none absolute left-4 top-4 rounded-xl glass-card px-3 py-2 text-xs">
          <div className="font-mono text-sm text-foreground tabular-nums">
            {hc.c.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-muted-foreground">{new Date(hc.t).toLocaleDateString()}</div>
        </div>
      )}
      <div className="pointer-events-none absolute right-4 top-3 font-mono text-[11px] text-muted-foreground tabular-nums">
        {max.toFixed(2)}
      </div>
      <div className="pointer-events-none absolute bottom-3 right-4 font-mono text-[11px] text-muted-foreground tabular-nums">
        {min.toFixed(2)}
      </div>
    </div>
  )
}
