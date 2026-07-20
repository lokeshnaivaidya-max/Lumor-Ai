"use client"

import { useMemo, useState, useCallback, useRef, useEffect } from "react"
import { motion } from "motion/react"
import type { Indicators } from "@/lib/indicators"

export type Candle = { t: number; c: number; h: number; l: number; o: number }

type IndicatorToggle = "ema20" | "ema50" | "ema200" | "sma50" | "vwap" | "bollinger" | "rsi" | "macd"

const TOGGLES: { key: IndicatorToggle; label: string }[] = [
  { key: "ema20", label: "EMA 20" },
  { key: "ema50", label: "EMA 50" },
  { key: "ema200", label: "EMA 200" },
  { key: "sma50", label: "SMA 50" },
  { key: "vwap", label: "VWAP" },
  { key: "bollinger", label: "Bollinger" },
  { key: "rsi", label: "RSI" },
  { key: "macd", label: "MACD" },
]

function colourFor(key: IndicatorToggle): string {
  const map: Record<string, string> = {
    ema20: "oklch(0.55 0.18 255)",
    ema50: "oklch(0.75 0.1 85)",
    ema200: "oklch(0.58 0.18 22)",
    sma50: "oklch(0.65 0.16 168)",
    vwap: "oklch(0.48 0.16 280)",
    bollinger: "oklch(0.6 0.15 195)",
  }
  return map[key] ?? "oklch(0.6 0.2 255)"
}

export function PriceChart({
  candles,
  positive,
  indicators,
  height = 360,
}: {
  candles: Candle[]
  positive: boolean
  indicators?: Indicators
  height?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(900)
  const [hover, setHover] = useState<number | null>(null)
  const [activeIndicators, setActiveIndicators] = useState<Set<IndicatorToggle>>(new Set())

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const toggleIndicator = useCallback((key: IndicatorToggle) => {
    setActiveIndicators((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const showRSI = activeIndicators.has("rsi")
  const showMACD = activeIndicators.has("macd")
  const subChartCount = (showRSI ? 1 : 0) + (showMACD ? 1 : 0)
  const subHeight = subChartCount > 0 ? 80 : 0
  const totalHeight = height + subHeight
  const mainHeight = height

  const { path, area, min, max, pts, first, last, gridLines } = useMemo(() => {
    const closes = candles.map((c) => c.c)
    const mn = closes.length ? Math.min(...closes) : 0
    const mx = closes.length ? Math.max(...closes) : 1
    const rng = mx - mn || 1
    const padX = 12
    const padY = 24
    const w = width - padX * 2
    const h = mainHeight - padY * 2
    const p = candles.map((c, i) => {
      const x = padX + (i / Math.max(1, candles.length - 1)) * w
      const y = padY + h - ((c.c - mn) / rng) * h
      return { x, y }
    })
    const pt = p.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ")
    const ar = `${pt} L ${p[p.length - 1]?.x.toFixed(2)} ${mainHeight - padY} L ${p[0]?.x.toFixed(2)} ${mainHeight - padY} Z`
    const gl = [0.2, 0.35, 0.5, 0.65, 0.8].map((g) => ({
      y: mainHeight * g,
      label: (mx - (mx - mn) * g).toFixed(2),
    }))
    return { path: pt, area: ar, min: mn, max: mx, pts: p, first: p[0], last: p[p.length - 1], gridLines: gl }
  }, [candles, mainHeight, width])

  const { bollUpper, bollMiddle, bollLower, bollArea } = useMemo(() => {
    if (!indicators?.bollinger) return {}
    const b = indicators.bollinger
    const mn = min
    const mx = max
    const rng = mx - mn || 1
    const padX = 12
    const padY = 24
    const w = width - padX * 2
    const h = mainHeight - padY * 2
    const upperPts = candles.map((c, i) => {
      const x = padX + (i / Math.max(1, candles.length - 1)) * w
      const y = padY + h - ((b.upper - mn) / rng) * h
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`
    }).join(" ")
    const lowerPts = candles.map((c, i) => {
      const x = padX + (i / Math.max(1, candles.length - 1)) * w
      const y = padY + h - ((b.lower - mn) / rng) * h
      return `${i === candles.length - 1 ? "L" : ""} ${x.toFixed(2)} ${y.toFixed(2)}`
    }).reverse().join(" ")
    return {
      bollUpper: upperPts,
      bollMiddle: indicators.bollinger ? (() => {
        const middle = indicators.bollinger!.middle
        return candles.map((c, i) => {
          const x = padX + (i / Math.max(1, candles.length - 1)) * w
          const y = padY + h - ((middle - mn) / rng) * h
          return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`
        }).join(" ")
      })() : "",
      bollLower: lowerPts,
      bollArea: `${upperPts} ${lowerPts} Z`,
    }
  }, [indicators, candles, min, max, mainHeight, width])

  const overlayLines = useMemo(() => {
    if (!indicators || candles.length < 2) return []
    const result: { key: IndicatorToggle; path: string; color: string }[] = []
    const mn = min
    const mx = max
    const rng = mx - mn || 1
    const padX = 12
    const padY = 24
    const w = width - padX * 2
    const h = mainHeight - padY * 2

    if (activeIndicators.has("ema20") && indicators.ema20 != null) {
      const pts = candles.map((c, i) => {
        const x = padX + (i / Math.max(1, candles.length - 1)) * w
        return { x, y: padY + h - ((indicators.ema20! - mn) / rng) * h }
      })
      result.push({ key: "ema20", path: pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" "), color: colourFor("ema20") })
    }
    if (activeIndicators.has("ema50") && indicators.ema50 != null) {
      const pts = candles.map((c, i) => {
        const x = padX + (i / Math.max(1, candles.length - 1)) * w
        return { x, y: padY + h - ((indicators.ema50! - mn) / rng) * h }
      })
      result.push({ key: "ema50", path: pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" "), color: colourFor("ema50") })
    }
    if (activeIndicators.has("ema200") && indicators.ema200 != null) {
      const pts = candles.map((c, i) => {
        const x = padX + (i / Math.max(1, candles.length - 1)) * w
        return { x, y: padY + h - ((indicators.ema200! - mn) / rng) * h }
      })
      result.push({ key: "ema200", path: pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" "), color: colourFor("ema200") })
    }
    if (activeIndicators.has("sma50") && indicators.sma50 != null) {
      const pts = candles.map((c, i) => {
        const x = padX + (i / Math.max(1, candles.length - 1)) * w
        return { x, y: padY + h - ((indicators.sma50! - mn) / rng) * h }
      })
      result.push({ key: "sma50", path: pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" "), color: colourFor("sma50") })
    }
    if (activeIndicators.has("vwap") && indicators.vwap != null) {
      const pts = candles.map((c, i) => {
        const x = padX + (i / Math.max(1, candles.length - 1)) * w
        return { x, y: padY + h - ((indicators.vwap! - mn) / rng) * h }
      })
      result.push({ key: "vwap", path: pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" "), color: colourFor("vwap") })
    }
    return result
  }, [indicators, candles, activeIndicators, min, max, mainHeight, width])

  const rsiData = useMemo(() => {
    if (!showRSI || !indicators?.rsi) return null
    const rsi = indicators.rsi
    return { value: rsi }
  }, [showRSI, indicators])

  const macdData = useMemo(() => {
    if (!showMACD || !indicators?.macd) return null
    return indicators.macd
  }, [showMACD, indicators])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
      const rel = ((e.clientX - rect.left) / rect.width) * width
      let best = 0
      let bd = Infinity
      pts.forEach((p, i) => {
        const d = Math.abs(p.x - rel)
        if (d < bd) { bd = d; best = i }
      })
      setHover(best)
    },
    [pts, width],
  )

  const handleMouseLeave = useCallback(() => setHover(null), [])

  if (!candles.length) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height: totalHeight }}>
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
      <div className="flex flex-wrap gap-1.5 px-4 pt-3">
        {TOGGLES.map((t) => (
          <button
            key={t.key}
            onClick={() => toggleIndicator(t.key)}
            className={`chip transition-colors ${activeIndicators.has(t.key) ? "" : "hover:text-[var(--text-primary)]"}`}
            style={activeIndicators.has(t.key) ? { background: "var(--gold)", color: "#1a1407" } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${width} ${totalHeight}`}
        className="relative w-full"
        style={{ height: totalHeight }}
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
            <line x1="0" x2={width} y1={gl.y} y2={gl.y} stroke="var(--line-faint, oklch(0.99 0 0 / 0.06))" strokeWidth="1" strokeDasharray="4 4" />
            <text x={width - 8} y={gl.y - 4} fill="var(--text-tertiary)" fontSize="10" fontFamily="monospace" textAnchor="end">
              {gl.label}
            </text>
          </g>
        ))}

        {bollArea && bollUpper && (
          <>
            <motion.path d={bollArea} fill="oklch(0.6 0.15 195 / 0.08)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
            <motion.path d={bollUpper} fill="none" stroke="oklch(0.6 0.15 195)" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
            <motion.path d={bollMiddle} fill="none" stroke="oklch(0.6 0.15 195)" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
            <motion.path d={bollLower} fill="none" stroke="oklch(0.6 0.15 195)" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
          </>
        )}

        {overlayLines.map((ol) => (
          <motion.path
            key={ol.key}
            d={ol.path}
            fill="none"
            stroke={ol.color}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ duration: 0.6 }}
          />
        ))}

        <motion.path d={area} fill={`url(#${gradId})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
        <motion.path d={path} fill="none" stroke={tone} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0, opacity: 0.4 }} animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          style={{ filter: `url(#${glowId})` }}
        />
        <motion.path d={path} fill="none" stroke={tone} strokeWidth="8" strokeLinejoin="round" strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          style={{ filter: `url(#${glowId})`, opacity: 0.2 }}
        />

        {last && (
          <>
            <circle cx={last.x} cy={last.y} r="12" fill={tone} opacity="0.12" />
            <circle cx={last.x} cy={last.y} r="4" fill={tone} />
            <circle cx={last.x} cy={last.y} r="4" fill="var(--surface)" opacity="0.5" />
          </>
        )}
        {first && <circle cx={first.x} cy={first.y} r="3" fill={tone} opacity="0.4" />}

        {hp && (
          <>
            <line x1={hp.x} y1={hp.y - 8} x2={hp.x} y2={0} stroke={tone} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
            <line x1={hp.x} y1={hp.y + 8} x2={hp.x} y2={mainHeight} stroke={tone} strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
            <line x1={pts[0]?.x ?? 0} y1={hp.y} x2={hp.x} y2={hp.y} stroke="var(--text-tertiary)" strokeWidth="1" strokeDasharray="2 3" opacity="0.35" />
          </>
        )}

        {crosshairX !== null && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
            <motion.line x1={crosshairX} y1={0} x2={crosshairX} y2={mainHeight} stroke="var(--text-tertiary)" strokeWidth="1" vectorEffect="non-scaling-stroke" opacity="0.3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
            <motion.circle cx={hp!.x} cy={hp!.y} r="12" fill={tone} opacity="0.15" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }} />
            <motion.circle cx={hp!.x} cy={hp!.y} r="5" fill={tone} stroke="var(--surface)" strokeWidth="2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }} />
            <motion.circle cx={hp!.x} cy={hp!.y} r="14" fill="none" stroke={tone} strokeWidth="1" opacity="0.3" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.05 }} />
          </motion.g>
        )}

        {showRSI && rsiData && (
          <g>
            <line x1={0} x2={width} y1={mainHeight + 20} y2={mainHeight + 20} stroke="var(--line-faint, oklch(0.99 0 0 / 0.08))" strokeWidth="1" />
            <line x1={0} x2={width} y1={mainHeight + 60} y2={mainHeight + 60} stroke="var(--line-faint, oklch(0.99 0 0 / 0.08))" strokeWidth="1" />
            <text x={4} y={mainHeight + 14} fill="var(--text-tertiary)" fontSize="9" fontFamily="monospace">RSI {indicators?.rsi?.toFixed(1)}</text>
            <text x={4} y={mainHeight + 34} fill="var(--text-tertiary)" fontSize="8" fontFamily="monospace">70</text>
            <text x={4} y={mainHeight + 74} fill="var(--text-tertiary)" fontSize="8" fontFamily="monospace">30</text>
            <motion.path
              d={candles.map((c, i) => {
                const x = 12 + (i / Math.max(1, candles.length - 1)) * (width - 24)
                const rsiVal = rsiData?.value ?? 50
                const y = mainHeight + 40 - ((rsiVal - 0) / 100) * 40
                return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`
              }).join(" ")}
              fill="none" stroke="var(--info)" strokeWidth="1.5" opacity="0.8"
              initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ duration: 0.8 }}
            />
          </g>
        )}

        {showMACD && macdData && (
          <g>
            <line x1={0} x2={width} y1={mainHeight + (showRSI ? 80 : 20)} y2={mainHeight + (showRSI ? 80 : 20)} stroke="var(--line-faint, oklch(0.99 0 0 / 0.08))" strokeWidth="1" />
            <text x={4} y={mainHeight + (showRSI ? 80 : 20) - 6} fill="var(--text-tertiary)" fontSize="9" fontFamily="monospace">
              MACD {macdData.macd.toFixed(2)} / Signal {macdData.signal.toFixed(2)} / Hist {macdData.histogram.toFixed(2)}
            </text>
            <motion.path
              d={candles.map((c, i) => {
                const x = 12 + (i / Math.max(1, candles.length - 1)) * (width - 24)
                const macdVal = (() => {
                  const closes = candles.map(c => c.c)
                  const ema12 = closes.reduce((a, b) => a + (b - a) * 2 / 13, closes[0])
                  const ema26 = closes.reduce((a, b) => a + (b - a) * 2 / 27, closes[0])
                  return ema12 - ema26
                })()
                const yBase = mainHeight + (showRSI ? 80 : 20)
                const y = yBase + 20
                return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`
              }).join(" ")}
              fill="none" stroke="var(--pos)" strokeWidth="1" opacity="0.6"
              initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ duration: 0.8 }}
            />
          </g>
        )}
      </svg>

      {hc && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="glass pointer-events-none absolute left-4 top-[52px] rounded-2xl border px-4 py-3 text-xs shadow-xl"
          style={{ borderColor: "var(--gold-line)" }}
        >
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tone }} />
            <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
              {hc.c.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-1 text-muted-foreground/80">
            {new Date(hc.t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </motion.div>
      )}

      <div className="pointer-events-none absolute right-3 top-12 font-mono text-[11px] text-muted-foreground/60 tabular-nums">
        {max.toFixed(2)}
      </div>
      <div className="pointer-events-none absolute right-3 font-mono text-[11px] text-muted-foreground/60 tabular-nums"
        style={{ bottom: subHeight + 4 }}>
        {min.toFixed(2)}
      </div>
    </div>
  )
}
