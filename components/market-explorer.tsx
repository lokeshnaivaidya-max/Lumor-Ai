"use client"

import useSWR from "swr"
import dynamic from "next/dynamic"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { SymbolSearch } from "@/components/symbol-search"
import { computeIndicators } from "@/lib/indicators"
import { REGION_CONFIG, type Quote, type Region, type Candle } from "@/lib/market"
import { TrendingUp, TrendingDown, Clock, Globe } from "lucide-react"

// Heavy, below-the-fold pieces are code-split so first paint stays light.
const PriceChart = dynamic(() => import("@/components/price-chart").then((m) => m.PriceChart), {
  ssr: false,
  loading: () => <ChartSkeleton />,
})
const IndicatorPanel = dynamic(() => import("@/components/indicator-panel").then((m) => m.IndicatorPanel), { ssr: false })
const AiAnalysis = dynamic(() => import("@/components/ai-analysis").then((m) => m.AiAnalysis), { ssr: false })
const NewsPanel = dynamic(() => import("@/components/news-panel").then((m) => m.NewsPanel), { ssr: false })

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const RANGES = ["1d", "5d", "1mo", "6mo", "1y", "5y"] as const
const REGIONS: Region[] = ["US", "IN", "GB", "JP", "GLOBAL"]

const STATE_LABEL: Record<string, string> = {
  REGULAR: "Open",
  PRE: "Pre-market",
  POST: "After hours",
  CLOSED: "Closed",
}

function money(n: number | undefined, ccy: string) {
  if (n == null) return "—"
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${ccy ? " " + ccy : ""}`
}

function bigNum(n?: number) {
  if (n == null) return "—"
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toLocaleString()
}

function ChartSkeleton() {
  return (
    <div className="glass-card flex h-80 items-center justify-center text-sm text-muted-foreground">
      <Clock className="mr-2 h-4 w-4 animate-spin" />
      Loading chart…
    </div>
  )
}

export function MarketExplorer({ initialSymbol }: { initialSymbol: string }) {
  const [symbol, setSymbol] = useState(initialSymbol)
  const [range, setRange] = useState<(typeof RANGES)[number]>("6mo")
  const [region, setRegion] = useState<Region>("US")

  // Auto-detect the visitor's region once, then let them switch manually.
  useEffect(() => {
    let active = true
    fetch("/api/region")
      .then((r) => r.json())
      .then((d) => {
        if (active && d?.region) setRegion(d.region as Region)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const { data: quoteData } = useSWR<{ quotes: Quote[] }>(`/api/quote?symbols=${encodeURIComponent(symbol)}`, fetcher, {
    refreshInterval: 15000,
    keepPreviousData: true,
  })
  const { data: chartData, isLoading: chartLoading } = useSWR<{ candles: Candle[] }>(
    `/api/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`,
    fetcher,
    { keepPreviousData: true },
  )

  const quote = quoteData?.quotes?.[0] ?? null
  const candles = useMemo(() => chartData?.candles ?? [], [chartData])
  const positive = (quote?.changePercent ?? 0) >= 0
  const ccy = quote?.currency ?? ""

  const indicators = useMemo(() => computeIndicators(candles), [candles])

  const handleSelect = useCallback((s: string) => setSymbol(s), [])
  const handleRegion = useCallback((r: Region) => setRegion(r), [])

  const watchlist = REGION_CONFIG[region].watchlist

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-32">
      <div className="flex flex-col items-start gap-4 pb-6 pt-4">
        <SymbolSearch onSelect={handleSelect} />

        {/* Region + quick watchlist */}
        <div className="flex w-full flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-black/20 p-0.5">
            <Globe className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => handleRegion(r)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  region === r ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {watchlist.slice(0, 7).map((w) => (
              <button
                key={w}
                onClick={() => handleSelect(w)}
                className={`rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                  symbol === w
                    ? "border-accent/50 bg-accent/10 text-accent"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quote header */}
      <QuoteHeader quote={quote} symbol={symbol} positive={positive} />

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
        {chartLoading && !candles.length ? <ChartSkeleton /> : <PriceChart candles={candles} positive={positive} />}
      </div>

      {/* Fundamentals + stats */}
      <StatsGrid quote={quote} ccy={ccy} />

      {/* AI analysis */}
      <div className="mt-6">
        <AiAnalysis symbol={symbol} />
      </div>

      {/* News + sentiment */}
      <div className="mt-6">
        <NewsPanel symbol={symbol} />
      </div>

      {/* Indicators */}
      <h2 className="mb-4 mt-12 font-heading text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Technical Indicators
      </h2>
      <IndicatorPanel ind={indicators} />
    </div>
  )
}

const QuoteHeader = memo(function QuoteHeader({
  quote,
  symbol,
  positive,
}: {
  quote: Quote | null
  symbol: string
  positive: boolean
}) {
  return (
    <div className="glass-card relative overflow-hidden p-6 sm:p-8">
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
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            {quote?.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={quote.logoUrl || "/placeholder.svg"}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg bg-white/5 object-contain"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = "none"
                }}
              />
            )}
            <h1 className="font-heading text-3xl tracking-tight text-foreground">{quote?.symbol ?? symbol}</h1>
            <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
              {quote?.exchange || "—"}
            </span>
            {quote?.assetType && (
              <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
                {quote.assetType}
              </span>
            )}
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
          {(quote?.sector || quote?.industry) && (
            <p className="mt-1 max-w-md truncate text-xs text-muted-foreground/70">
              {[quote?.sector, quote?.industry].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        <div className="text-right">
          <div className="font-mono text-4xl tracking-tight text-foreground sm:text-5xl">
            {quote ? quote.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
          </div>
          {quote && (
            <div className={`mt-1.5 flex items-center justify-end gap-1.5 font-mono text-sm ${positive ? "text-pos" : "text-neg"}`}>
              {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {positive ? "+" : ""}
              {quote.change.toFixed(2)} ({positive ? "+" : ""}
              {quote.changePercent.toFixed(2)}%)
            </div>
          )}
          {quote?.currency && <div className="mt-1 text-[11px] text-muted-foreground">{quote.currency}</div>}
        </div>
      </div>
    </div>
  )
})

const StatsGrid = memo(function StatsGrid({ quote, ccy }: { quote: Quote | null; ccy: string }) {
  const stats: { label: string; value: string }[] = [
    { label: "Prev Close", value: money(quote?.previousClose, ccy) },
    { label: "Open", value: money(quote?.open, ccy) },
    { label: "Day High", value: money(quote?.dayHigh, ccy) },
    { label: "Day Low", value: money(quote?.dayLow, ccy) },
    {
      label: "52W Range",
      value:
        quote?.fiftyTwoWeekLow != null && quote?.fiftyTwoWeekHigh != null
          ? `${quote.fiftyTwoWeekLow.toFixed(0)}–${quote.fiftyTwoWeekHigh.toFixed(0)}`
          : "—",
    },
    { label: "Volume", value: bigNum(quote?.volume) },
    { label: "Market Cap", value: bigNum(quote?.marketCap) },
    { label: "P/E (TTM)", value: quote?.trailingPE != null ? quote.trailingPE.toFixed(2) : "—" },
    { label: "EPS", value: quote?.eps != null ? quote.eps.toFixed(2) : "—" },
    { label: "Div Yield", value: quote?.dividendYield != null ? `${quote.dividendYield.toFixed(2)}%` : "—" },
    { label: "Beta", value: quote?.beta != null ? quote.beta.toFixed(2) : "—" },
    {
      label: "Updated",
      value: quote?.updatedAt ? new Date(quote.updatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—",
    },
  ]
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="glass-card px-4 py-3.5 transition-colors hover:border-foreground/20">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
          <div className="mt-1 font-mono text-sm text-foreground">{s.value}</div>
        </div>
      ))}
    </div>
  )
})
