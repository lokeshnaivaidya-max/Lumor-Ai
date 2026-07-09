"use client"

import { motion } from "motion/react"
import type { Indicators } from "@/lib/indicators"

function fmt(n: number | null, d = 2) {
  return n == null ? "—" : n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" | "muted" }) {
  const color = tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : "text-foreground"
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2.5 last:border-0">
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
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="edge-light rounded-[1.5rem] glass-panel p-5"
    >
      <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">{title}</h3>
      {children}
    </motion.div>
  )
}

export function IndicatorPanel({ ind, currency }: { ind: Indicators; currency: string }) {
  void currency
  const rsiTone = ind.rsi == null ? "muted" : ind.rsi > 70 ? "neg" : ind.rsi < 30 ? "pos" : undefined
  const macdTone = ind.macd ? (ind.macd.histogram >= 0 ? "pos" : "neg") : "muted"
  const rsiPct = ind.rsi == null ? 0 : Math.max(0, Math.min(100, ind.rsi))

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Panel title="Momentum" delay={0}>
        {/* RSI gauge */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">RSI (14)</span>
            <span className={`font-mono text-sm tabular-nums ${rsiTone === "neg" ? "text-neg" : rsiTone === "pos" ? "text-pos" : "text-foreground"}`}>
              {fmt(ind.rsi)}
            </span>
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="absolute inset-y-0 left-[30%] w-px bg-white/20" />
            <div className="absolute inset-y-0 left-[70%] w-px bg-white/20" />
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: `${rsiPct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background:
                  rsiTone === "neg"
                    ? "oklch(0.68 0.19 22)"
                    : rsiTone === "pos"
                      ? "oklch(0.8 0.14 168)"
                      : "linear-gradient(90deg, oklch(0.68 0.17 250), oklch(0.8 0.14 168))",
              }}
            />
          </div>
        </div>
        <Stat label="MACD" value={ind.macd ? fmt(ind.macd.macd) : "—"} tone={macdTone} />
        <Stat label="Signal" value={ind.macd ? fmt(ind.macd.signal) : "—"} />
        <Stat label="Histogram" value={ind.macd ? fmt(ind.macd.histogram) : "—"} tone={macdTone} />
        <Stat label="ATR (14)" value={fmt(ind.atr)} />
      </Panel>

      <Panel title="Trend" delay={0.06}>
        <div className="mb-3 flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              ind.trend === "bullish"
                ? "bg-pos/15 text-pos"
                : ind.trend === "bearish"
                  ? "bg-neg/15 text-neg"
                  : "bg-white/10 text-muted-foreground"
            }`}
          >
            {ind.trend.toUpperCase()}
          </span>
        </div>
        <Stat label="EMA 20" value={fmt(ind.ema20)} />
        <Stat label="EMA 50" value={fmt(ind.ema50)} />
        <Stat label="EMA 200" value={fmt(ind.ema200)} />
        <Stat label="SMA 50" value={fmt(ind.sma50)} />
      </Panel>

      <Panel title="Bollinger Bands" delay={0.12}>
        <Stat label="Upper" value={ind.bollinger ? fmt(ind.bollinger.upper) : "—"} />
        <Stat label="Middle" value={ind.bollinger ? fmt(ind.bollinger.middle) : "—"} />
        <Stat label="Lower" value={ind.bollinger ? fmt(ind.bollinger.lower) : "—"} />
        <Stat label="Support" value={fmt(ind.support)} tone="pos" />
        <Stat label="Resistance" value={fmt(ind.resistance)} tone="neg" />
      </Panel>

      <Panel title="Fibonacci Retracement" delay={0.18}>
        {ind.fib ? (
          Object.entries(ind.fib).map(([k, v]) => <Stat key={k} label={k} value={fmt(v)} />)
        ) : (
          <p className="py-2 text-xs text-muted-foreground">Insufficient data</p>
        )}
      </Panel>
    </div>
  )
}
