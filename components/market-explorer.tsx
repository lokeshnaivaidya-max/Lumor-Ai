"use client"

import useSWR from "swr"
import { useMemo, useState } from "react"
import { SymbolSearch } from "@/components/symbol-search"
import { PriceChart, type Candle } from "@/components/price-chart"
import { IndicatorPanel } from "@/components/indicator-panel"
import { AiAnalysis } from "@/components/ai-analysis"
import { computeIndicators } from "@/lib/indicators"
import type { Quote } from "@/lib/market"
import { TrendingUp, TrendingDown, Clock } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const RANGES = ["1d", "5d", "1mo", "6mo", "1y", "5y"] as const

const STATE_LABEL: Record<string, string> = {
  REGULAR: "Open",
  PRE: "Pre-market",
  POST: "After hours",
  CLOSED: "Closed",
}

function money(n: number | undefined, ccy: string) {
  if (n == null) return "—"
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${ccy}`
}

export function MarketExplorer({ initialSymbol }: { initialSymbol: string }) {
  const [symbol, setSymbol] = useState(initialSymbol)
  const [range, setRange] = useState<(typeof RANGES)[number]>("6mo")

  // The API responds with { quotes: Quote[] }, so we read the first entry.
  const { data: quoteData } = useSWR<{ quotes: Quote[] }>(`/api/quote?symbols=${symbol}`, fetcher, {
    refreshInterval: 15000,
  })
  const { data: chartData, isLoading: chartLoading } = useSWR<{ candles: Candle[] }>(
    `/api/chart?symbol=${symbol}&range=${range}`,
    fetcher,
  )

  const quote = quoteData?.quotes?.[0] ?? null
  const candles = chartData?.candles ?? []
  const positive = (quote?.changePercent ?? 0) >= 0

  const indicators = useMemo(() => computeIndicators(candles.map((c) => c.c)), [candles])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-32">
      <div className="flex flex-col items-start gap-6 pb-8 pt-4">
        <SymbolSearch onSelect={setSymbol} />
      </div>

      {/* Quote header */}
      <div className="glass-panel relative overflow-hidden rounded-[28px] p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl"
          style={{
            background: positive
              ? "radial-gradient(circle, oklch(0.72 0.15 155 / 0.14), transparent 70%)"
              : "radial-gradient(circle, oklch(0.62 0.2 20 / 0.14), transparent 70%)",
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-mono text-3xl tracking-tight text-foreground">{quote?.symbol ?? symbol}</h1>
              <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
                {quote?.exchange || "—"}
              </span>
              <span
                className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] ${
                  quote?.marketState === "REGULAR" ? "bg-pos/10 text-pos" : "bg-muted/40 text-muted-foreground"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${quote?.marketState === "REGULAR" ? "animate-pulse bg-pos" : "bg-muted-foreground"}`}
                />
                {STATE_LABEL[quote?.marketState ?? "CLOSED"]}
              </span>
            </div>
            <p className="mt-2 max-w-md truncate text-sm text-muted-foreground">{quote?.name ?? "Loading…"}</p>
          </div>

          <div className="text-right">
            <div className="font-mono text-4xl tracking-tight text-foreground sm:text-5xl">
              {quote ? quote.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
            </div>
            {quote && (
              <div
                className={`mt-1.5 flex items-center justify-end gap-1.5 font-mono text-sm ${
                  positive ? "text-pos" : "text-neg"
                }`}
              >
                {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {positive ? "+" : ""}
                {quote.change.toFixed(2)} ({positive ? "+" : ""}
                {quote.changePercent.toFixed(2)}%)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Range selector */}
      <div className="mt-5 flex items-center gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors ${
              range === r
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="mt-4 min-h-80">
        {chartLoading && !candles.length ? (
          <div className="flex h-80 items-center justify-center rounded-2xl border border-border bg-card/40 text-sm text-muted-foreground">
            <Clock className="mr-2 h-4 w-4 animate-spin" />
            Loading chart…
          </div>
        ) : (
          <PriceChart candles={candles} positive={positive} />
        )}
      </div>

      {/* Stats strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Prev Close" value={money(quote?.previousClose, quote?.currency ?? "")} />
        <MiniStat label="Day High" value={money(quote?.dayHigh, quote?.currency ?? "")} />
        <MiniStat label="Day Low" value={money(quote?.dayLow, quote?.currency ?? "")} />
        <MiniStat
          label="52W Range"
          value={
            quote?.fiftyTwoWeekLow != null && quote?.fiftyTwoWeekHigh != null
              ? `${quote.fiftyTwoWeekLow.toFixed(0)}–${quote.fiftyTwoWeekHigh.toFixed(0)}`
              : "—"
          }
        />
      </div>

      {/* AI analysis */}
      <div className="mt-6">
        <AiAnalysis symbol={symbol} />
      </div>

      {/* Indicators */}
      <h2 className="mb-4 mt-12 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Technical Indicators
      </h2>
      <IndicatorPanel ind={indicators} currency={quote?.currency ?? ""} />
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 px-4 py-3.5 transition-colors hover:border-foreground/20">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-sm text-foreground">{value}</div>
    </div>
  )
}
