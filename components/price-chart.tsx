"use client"

import { useMemo, useState } from "react"

export type Candle = { t: number; c: number }

export function PriceChart({
  candles,
  positive,
  height = 320,
}: {
  candles: Candle[]
  positive: boolean
  height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const width = 900

  const { path, area, min, max, pts } = useMemo(() => {
    const closes = candles.map((c) => c.c)
    const min = Math.min(...closes)
    const max = Math.max(...closes)
    const range = max - min || 1
    const pad = 12
    const w = width - pad * 2
    const h = height - pad * 2
    const pts = candles.map((c, i) => {
      const x = pad + (i / Math.max(1, candles.length - 1)) * w
      const y = pad + h - ((c.c - min) / range) * h
      return { x, y }
    })
    const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ")
    const area =
      `${path} L ${pts[pts.length - 1]?.x.toFixed(2)} ${height - pad} L ${pts[0]?.x.toFixed(2)} ${height - pad} Z`
    return { path, area, min, max, pts }
  }, [candles, height])

  if (!candles.length) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-border bg-card/40 text-sm text-muted-foreground"
        style={{ height }}
      >
        No chart data available
      </div>
    )
  }

  const stroke = positive ? "var(--pos)" : "var(--neg)"
  const hp = hover != null ? pts[hover] : null
  const hc = hover != null ? candles[hover] : null

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-card/40">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
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
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#fill)" />
        <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {hp && (
          <g>
            <line x1={hp.x} y1={0} x2={hp.x} y2={height} stroke="var(--border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <circle cx={hp.x} cy={hp.y} r="4" fill={stroke} />
          </g>
        )}
      </svg>
      {hc && (
        <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-border bg-background/80 px-3 py-2 text-xs backdrop-blur">
          <div className="font-mono text-foreground">{hc.c.toFixed(2)}</div>
          <div className="text-muted-foreground">{new Date(hc.t).toLocaleDateString()}</div>
        </div>
      )}
      <div className="pointer-events-none absolute right-4 top-4 font-mono text-xs text-muted-foreground">{max.toFixed(2)}</div>
      <div className="pointer-events-none absolute bottom-4 right-4 font-mono text-xs text-muted-foreground">{min.toFixed(2)}</div>
    </div>
  )
}
