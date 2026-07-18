"use client"

import useSWR from "swr"
import dynamic from "next/dynamic"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion } from "motion/react"
import { SymbolSearch, type SearchResult } from "@/components/symbol-search"
import { computeIndicators } from "@/lib/indicators"
import { REGION_CONFIG, displaySymbol, type Quote, type Region, type Candle } from "@/lib/market"
import { currencySymbol, logoUrl } from "@/lib/utils"
import { TrendingUp, TrendingDown, Clock, Globe, Activity, BarChart3, TrendingUpDown, AlertCircle, Building2, Hash, DollarSign, Percent, Layers } from "lucide-react"

const POLL_INTERVAL = 12_000

function useAnimatedNumber(value: number, duration = 400): number {
  const [display, setDisplay] = useState(value)
  const ref = useRef(value)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (value === ref.current) return
    const startVal = ref.current
    const endVal = value
    const startTime = performance.now()
    ref.current = value

    function tick(now: number) {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(startVal + (endVal - startVal) * eased)
      if (t < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value, duration])

  return display
}

function AnimatedMoney({ value, ccySym, decimals = 2 }: { value: number | undefined; ccySym: string; decimals?: number }) {
  const animated = useAnimatedNumber(value ?? 0)
  if (value == null) return null
  const formatted = animated.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return <>{ccySym}{formatted}</>
}

function AnimatedPercent({ value, pos }: { value: number | undefined; pos?: boolean }) {
  const animated = useAnimatedNumber(value ?? 0)
  if (value == null) return <>—</>
  const sign = pos ?? value >= 0 ? "+" : ""
  return <>{sign}{animated.toFixed(2)}%</>
}

function AnimatedChange({ value }: { value: number | undefined }) {
  const animated = useAnimatedNumber(value ?? 0)
  if (value == null) return <>—</>
  return <>{animated.toFixed(2)}</>
}

function AnimatedBigNum({ value }: { value: number | undefined }) {
  const animated = useAnimatedNumber(value ?? 0, 600)
  if (value == null) return null
  if (animated >= 1e12) return <>{`${(animated / 1e12).toFixed(2)}T`}</>
  if (animated >= 1e9) return <>{`${(animated / 1e9).toFixed(2)}B`}</>
  if (animated >= 1e6) return <>{`${(animated / 1e6).toFixed(2)}M`}</>
  if (animated >= 1e3) return <>{`${(animated / 1e3).toFixed(1)}K`}</>
  return <>{animated.toLocaleString()}</>
}

function AnimatedPrice({ value, ccySym }: { value: number | undefined; ccySym: string }) {
  const animated = useAnimatedNumber(value ?? 0, 500)
  if (value == null) return <>—</>
  const formatted = animated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return <>{ccySym}{formatted}</>
}

function useScrollPreserve() {
  const scrollRef = useRef(0)
  const lockedRef = useRef(true)
  useEffect(() => {
    // Capture the scroll position at mount, then re-lock it once after the
    // initial layout settles. After that we let the user scroll freely and
    // never yank the page back — earlier this observer ran on EVERY resize
    // and trapped the user on the page.
    scrollRef.current = window.scrollY
    const id = setTimeout(() => {
      lockedRef.current = false
    }, 600)
    const observer = new ResizeObserver(() => {
      if (lockedRef.current) window.scrollTo(0, scrollRef.current)
    })
    observer.observe(document.body)
    return () => {
      clearTimeout(id)
      observer.disconnect()
    }
  }, [])
}

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




function ChartSkeleton() {
  return (
    <div className="glass-card flex h-80 items-center justify-center rounded-[32px] text-sm text-muted-foreground">
      <Clock className="mr-2 h-4 w-4 animate-spin" />
      Loading chart…
    </div>
  )
}

const BentoCard = memo(function BentoCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.005 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, mass: 0.6 }}
      className={`group relative overflow-hidden rounded-[32px] border border-white/20 bg-white/20 backdrop-blur-xl transition-all duration-500 hover:border-white/40 hover:shadow-2xl hover:shadow-black/10 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-[32px]" />
      {children}
    </motion.div>
  )
})

const TickerTape = memo(function TickerTape({ quotes }: { quotes: Quote[] }) {
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
})

export function MarketExplorer({ initialSymbol }: { initialSymbol: string }) {
  const [symbol, setSymbol] = useState(initialSymbol)
  const [range, setRange] = useState<(typeof RANGES)[number]>("6mo")
  const [region, setRegion] = useState<Region>("US")
  const [optionParams, setOptionParams] = useState<{ strike?: number; expiry?: string }>({})

  useScrollPreserve()

  useEffect(() => {
    let active = true
    fetch("/api/region")
      .then((r) => r.json())
      .then((d) => {
        if (active && d?.region) setRegion(d.region as Region)
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const { data: quoteData, error: quoteError } = useSWR<{ quotes: Quote[] }>(`/api/quote?symbols=${encodeURIComponent(symbol)}`, fetcher, {
    refreshInterval: POLL_INTERVAL,
    keepPreviousData: true,
    revalidateOnFocus: true,
  })
  const { data: chartData, isLoading: chartLoading, error: chartError } = useSWR<{ candles: Candle[] }>(
    `/api/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false },
  )
  const { data: tickerData } = useSWR<{ quotes: Quote[] }>(
    "/api/quote?symbols=^GSPC,^IXIC,^DJI,BTC-USD,ETH-USD,GC=F,CL=F,INR=X",
    fetcher,
    { refreshInterval: 120000, keepPreviousData: true, revalidateOnFocus: false },
  )

  const rawQuote: Quote | null = quoteData?.quotes?.[0] ?? null
  const quoteRef = useRef(rawQuote)
  if (
    rawQuote?.price !== quoteRef.current?.price ||
    rawQuote?.change !== quoteRef.current?.change ||
    rawQuote?.changePercent !== quoteRef.current?.changePercent ||
    rawQuote?.marketState !== quoteRef.current?.marketState ||
    rawQuote?.volume !== quoteRef.current?.volume ||
    rawQuote?.marketCap !== quoteRef.current?.marketCap
  ) {
    quoteRef.current = rawQuote
  }
  const quote = quoteRef.current
  const candles = useMemo(() => chartData?.candles ?? [], [chartData])
  const positive = useMemo(() => (quote?.changePercent ?? 0) >= 0, [quote?.changePercent])
  const ccySym = useMemo(() => currencySymbol(quote?.currency), [quote?.currency])

  const indicators = useMemo(() => computeIndicators(candles), [candles])
  const tickerQuotes = useMemo(() => tickerData?.quotes ?? [], [tickerData])

  const handleSelect = useCallback((r: SearchResult) => {
    setSymbol(r.symbol)
    setOptionParams({ strike: r.strike, expiry: r.expiry })
  }, [])
  const handleRegion = useCallback((r: Region) => setRegion(r), [])

  const watchlist = REGION_CONFIG[region].watchlist

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-32">
      <div className="mb-6">
        <TickerTape quotes={tickerQuotes} />
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
                onClick={() => handleSelect({ symbol: w, name: w, exchange: "", type: "equity" })}
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

      <BentoCard className="mt-4 min-h-80">
        {chartError && !candles.length ? (
          <div className="flex h-80 items-center justify-center gap-3 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0 text-neg" />
            Chart data unavailable
          </div>
        ) : chartLoading && !candles.length ? <ChartSkeleton /> : <PriceChart candles={candles} positive={positive} indicators={indicators} />}
      </BentoCard>

      <StatsGrid quote={quote} ccySym={ccySym} />

      {(!quote || quote.assetType !== "EQUITY") && (
        <div className="mt-6">
          <h2 className="mb-4 font-heading text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Options Chain
          </h2>
          <BentoCard className="!p-0">
            <OptionChain symbol={symbol} defaultStrike={optionParams.strike} defaultExpiry={optionParams.expiry} />
          </BentoCard>
        </div>
      )}

      <div className="mt-6">
        <BentoCard className="!p-0">
          <AiAnalysis symbol={symbol} />
        </BentoCard>
      </div>

      <div className="mt-6">
        <BentoCard className="!p-0">
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
  const logoSrc = useMemo(() => quote ? logoUrl(quote.symbol, quote.name, quote.website, quote.exchange) : "", [quote?.symbol, quote?.name, quote?.website, quote?.exchange])

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
            <div className="flex flex-col">
              <h1 className="font-heading text-3xl tracking-tight text-foreground">{quote?.name || displaySymbol(symbol)}</h1>
              <span className="font-mono text-sm text-muted-foreground/80">
                {displaySymbol(quote?.symbol ?? symbol)}
              </span>
            </div>
            <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[11px] text-foreground/80">
              {quote?.exchange || "—"}
            </span>
            {quote?.assetType && (
              <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[11px] text-foreground/80">
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
          {quote?.ceo && (
            <p className="mt-0.5 max-w-md truncate text-xs text-muted-foreground/50">
              CEO: {quote.ceo}
            </p>
          )}
          {quote?.website && (
            <a href={quote.website} target="_blank" rel="noopener noreferrer"
              className="mt-0.5 inline-block max-w-md truncate text-xs text-blue/60 hover:text-blue transition-colors">
              {quote.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>

        <div className="text-right">
          <div className="font-mono text-4xl tracking-tight text-foreground sm:text-5xl">
            {quote ? <AnimatedPrice value={quote.price} ccySym={ccySym} /> : "—"}
          </div>
          {quote && (
            <div className={`mt-1.5 flex items-center justify-end gap-1.5 font-mono text-sm ${positive ? "text-pos" : "text-neg"}`}>
              {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <AnimatedChange value={quote.change} />
              {" ("}
              <AnimatedPercent value={quote.changePercent} pos={positive} />
              {")"}
            </div>
          )}
          <div className="mt-1 text-[11px] text-muted-foreground">{ccySym || quote?.currency || ""}</div>
        </div>
      </div>
    </BentoCard>
  )
})

const StatsGrid = memo(function StatsGrid({ quote, ccySym }: { quote: Quote | null; ccySym: string }) {
  const isIndex = quote?.assetType === "INDEX"
  const isCrypto = quote?.assetType === "CRYPTOCURRENCY"
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), POLL_INTERVAL)
    return () => clearInterval(id)
  }, [])
  const stats = useMemo(() => {
    const items: { label: string; value: React.ReactNode; span?: "sm" | "md" | "lg" }[] = [
      { label: "Currency", value: quote?.currency ? `${ccySym} ${quote.currency}`.trim() : null },
      { label: "Market Status", value: STATE_LABEL[quote?.marketState ?? "CLOSED"] },
      { label: "Exchange", value: quote?.exchange || null },
      { label: "Previous Close", value: quote?.previousClose != null ? <AnimatedMoney value={quote.previousClose} ccySym={ccySym} /> : null },
      { label: "Open", value: quote?.open != null ? <AnimatedMoney value={quote.open} ccySym={ccySym} /> : null },
      { label: "Day High", value: quote?.dayHigh != null ? <AnimatedMoney value={quote.dayHigh} ccySym={ccySym} /> : null },
      { label: "Day Low", value: quote?.dayLow != null ? <AnimatedMoney value={quote.dayLow} ccySym={ccySym} /> : null },
      { label: "Volume", value: quote?.volume != null ? <AnimatedBigNum value={quote.volume} /> : null },
      { label: "Market Cap", value: quote?.marketCap != null ? <AnimatedBigNum value={quote.marketCap} /> : null },
      { label: "P/E (TTM)", value: quote?.trailingPE != null ? <span className="tabular-nums">{quote.trailingPE.toFixed(2)}</span> : null },
      { label: "EPS (TTM)", value: quote?.eps != null ? <span className="tabular-nums">{quote.eps.toFixed(2)}</span> : null },
      { label: "Dividend Yield", value: quote?.dividendYield != null ? <span className="tabular-nums">{quote.dividendYield.toFixed(2)}%</span> : null },
      { label: "Beta", value: quote?.beta != null ? <span className="tabular-nums">{quote.beta.toFixed(2)}</span> : null },
      { label: "52W High", value: quote?.fiftyTwoWeekHigh != null ? <AnimatedMoney value={quote.fiftyTwoWeekHigh} ccySym={ccySym} /> : null },
      { label: "52W Low", value: quote?.fiftyTwoWeekLow != null ? <AnimatedMoney value={quote.fiftyTwoWeekLow} ccySym={ccySym} /> : null },
      { label: "52W Range", value: quote?.fiftyTwoWeekLow != null && quote?.fiftyTwoWeekHigh != null ? `${quote.fiftyTwoWeekLow.toFixed(0)}–${quote.fiftyTwoWeekHigh.toFixed(0)}` : null, span: "md" as const },
      { label: "Sector", value: !isIndex && quote?.sector ? quote.sector : null },
      { label: "Industry", value: !isIndex && quote?.industry ? quote.industry : null },
      { label: "CEO", value: !isIndex && !isCrypto && quote?.ceo ? quote.ceo : null },
    ]
    return items.filter((s) => s.value != null)
  }, [quote, ccySym, isIndex, isCrypto])

  const spanMap = { sm: "col-span-1", md: "col-span-2", lg: "col-span-3" }

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
          className={`relative group overflow-hidden rounded-[28px] border border-white/20 bg-white/15 backdrop-blur-xl px-4 py-3.5 transition-all duration-300 hover:border-white/40 hover:shadow-xl hover:bg-white/25 ${spanMap[s.span ?? "sm"]}`}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-[28px]" />
          <div className="relative">
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
              <IconFor label={s.label} />
              {s.label}
            </div>
            <div className="mt-1 font-mono text-sm font-semibold text-foreground tabular-nums">{s.value}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
})

function IconFor({ label }: { label: string }) {
  const icons: Record<string, React.ReactNode> = {
    "Currency": <DollarSign className="h-3.5 w-3.5 text-blue/60" />,
    "Market Status": <Activity className="h-3.5 w-3.5 text-blue/60" />,
    "Exchange": <Building2 className="h-3.5 w-3.5 text-blue/60" />,
    "Previous Close": <BarChart3 className="h-3.5 w-3.5 text-blue/60" />,
    "Open": <Activity className="h-3.5 w-3.5 text-blue/60" />,
    "Day High": <TrendingUp className="h-3.5 w-3.5 text-blue/60" />,
    "Day Low": <TrendingDown className="h-3.5 w-3.5 text-blue/60" />,
    "Volume": <Layers className="h-3.5 w-3.5 text-blue/60" />,
    "Market Cap": <Hash className="h-3.5 w-3.5 text-blue/60" />,
    "P/E (TTM)": <Percent className="h-3.5 w-3.5 text-blue/60" />,
    "EPS (TTM)": <BarChart3 className="h-3.5 w-3.5 text-blue/60" />,
    "Dividend Yield": <Percent className="h-3.5 w-3.5 text-blue/60" />,
    "Beta": <Activity className="h-3.5 w-3.5 text-blue/60" />,
    "52W Range": <TrendingUpDown className="h-3.5 w-3.5 text-blue/60" />,
    "52W High": <TrendingUp className="h-3.5 w-3.5 text-blue/60" />,
    "52W Low": <TrendingDown className="h-3.5 w-3.5 text-blue/60" />,
    "Sector": <Building2 className="h-3.5 w-3.5 text-blue/60" />,
    "Industry": <Layers className="h-3.5 w-3.5 text-blue/60" />,
    "CEO": <Building2 className="h-3.5 w-3.5 text-blue/60" />,
    "Updated": <Clock className="h-3.5 w-3.5 text-blue/60" />,
  }
  return <>{icons[label] ?? null}</>
}
