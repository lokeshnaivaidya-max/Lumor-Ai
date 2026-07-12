"use client"

import { useMemo, useState, useCallback, useRef, useEffect } from "react"
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(900)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { path, area, min, max, pts, first, last, gridLines } = useMemo(() => {
    const closes = candles.map((c) => c.c)
    const min = closes.length ? Math.min(...closes) : 0
    const max = closes.length ? Math.max(...closes) : 1
    const range = max - min || 1
    const padX = 12
    const padY = 24
    const w = width - padX * 2
    const h = height - padY * 2
    const pts = candles.map((c, i) => {
      const x = padX + (i / Math.max(1, candles.length - 1)) * w
      const y = padY + h - ((c.c - min) / range) * h
      return { x, y }
    })
    const path = pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ")
    const area = `${path} L ${pts[pts.length - 1]?.x.toFixed(2)} ${height - padY} L ${pts[0]?.x.toFixed(2)} ${height - padY} Z`
    const gridLines = [0.2, 0.35, 0.5, 0.65, 0.8].map((g) => ({
      y: height * g,
      label: (max - (max - min) * g).toFixed(2),
    }))
    return { path, area, min, max, pts, first: pts[0], last: pts[pts.length - 1], gridLines }
  }, [candles, height, width])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
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
    },
    [pts, width],
  )

  const handleMouseLeave = useCallback(() => setHover(null), [])

  if (!candles.length) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        No chart data available
      </div>
    )
  }

  const tone = positive ? "oklch(0.62 0.16 168)" : "oklch(0.58 0.18 22)"
  const gradId = positive ? "chart-pos" : "chart-neg"
  const glowId = positive ? "glow-pos" : "glow-neg"
  const hp = hover != null ? pts[hover] : null
  const hc = hover != null ? candles[hover] : null
  const crosshairX = hp?.x ?? null

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="relative w-full"
        style={{ height }}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tone} stopOpacity="0.4" />
            <stop offset="30%" stopColor={tone} stopOpacity="0.15" />
            <stop offset="100%" stopColor={tone} stopOpacity="0" />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {gridLines.map((gl, i) => (
          <g key={i}>
            <line
              x1="0" x2={width}
              y1={gl.y} y2={gl.y}
              stroke="oklch(0.99 0 0 / 0.04)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x={width - 8} y={gl.y - 4}
              fill="oklch(0.99 0 0 / 0.25)"
              fontSize="10"
              fontFamily="monospace"
              textAnchor="end"
            >
              {gl.label}
            </text>
          </g>
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
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          style={{ filter: `url(#${glowId})` }}
        />

        <motion.path
          key={`glow-${path}`}
          d={path}
          fill="none"
          stroke={tone}
          strokeWidth="8"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          style={{ filter: `url(#${glowId})`, opacity: 0.2 }}
        />

        {last && (
          <>
            <circle cx={last.x} cy={last.y} r="12" fill={tone} opacity="0.12" />
            <circle cx={last.x} cy={last.y} r="4" fill={tone} />
            <circle cx={last.x} cy={last.y} r="4" fill="oklch(0.99 0 0)" opacity="0.5" />
          </>
        )}

        {first && <circle cx={first.x} cy={first.y} r="3" fill={tone} opacity="0.4" />}

        {hp && (
          <>
            <line
              x1={hp.x} y1={hp.y - 8}
              x2={hp.x} y2={0}
              stroke={tone}
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.5"
            />
            <line
              x1={hp.x} y1={hp.y + 8}
              x2={hp.x} y2={height}
              stroke={tone}
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.3"
            />
            <line
              x1={pts[0]?.x ?? 0} y1={hp.y}
              x2={hp.x} y2={hp.y}
              stroke="oklch(0.99 0 0 / 0.15)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
          </>
        )}

        {crosshairX !== null && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <motion.line
              x1={crosshairX} y1={0}
              x2={crosshairX} y2={height}
              stroke="oklch(0.99 0 0 / 0.12)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            <motion.circle
              cx={hp!.x} cy={hp!.y}
              r="12"
              fill={tone}
              opacity="0.15"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            />
            <motion.circle
              cx={hp!.x} cy={hp!.y}
              r="5"
              fill={tone}
              stroke="oklch(0.99 0 0)"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            />
            <motion.circle
              cx={hp!.x} cy={hp!.y}
              r="14"
              fill="none"
              stroke={tone}
              strokeWidth="1"
              opacity="0.3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.05 }}
            />
          </motion.g>
        )}
      </svg>

      {hc && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="pointer-events-none absolute left-4 top-4 rounded-2xl border bg-background/70 px-4 py-3 text-xs backdrop-blur-xl shadow-xl"
          style={{ borderColor: `${tone}33` }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: tone }}
            />
            <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
              {hc.c.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="mt-1 text-muted-foreground/80">
            {new Date(hc.t).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </motion.div>
      )}

      <div className="pointer-events-none absolute right-3 top-3 font-mono text-[11px] text-muted-foreground/60 tabular-nums">
        {max.toFixed(2)}
      </div>
      <div className="pointer-events-none absolute right-3 bottom-3 font-mono text-[11px] text-muted-foreground/60 tabular-nums">
        {min.toFixed(2)}
      </div>
    </div>
  )
}
