"use client"

import { useState, useEffect, useCallback, useMemo, useId } from "react"
import { motion } from "motion/react"
import { TrendingUp, TrendingDown, Search, Newspaper, BarChart3, X, ArrowRight } from "lucide-react"
import { Counter } from "@/components/reveal"
import Link from "next/link"

type Candle = { t: number; o: number; h: number; l: number; c: number; v: number }
type Hit = { symbol: string; name: string; exchange?: string; type?: string }
type NewsItem = { title: string; publisher: string; link: string; publishedAt: number; sentiment: "positive" | "negative" | "neutral" }

const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "NVDA", "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS"]

function StockChart({ candles, color }: { candles: Candle[]; color: string }) {
  const path = useMemo(() => {
    if (candles.length < 2) return ""
    const xs = candles.map((c) => c.t)
    const ys = candles.map((c) => c.c)
    const minT = Math.min(...xs); const maxT = Math.max(...xs)
    const minP = Math.min(...ys); const maxP = Math.max(...ys)
    const w = 600; const h = 180
    const sx = (t: number) => ((t - minT) / (maxT - minT || 1)) * w
    const sy = (p: number) => h - ((p - minP) / (maxP - minP || 1)) * h
    return candles.map((c, i) => `${i === 0 ? "M" : "L"}${sx(c.t).toFixed(1)},${sy(c.c).toFixed(1)}`).join(" ")
  }, [candles])

  if (!path) return <div className="flex h-[180px] items-center justify-center text-xs text-[var(--text-tertiary)]">No chart data</div>

  const area = `M0,180 L${path.replace(/^M/, "")} L600,180 Z`
  const id = "cg-" + useId().replace(/[^a-zA-Z0-9]/g, "")

  const lastPt = useMemo(() => {
    if (!path) return null
    const parts = path.trim().split(" ").pop()!.replace(/^L/, "").split(",")
    return { x: Number(parts[0]), y: Number(parts[1]) }
  }, [path])

  return (
    <svg viewBox="0 0 600 180" className="h-[180px] w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={area}
        fill={`url(#${id})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      />
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      />
      {lastPt && (
        <motion.circle
          cx={lastPt.x}
          cy={lastPt.y}
          r="3.5"
          fill={color}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <animate attributeName="r" values="3.5;6;3.5" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite" />
        </motion.circle>
      )}
    </svg>
  )
}

export function MarketFocus({ initialSymbol = "AAPL" }: { initialSymbol?: string }) {
  const [symbol, setSymbol] = useState(initialSymbol)
  const [query, setQuery] = useState("")
  const [hits, setHits] = useState<Hit[]>([])
  const [open, setOpen] = useState(false)
  const [quote, setQuote] = useState<{ price: number; changePercent: number; currency: string; name: string } | null>(null)
  const [candles, setCandles] = useState<Candle[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [newsOverall, setNewsOverall] = useState<string>("neutral")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (sym: string) => {
    setLoading(true)
    try {
      const [qRes, cRes, nRes] = await Promise.all([
        fetch(`/api/quote?symbols=${encodeURIComponent(sym)}`),
        fetch(`/api/chart?symbol=${encodeURIComponent(sym)}&range=3mo`),
        fetch(`/api/news?symbol=${encodeURIComponent(sym)}`),
      ])
      const q = await qRes.json().catch(() => null)
      const c = await cRes.json().catch(() => null)
      const n = await nRes.json().catch(() => null)
      const first = q?.quotes?.[0]
      if (first) setQuote({ price: first.price, changePercent: first.changePercent, currency: first.currency, name: first.name || sym })
      setCandles(c?.candles || [])
      setNews(n?.items || [])
      setNewsOverall(n?.overall || "neutral")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(symbol) }, [symbol, load])

  useEffect(() => {
    if (!query.trim()) { setHits([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setHits((data.results || []).slice(0, 6))
      } catch { setHits([]) }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  const pos = (quote?.changePercent ?? 0) >= 0
  const color = pos ? "var(--pos)" : "var(--neg)"

  return (
    <div className="bento-grid bento-grid--dashboard">
      {/* Stock summary + chart */}
      <div className="bento-wide">
        <div className="bento-card h-full p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative">
              <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5" style={{ border: "1px solid var(--line)", background: "var(--surface-alt)" }}>
                <Search className="h-3.5 w-3.5" style={{ color: "var(--text-tertiary)" }} />
                <input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
                  onFocus={() => setOpen(true)}
                  placeholder={symbol}
                  className="w-36 bg-transparent text-sm outline-none"
                  style={{ color: "var(--text-primary)" }}
                />
                {symbol && query && (
                  <button onClick={() => { setQuery(""); setOpen(false) }} className="p-0.5"><X className="h-3.5 w-3.5" style={{ color: "var(--text-tertiary)" }} /></button>
                )}
              </div>
              {open && (query.trim() || hits.length > 0) && (
                <div className="absolute left-0 z-50 mt-1.5 w-64 overflow-hidden rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--line-strong)" }}>
                  {hits.length === 0 ? (
                    <p className="px-3 py-2 text-xs" style={{ color: "var(--text-tertiary)" }}>No matches</p>
                  ) : hits.map((h) => (
                    <button key={h.symbol} onClick={() => { setQuery(""); setSymbol(h.symbol); setOpen(false) }} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[var(--panel-2)]">
                      <span className="font-mono text-xs font-semibold">{h.symbol}</span>
                      <span className="truncate pl-2 text-xs" style={{ color: "var(--text-tertiary)" }}>{h.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_SYMBOLS.map((s) => (
                <button key={s} onClick={() => setSymbol(s)} className={`rounded-full px-2.5 py-1 text-[11px] font-mono transition-all duration-300 hover:scale-105 ${symbol === s ? "bg-[var(--gold-glow)] text-[var(--gold)]" : "text-[var(--text-tertiary)] hover:bg-[var(--panel-2)]"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Stock summary */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-[var(--gold)]">{symbol}</span>
                {quote?.name && <span className="text-sm text-[var(--text-secondary)]">{quote.name}</span>}
                {quote && !loading && (
                  <span className="relative flex h-2 w-2" title="Live">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ background: color, opacity: 0.6 }} />
                    <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
                  </span>
                )}
              </div>
              <p className="stat-number mt-1" style={{ color: pos ? "var(--pos)" : "var(--neg)" }}>
                {quote ? `${quote.price.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${quote.currency}` : "—"}
              </p>
              <p className={`mt-1 flex items-center gap-1 font-mono text-sm ${pos ? "text-[var(--pos)]" : "text-[var(--neg)]"}`}>
                {pos ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {quote ? `${pos ? "+" : ""}${quote.changePercent.toFixed(2)}%` : ""}
              </p>
            </div>
            <Link href={`/chat?symbol=${encodeURIComponent(symbol)}`} className="btn btn--gold sweep"><BarChart3 className="h-3.5 w-3.5" /> Analyze</Link>
          </div>

          {/* Chart directly below summary */}
          <div className="mt-5 rounded-xl p-2" style={{ border: "1px solid var(--line)", background: "var(--surface-alt)" }}>
            {loading ? (
              <div className="flex h-[180px] items-center justify-center"><span className="meta animate-pulse">Loading chart…</span></div>
            ) : (
              <StockChart candles={candles} color={color} />
            )}
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="bento-half">
        <div className="bento-card h-full p-6">
          <p className="meta mb-4">AI Analysis</p>
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--gold-glow)" }}>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--gold)", color: "#1a1206" }}>
              <BarChart3 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Signal for {symbol}</p>
              <p className="text-xs text-[var(--text-secondary)]">Run a full analysis to surface direction, confidence & rationale.</p>
            </div>
          </div>
          <Link href={`/chat?symbol=${encodeURIComponent(symbol)}`} className="link-premium mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
            Open in AI Chat <ArrowRight className="inline h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* News after AI Analysis */}
      <div className="bento-full">
        <div className="bento-card h-full p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-[var(--gold)]" />
              <p className="meta">Latest News · {symbol}</p>
            </div>
            <span className={`badge ${newsOverall === "positive" ? "chip-pos" : newsOverall === "negative" ? "chip-neg" : ""}`}>{newsOverall}</span>
          </div>
          {news.length === 0 ? (
            <p className="body-sm">No recent headlines for this instrument.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {news.slice(0, 6).map((n, i) => (
                <motion.a
                  key={n.link + i}
                  href={n.link}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -2 }}
                  className="sweep rounded-xl p-3 transition-colors hover:bg-[var(--panel-2)]"
                  style={{ border: "1px solid var(--line)" }}
                >
                  <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-2">{n.title}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">{n.publisher}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${n.sentiment === "positive" ? "bg-[var(--pos)]" : n.sentiment === "negative" ? "bg-[var(--neg)]" : "bg-[var(--text-tertiary)]"}`} />
                  </div>
                </motion.a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
