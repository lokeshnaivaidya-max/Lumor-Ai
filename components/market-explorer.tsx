"use client"

import useSWR from "swr"
import dynamic from "next/dynamic"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, useMotionValue, useSpring, AnimatePresence } from "motion/react"
import { SymbolSearch } from "@/components/symbol-search"
import { computeIndicators } from "@/lib/indicators"
import { REGION_CONFIG, type Quote, type Region, type Candle } from "@/lib/market"
import { currencySymbol, logoUrl } from "@/lib/utils"
import { TrendingUp, TrendingDown, Clock, Globe, Gauge, Activity, BarChart3, TrendingUpDown, AlertCircle, Building2, Hash, DollarSign, Percent, Layers } from "lucide-react"

const PriceChart = dynamic(() => import("@/components/price-chart").then((m) => m.PriceChart), {
  ssr: false,
  loading: () => <ChartSkeleton />,
})
const IndicatorPanel = dynamic(() => import("@/components/indicator-panel").then((m) => m.IndicatorPanel), { ssr: false })
const AiAnalysis = dynamic(() => import("@/components/ai-analysis").then((m) => m.AiAnalysis), { ssr: false })
const NewsPanel = dynamic(() => import("@/components/news-panel").then((m) => m.NewsPanel), { ssr: false })
const OptionChain = dynamic(() => import("@/components/option-chain").then((m) => m.OptionChain), { ssr: false })

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

const RANGES = ["1d", "5d", "1mo", "3mo", "6mo", "ytd", "1y", "5y", "max"] as const
const REGIONS: Region[] = ["US", "IN", "GB", "JP", "GLOBAL"]

const STATE_LABEL: Record<string, string> = {
  REGULAR: "Open",
  PRE: "Pre-market",
  POST: "After hours",
  CLOSED: "Closed",
}

function money(n: number | undefined, ccySym: string) {
  if (n == null) return "—"
  const formatted = n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (ccySym) return `${ccySym}${formatted}`
  return formatted
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
    <div className="glass-card flex h-80 items-center justify-center rounded-[32px] text-sm text-muted-foreground">
      <Clock className="mr-2 h-4 w-4 animate-spin" />
      Loading chart…
    </div>
  )
}

function BentoCard({ children, className = "", spotlight = true }: { children: React.ReactNode; className?: string; spotlight?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const rawX = useMotionValue(-500)
  const rawY = useMotionValue(-500)
  const x = useSpring(rawX, { stiffness: 65, damping: 25, mass: 0.8 })
  const y = useSpring(rawY, { stiffness: 65, damping: 25, mass: 0.8 })

  const handleMove = useCallback((e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (r) { rawX.set(e.clientX - r.left); rawY.set(e.clientY - r.top) }
  }, [rawX, rawY])

  return (
    <motion.div
      ref={ref}
      onMouseMove={spotlight ? handleMove : undefined}
      whileHover={{ y: -3, scale: 1.005 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, mass: 0.6 }}
      className={`group relative overflow-hidden rounded-[32px] border border-white/20 bg-white/20 backdrop-blur-xl transition-all duration-500 hover:border-white/40 hover:shadow-2xl hover:shadow-black/10 ${className}`}
    >
      {spotlight && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]" aria-hidden>
          <motion.div
            className="absolute left-0 top-0 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ x, y, background: "radial-gradient(circle at center, oklch(0.55 0.18 255 / 0.06), transparent 60%)" }}
          />
          <motion.div
            className="absolute left-0 top-0 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ x, y, background: "radial-gradient(circle at center, oklch(0.62 0.16 168 / 0.04), transparent 60%)" }}
          />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-[32px]" />
      {children}
    </motion.div>
  )
}

function TickerTape({ quotes }: { quotes: Quote[] }) {
  const tickerSymbols = ["^GSPC", "^IXIC", "^DJI", "BTC-USD", "ETH-USD", "GC=F", "CL=F", "INR=X"]

  return (
    <div className="relative overflow-hidden rounded-[32px]">
      <div className="flex overflow-hidden">
        <motion.div
          className="flex shrink-0 gap-4 py-3"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          {[...Array(2)].map((_, dup) => (
            <div key={dup} className="flex shrink-0 gap-4">
              {tickerSymbols.map((sym) => {
                const found = quotes.find((q) => q.symbol === sym)
                const pos = (found?.changePercent ?? 0) >= 0
                return (
                  <div
                    key={`${dup}-${sym}`}
                    className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm"
                  >
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {sym === "^GSPC" ? "S&P 500" :
                       sym === "^IXIC" ? "NASDAQ" :
                       sym === "^DJI" ? "DOW" :
                       sym === "BTC-USD" ? "BTC" :
                       sym === "ETH-USD" ? "ETH" :
                       sym === "GC=F" ? "GOLD" :
                       sym === "CL=F" ? "OIL" :
                       sym === "INR=X" ? "USD/INR" : sym}
                    </span>
                    <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
                      {found ? found.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                    </span>
                    <span className={`flex items-center gap-0.5 font-mono text-[11px] tabular-nums ${pos ? "text-pos" : "text-neg"}`}>
                      {pos ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                      {found ? `${pos ? "+" : ""}${found.changePercent.toFixed(2)}%` : "—"}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export function MarketExplorer({ initialSymbol }: { initialSymbol: string }) {
  const [symbol, setSymbol] = useState(initialSymbol)
  const [range, setRange] = useState<(typeof RANGES)[number]>("6mo")
  const [region, setRegion] = useState<Region>("US")

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

  const { data: quoteData, error: quoteError } = useSWR<{ quotes: Quote[] }>(`/api/quote?symbols=${encodeURIComponent(symbol)}`, fetcher, {
    refreshInterval: 15000,
    keepPreviousData: true,
  })
  const { data: chartData, isLoading: chartLoading, error: chartError } = useSWR<{ candles: Candle[] }>(
    `/api/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`,
    fetcher,
    { keepPreviousData: true },
  )
  const { data: tickerData, error: tickerError } = useSWR<{ quotes: Quote[] }>(
    "/api/quote?symbols=^GSPC,^IXIC,^DJI,BTC-USD,ETH-USD,GC=F,CL=F,INR=X",
    fetcher,
    { refreshInterval: 30000, keepPreviousData: true },
  )

  const quote = quoteData?.quotes?.[0] ?? null
  const candles = useMemo(() => chartData?.candles ?? [], [chartData])
  const positive = (quote?.changePercent ?? 0) >= 0
  const ccySym = currencySymbol(quote?.currency)

  const indicators = useMemo(() => computeIndicators(candles), [candles])

  const handleSelect = useCallback((s: string) => setSymbol(s), [])
  const handleRegion = useCallback((r: Region) => setRegion(r), [])

  const watchlist = REGION_CONFIG[region].watchlist

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-32">
      <div className="mb-6">
        <TickerTape quotes={tickerData?.quotes ?? []} />
      </div>

      <div className="flex flex-col items-start gap-4 pb-6 pt-4">
        <SymbolSearch onSelect={handleSelect} />

        <div className="flex w-full flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 backdrop-blur-sm p-0.5">
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
                    : "border-white/20 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {quoteError && !quote ? (
        <div className="flex items-center gap-3 rounded-[32px] border border-neg/20 bg-neg/5 px-6 py-4 text-sm text-neg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Unable to load quote data. Retrying…</span>
        </div>
      ) : null}
      <QuoteHeader quote={quote} symbol={symbol} positive={positive} ccySym={ccySym} />

      <div className="mt-5 flex items-center gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors ${
              range === r
                ? "bg-foreground text-background"
                : "border border-white/20 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {r === "ytd" ? "YTD" : r === "max" ? "MAX" : r}
          </button>
        ))}
      </div>

      <BentoCard className="mt-4 min-h-80" spotlight={false}>
        {chartError && !candles.length ? (
          <div className="flex h-80 items-center justify-center gap-3 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0 text-neg" />
            Chart data unavailable
          </div>
        ) : chartLoading && !candles.length ? <ChartSkeleton /> : <PriceChart candles={candles} positive={positive} indicators={indicators} />}
      </BentoCard>

      <StatsGrid quote={quote} ccySym={ccySym} />

      <div className="mt-6">
        <h2 className="mb-4 font-heading text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Options Chain
        </h2>
        <BentoCard spotlight={false} className="!p-0">
          <OptionChain symbol={symbol} />
        </BentoCard>
      </div>

      <div className="mt-6">
        <BentoCard spotlight={false} className="!p-0">
          <AiAnalysis symbol={symbol} />
        </BentoCard>
      </div>

      <div className="mt-6">
        <BentoCard spotlight={false} className="!p-0">
          <NewsPanel symbol={symbol} />
        </BentoCard>
      </div>

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
  ccySym,
}: {
  quote: Quote | null
  symbol: string
  positive: boolean
  ccySym: string
}) {
  const logoSrc = quote ? logoUrl(quote.symbol, quote.name, quote.website, quote.exchange) : ""

  return (
    <BentoCard className="relative overflow-hidden p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl"
        style={{
          background: positive
            ? "radial-gradient(circle, oklch(0.62 0.16 168 / 0.16), transparent 70%)"
            : "radial-gradient(circle, oklch(0.58 0.18 22 / 0.16), transparent 70%)",
        }}
      />
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            {logoSrc && (
              <img
                src={logoSrc}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl bg-white/10 object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
              />
            )}
            <h1 className="font-heading text-3xl tracking-tight text-foreground">{quote?.symbol ?? symbol}</h1>
            <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[11px] text-muted-foreground">
              {quote?.exchange || "—"}
            </span>
            {quote?.assetType && (
              <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                {quote.assetType === "CRYPTOCURRENCY" ? "CRYPTO" : quote.assetType}
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
            {quote ? money(quote.price, ccySym) : "—"}
          </div>
          {quote && (
            <div className={`mt-1.5 flex items-center justify-end gap-1.5 font-mono text-sm ${positive ? "text-pos" : "text-neg"}`}>
              {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {positive ? "+" : ""}
              {quote.change.toFixed(2)} ({positive ? "+" : ""}
              {quote.changePercent.toFixed(2)}%)
            </div>
          )}
          <div className="mt-1 text-[11px] text-muted-foreground">{ccySym || quote?.currency || ""}</div>
        </div>
      </div>
    </BentoCard>
  )
})

const StatsGrid = memo(function StatsGrid({ quote, ccySym }: { quote: Quote | null; ccySym: string }) {
  const stats: { label: string; value: string; icon: React.ReactNode; span?: "sm" | "md" | "lg" }[] = [
    { label: "Currency", value: quote?.currency ? `${ccySym} ${quote.currency}`.trim() : "—", icon: <DollarSign className="h-3.5 w-3.5" />, span: "sm" },
    { label: "Market Status", value: STATE_LABEL[quote?.marketState ?? "CLOSED"], icon: <Activity className="h-3.5 w-3.5" />, span: "sm" },
    { label: "Exchange", value: quote?.exchange || "—", icon: <Building2 className="h-3.5 w-3.5" />, span: "sm" },
    { label: "Previous Close", value: money(quote?.previousClose, ccySym), icon: <BarChart3 className="h-3.5 w-3.5" />, span: "sm" },
    { label: "Open", value: money(quote?.open, ccySym), icon: <Activity className="h-3.5 w-3.5" />, span: "sm" },
    { label: "Day High", value: money(quote?.dayHigh, ccySym), icon: <TrendingUp className="h-3.5 w-3.5" />, span: "sm" },
    { label: "Day Low", value: money(quote?.dayLow, ccySym), icon: <TrendingDown className="h-3.5 w-3.5" />, span: "sm" },
    { label: "Volume", value: bigNum(quote?.volume), icon: <Layers className="h-3.5 w-3.5" />, span: "sm" },
    { label: "Market Cap", value: bigNum(quote?.marketCap), icon: <Hash className="h-3.5 w-3.5" />, span: "sm" },
    { label: "P/E (TTM)", value: quote?.trailingPE != null ? quote.trailingPE.toFixed(2) : "—", icon: <Percent className="h-3.5 w-3.5" />, span: "sm" },
    { label: "EPS (TTM)", value: quote?.eps != null ? quote.eps.toFixed(2) : "—", icon: <BarChart3 className="h-3.5 w-3.5" />, span: "sm" },
    { label: "Dividend Yield", value: quote?.dividendYield != null ? `${quote.dividendYield.toFixed(2)}%` : "—", icon: <Percent className="h-3.5 w-3.5" />, span: "sm" },
    { label: "Beta", value: quote?.beta != null ? quote.beta.toFixed(2) : "—", icon: <Activity className="h-3.5 w-3.5" />, span: "sm" },
    {
      label: "52W Range",
      value: quote?.fiftyTwoWeekLow != null && quote?.fiftyTwoWeekHigh != null
        ? `${quote.fiftyTwoWeekLow.toFixed(0)}–${quote.fiftyTwoWeekHigh.toFixed(0)}`
        : "—",
      icon: <TrendingUpDown className="h-3.5 w-3.5" />,
      span: "md",
    },
    {
      label: "52W High",
      value: money(quote?.fiftyTwoWeekHigh, ccySym),
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      span: "sm",
    },
    {
      label: "52W Low",
      value: money(quote?.fiftyTwoWeekLow, ccySym),
      icon: <TrendingDown className="h-3.5 w-3.5" />,
      span: "sm",
    },
    {
      label: "Sector",
      value: quote?.sector || "Not Available",
      icon: <Building2 className="h-3.5 w-3.5" />,
      span: "sm",
    },
    {
      label: "Industry",
      value: quote?.industry || "Not Available",
      icon: <Layers className="h-3.5 w-3.5" />,
      span: "sm",
    },
    {
      label: "Updated",
      value: quote?.updatedAt ? new Date(quote.updatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—",
      icon: <Clock className="h-3.5 w-3.5" />,
      span: "md",
    },
  ]

  const spanMap = { sm: "col-span-1", md: "col-span-2", lg: "col-span-3" }

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
          className={`relative group overflow-hidden rounded-[28px] border border-white/20 bg-white/15 backdrop-blur-xl px-4 py-3.5 transition-all duration-300 hover:border-white/40 hover:shadow-xl hover:bg-white/25 ${spanMap[s.span || "sm"]}`}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-[28px]" />
          <div className="relative">
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
              <span className="text-blue/60">{s.icon}</span>
              {s.label}
            </div>
            <div className="mt-1 font-mono text-sm font-semibold text-foreground tabular-nums">{s.value}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
})
