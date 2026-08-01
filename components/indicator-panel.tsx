"use client"

import { memo } from "react"
import { motion } from "motion/react"
import type { Indicators } from "@/lib/indicators"

function fmt(n: number | null | undefined, d = 2) {
  return n == null ? "—" : n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" | "muted" }) {
  const color = tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : "text-foreground"
  return (
    <div className="flex items-center justify-between border-b border-[var(--line)] py-2.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`font-mono text-sm tabular-nums ${color}`}>{value}</span>
    </div>
  )
}

function Panel({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, borderColor: "var(--gold-line)" }}
      className="glass-card group relative overflow-hidden rounded-[28px] p-5 transition-colors duration-300"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "var(--gold-glow)" }}
      />
      <h3 className="relative mb-3 font-heading text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">{title}</h3>
      <div className="relative">{children}</div>
    </motion.div>
  )
}

function IndicatorPanelBase({ ind }: { ind: Indicators; currency?: string }) {
  const rsiTone = ind.rsi == null ? "muted" : ind.rsi > 70 ? "neg" : ind.rsi < 30 ? "pos" : undefined
  const macdTone = ind.macd ? (ind.macd.histogram >= 0 ? "pos" : "neg") : "muted"
  const rsiPct = ind.rsi == null ? 0 : Math.max(0, Math.min(100, ind.rsi))
  const stochTone = ind.stochRsi == null ? "muted" : ind.stochRsi.k > 80 ? "neg" : ind.stochRsi.k < 20 ? "pos" : undefined

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Panel title="Momentum" delay={0}>
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">RSI (14)</span>
            <span
              className={`font-mono text-sm tabular-nums ${rsiTone === "neg" ? "text-neg" : rsiTone === "pos" ? "text-pos" : "text-foreground"}`}
            >
              {fmt(ind.rsi, 1)}
            </span>
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-full" style={{ background: "var(--panel-2)" }}>
            <div className="absolute inset-y-0 left-[30%] w-px" style={{ background: "var(--line-strong)" }} />
            <div className="absolute inset-y-0 left-[70%] w-px" style={{ background: "var(--line-strong)" }} />
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: `${rsiPct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background:
                  rsiTone === "neg"
                    ? "oklch(0.58 0.18 22)"
                    : rsiTone === "pos"
                      ? "oklch(0.62 0.16 168)"
                      : "linear-gradient(90deg, oklch(0.55 0.18 255), oklch(0.62 0.16 168))",
              }}
            />
          </div>
        </div>
        <Stat label="Stoch RSI %K" value={ind.stochRsi ? fmt(ind.stochRsi.k, 1) : "—"} tone={stochTone} />
        <Stat label="MACD" value={ind.macd ? fmt(ind.macd.macd) : "—"} tone={macdTone} />
        <Stat label="Signal" value={ind.macd ? fmt(ind.macd.signal) : "—"} />
        <Stat label="Histogram" value={ind.macd ? fmt(ind.macd.histogram) : "—"} tone={macdTone} />
      </Panel>

      <Panel title="Trend" delay={0.06}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`chip ${ind.trend === "bullish" ? "chip-pos" : ind.trend === "bearish" ? "chip-neg" : ""}`}
          >
            {ind.trend.toUpperCase()}
          </span>
          <span className="chip">{ind.trendStrength} strength</span>
          <span className="chip">{ind.momentum}</span>
        </div>
        <Stat label="ADX (14)" value={fmt(ind.adx, 1)} />
        <Stat label="EMA 20" value={fmt(ind.ema20)} />
        <Stat label="EMA 50" value={fmt(ind.ema50)} />
        <Stat label="EMA 200" value={fmt(ind.ema200)} />
      </Panel>

      <Panel title="Volatility & Value" delay={0.12}>
        <Stat label="Bollinger Upper" value={ind.bollinger ? fmt(ind.bollinger.upper) : "—"} />
        <Stat label="Bollinger Middle" value={ind.bollinger ? fmt(ind.bollinger.middle) : "—"} />
        <Stat label="Bollinger Lower" value={ind.bollinger ? fmt(ind.bollinger.lower) : "—"} />
        <Stat label="ATR (14)" value={fmt(ind.atr)} />
        <Stat label="VWAP" value={fmt(ind.vwap)} />
      </Panel>

      <Panel title="Key Levels" delay={0.18}>
        <Stat label="Support (60d)" value={fmt(ind.support)} tone="pos" />
        <Stat label="Resistance (60d)" value={fmt(ind.resistance)} tone="neg" />
        <Stat label="SMA 50" value={fmt(ind.sma50)} />
        {ind.fib ? (
          <>
            <Stat label="Fib 0.382" value={fmt(ind.fib["0.382"])} />
            <Stat label="Fib 0.618" value={fmt(ind.fib["0.618"])} />
          </>
        ) : null}
      </Panel>
    </div>
  )
}

export const IndicatorPanel = memo(IndicatorPanelBase)
