"use client"

import type { Indicators } from "@/lib/indicators"

function fmt(n: number | null, d = 2) {
  return n == null ? "—" : n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" | "muted" }) {
  const color = tone === "pos" ? "text-[var(--pos)]" : tone === "neg" ? "text-[var(--neg)]" : "text-foreground"
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`font-mono text-sm ${color}`}>{value}</span>
    </div>
  )
}

export function IndicatorPanel({ ind, currency }: { ind: Indicators; currency: string }) {
  const rsiTone = ind.rsi == null ? "muted" : ind.rsi > 70 ? "neg" : ind.rsi < 30 ? "pos" : undefined
  const macdTone = ind.macd ? (ind.macd.histogram >= 0 ? "pos" : "neg") : "muted"

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card/50 p-5">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Momentum</h3>
        <Stat label="RSI (14)" value={fmt(ind.rsi)} tone={rsiTone} />
        <Stat
          label="MACD"
          value={ind.macd ? fmt(ind.macd.macd) : "—"}
          tone={macdTone}
        />
        <Stat label="Signal" value={ind.macd ? fmt(ind.macd.signal) : "—"} />
        <Stat label="Histogram" value={ind.macd ? fmt(ind.macd.histogram) : "—"} tone={macdTone} />
        <Stat label="ATR (14)" value={fmt(ind.atr)} />
      </div>

      <div className="rounded-2xl border border-border bg-card/50 p-5">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Trend</h3>
        <Stat
          label="Signal"
          value={ind.trend.toUpperCase()}
          tone={ind.trend === "bullish" ? "pos" : ind.trend === "bearish" ? "neg" : "muted"}
        />
        <Stat label="EMA 20" value={fmt(ind.ema20)} />
        <Stat label="EMA 50" value={fmt(ind.ema50)} />
        <Stat label="EMA 200" value={fmt(ind.ema200)} />
        <Stat label="SMA 50" value={fmt(ind.sma50)} />
      </div>

      <div className="rounded-2xl border border-border bg-card/50 p-5">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Bollinger Bands</h3>
        <Stat label="Upper" value={ind.bollinger ? fmt(ind.bollinger.upper) : "—"} />
        <Stat label="Middle" value={ind.bollinger ? fmt(ind.bollinger.middle) : "—"} />
        <Stat label="Lower" value={ind.bollinger ? fmt(ind.bollinger.lower) : "—"} />
        <Stat label="Support" value={fmt(ind.support)} tone="pos" />
        <Stat label="Resistance" value={fmt(ind.resistance)} tone="neg" />
      </div>

      <div className="rounded-2xl border border-border bg-card/50 p-5">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Fibonacci Retracement
        </h3>
        {ind.fib ? (
          Object.entries(ind.fib).map(([k, v]) => <Stat key={k} label={k} value={fmt(v)} />)
        ) : (
          <p className="py-2 text-xs text-muted-foreground">Insufficient data</p>
        )}
      </div>
    </div>
  )
}
