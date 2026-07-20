"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, TrendingUp, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react"
import { logActivity } from "@/app/actions/activity"

type Quote = {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  previousClose: number
  marketCap?: number
  trailingPE?: number
  eps?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  volume?: number
}

type Candle = { t: number; c: number }

type Side = { symbol: string; quote: Quote | null; candles: Candle[] }

function fmtNum(n?: number) {
  if (n == null) return "n/a"
  if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(2)}K`
  return n.toLocaleString("en-US")
}

function fmtPrice(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
}

function Sparkline({ candles, positive }: { candles: Candle[]; positive: boolean }) {
  if (!candles || candles.length < 2) return <div className="h-10" />
  const closes = candles.map((c) => c.c)
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const span = max - min || 1
  const w = 100
  const h = 32
  const pts = closes
    .map((c, i) => {
      const x = (i / (closes.length - 1)) * w
      const y = h - ((c - min) / span) * h
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
  const stroke = positive ? "var(--emerald)" : "var(--rose)"
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-10 w-full">
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function CompareClient() {
  const [a, setA] = useState<Side>({ symbol: "", quote: null, candles: [] })
  const [b, setB] = useState<Side>({ symbol: "", quote: null, candles: [] })
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([])
  const [activeBox, setActiveBox] = useState<"a" | "b" | null>(null)
  const [loading, setLoading] = useState<"a" | "b" | null>(null)
  const comparedRef = useRef<string>("")

  // Log a "compare" activity once both sides are loaded (deduped per pair).
  useEffect(() => {
    if (a.quote && b.quote) {
      const key = `${a.symbol}|${b.symbol}`
      if (comparedRef.current !== key) {
        comparedRef.current = key
        logActivity({ type: "compare", title: `Compared ${a.symbol} vs ${b.symbol}`, ticker: a.symbol, href: "/compare" }).catch(() => {})
      }
    } else {
      comparedRef.current = ""
    }
  }, [a.quote, b.quote, a.symbol, b.symbol])

  async function loadQuote(sym: string, box: "a" | "b") {
    const s = sym.trim().toUpperCase()
    if (!s) return
    setLoading(box)
    try {
      const [qRes, cRes] = await Promise.all([
        fetch(`/api/quote?symbols=${encodeURIComponent(s)}`),
        fetch(`/api/chart?symbol=${encodeURIComponent(s)}&range=1mo`),
      ])
      const qData = await qRes.json()
      const q: Quote | undefined = qData.quotes?.find((x: Quote) => x.symbol === s)
      let candles: Candle[] = []
      try {
        const cData = await cRes.json()
        candles = cData.candles ?? []
      } catch {}
      if (box === "a") setA({ symbol: s, quote: q ?? null, candles })
      else setB({ symbol: s, quote: q ?? null, candles })
    } finally {
      setLoading(null)
    }
  }

  async function fetchSuggestions(input: string) {
    if (!input.trim()) {
      setSuggestions([])
      return
    }
    const res = await fetch(`/api/search?q=${encodeURIComponent(input.trim())}`)
    const data = await res.json()
    setSuggestions((data?.results || []).slice(0, 6))
  }

  const metrics: { label: string; get: (q: Quote) => string; raw: (q: Quote) => number }[] = [
    { label: "Current Price", get: (q) => fmtPrice(q.price), raw: (q) => q.price },
    { label: "Change %", get: (q) => `${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%`, raw: (q) => q.changePercent },
    { label: "Market Cap", get: (q) => fmtNum(q.marketCap), raw: (q) => q.marketCap ?? -Infinity },
    { label: "P/E", get: (q) => (q.trailingPE != null ? q.trailingPE.toFixed(1) : "n/a"), raw: (q) => q.trailingPE ?? -Infinity },
    { label: "EPS", get: (q) => (q.eps != null ? `$${q.eps.toFixed(2)}` : "n/a"), raw: (q) => q.eps ?? -Infinity },
    { label: "52W High", get: (q) => (q.fiftyTwoWeekHigh != null ? fmtPrice(q.fiftyTwoWeekHigh) : "n/a"), raw: (q) => q.fiftyTwoWeekHigh ?? -Infinity },
    { label: "52W Low", get: (q) => (q.fiftyTwoWeekLow != null ? fmtPrice(q.fiftyTwoWeekLow) : "n/a"), raw: (q) => q.fiftyTwoWeekLow ?? -Infinity },
    { label: "Volume", get: (q) => fmtNum(q.volume), raw: (q) => q.volume ?? -Infinity },
  ]

  const rows = (() => {
    if (!a.quote || !b.quote) return []
    return metrics.map((m) => {
      const av = m.raw(a.quote!)
      const bv = m.raw(b.quote!)
      const winner: "a" | "b" | null =
        av === bv ? null : av > bv ? "a" : "b"
      return { label: m.label, a: m.get(a.quote!), b: m.get(b.quote!), winner }
    })
  })()

  const aWins = rows.filter((r) => r.winner === "a").length
  const bWins = rows.filter((r) => r.winner === "b").length

  return (
    <div className="p-6 lg:p-8">
      <hr className="divider divider--gold" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="page-head mb-8 glow-page">
        <p className="subheading"><span className="dot-gold" /> Compare</p>
        <h1 className="heading mt-1">Side-by-Side Analysis</h1>
        <p className="body mt-2">Compare any two stocks with live market data.</p>
      </motion.div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {(["a", "b"] as const).map((box, i) => {
          const side = box === "a" ? a : b
          return (
            <motion.div key={box} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 + i * 0.08 }} className="relative">
              <div className="glass-input flex items-center gap-3 rounded-2xl px-4 py-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-xl text-[11px] font-bold text-foreground ${i === 0 ? "bg-card" : "bg-card"}`}>{i + 1}</div>
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={side.symbol}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase()
                    if (box === "a") setA({ ...a, symbol: v, quote: null, candles: [] })
                    else setB({ ...b, symbol: v, quote: null, candles: [] })
                    setActiveBox(box)
                    fetchSuggestions(v)
                  }}
                  onFocus={() => { setActiveBox(box); if (side.symbol) fetchSuggestions(side.symbol) }}
                  placeholder={`Search symbol ${i + 1}...`}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
                {loading === box && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              <AnimatePresence>
                {activeBox === box && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-2xl"
                  >
                    {suggestions.map((s) => (
                      <motion.button
                        key={s.symbol}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15 }}
                        onMouseDown={() => { loadQuote(s.symbol, box); setSuggestions([]); setActiveBox(null) }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-foreground/[0.04]"
                      >
                        <span className="font-medium">{s.symbol}</span>
                        <span className="text-muted-foreground text-xs">{s.name}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {a.quote && b.quote ? (
        <>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
            <div className="bento-card">
              <div className="p-5">
                <div className="mb-2 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-gold" />
                  <span className="meta">Live Snapshot</span>
                </div>
                <p className="body leading-relaxed">
                  <strong className="text-gold">{a.symbol}</strong> is trading at {fmtPrice(a.quote.price)} ({a.quote.changePercent >= 0 ? "+" : ""}{a.quote.changePercent.toFixed(2)}%) and{" "}
                  <strong className="text-gold">{b.symbol}</strong> at {fmtPrice(b.quote.price)} ({b.quote.changePercent >= 0 ? "+" : ""}{b.quote.changePercent.toFixed(2)}%).
                  {aWins > bWins ? ` ${a.symbol} leads on ${aWins} of ${aWins + bWins} metrics.` : bWins > aWins ? ` ${b.symbol} leads on ${bWins} of ${aWins + bWins} metrics.` : " The two are tied on the compared metrics."}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-6">
            <div className="bento-card">
              <div className="p-6">
                <div className="mb-6 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 ${aWins >= bWins ? "bg-card" : "bg-card"}`}>
                      <span className={`text-xs font-medium ${aWins >= bWins ? "text-foreground" : "text-muted-foreground/50"}`}>{a.symbol} — {aWins} {aWins === 1 ? "lead" : "leads"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center"><span className="meta">Metric</span></div>
                  <div className="text-center">
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 ${bWins > aWins ? "bg-card" : "bg-card"}`}>
                      <span className={`text-xs font-medium ${bWins > aWins ? "text-foreground" : "text-muted-foreground/50"}`}>{b.symbol} — {bWins} {bWins === 1 ? "lead" : "leads"}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-5">
                  {rows.map((row) => (
                    <div key={row.label}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="meta">{row.label}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className={`font-medium tabular-nums flex items-center gap-1 ${row.winner === "a" ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                            {row.winner === "a" && <span className="h-1.5 w-1.5 rounded-full bg-gold" />}{row.a}
                          </span>
                          <span className="text-muted-foreground/30">vs</span>
                          <span className={`font-medium tabular-nums flex items-center gap-1 ${row.winner === "b" ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                            {row.b}{row.winner === "b" && <span className="h-1.5 w-1.5 rounded-full bg-gold" />}
                          </span>
                        </div>
                      </div>
                      <div className="relative flex h-6 items-center gap-1">
                        <div className="flex-1">
                          <motion.div initial={{ width: 0 }} whileInView={{ width: row.winner === "a" ? "100%" : "50%" }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full rounded-l-full ${row.winner === "a" ? "bg-gold/40" : "bg-foreground/5"}`} />
                        </div>
                        <div className={`h-6 w-0.5 rounded-full ${row.winner === "a" || row.winner === "b" ? "bg-gold" : "bg-foreground/10"}`} />
                        <div className="flex-1">
                          <motion.div initial={{ width: 0 }} whileInView={{ width: row.winner === "b" ? "100%" : "50%" }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            className={`ml-auto h-full rounded-r-full ${row.winner === "b" ? "bg-gold/40" : "bg-foreground/5"}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[a, b].map((side, idx) => (
              <motion.div key={side.symbol} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 + idx * 0.1 }}>
                <div className="bento-card">
                  <div className="p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl font-heading text-sm font-bold bg-card text-foreground">{side.symbol.slice(0, 2)}</div>
                        <div>
                          <p className="heading-sm">{side.symbol}</p>
                          <p className="meta">{side.quote?.name}</p>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${side.quote!.changePercent >= 0 ? "text-emerald bg-emerald/10" : "text-neg bg-neg/10"}`}>
                        {side.quote!.changePercent >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {side.quote!.changePercent >= 0 ? "+" : ""}{side.quote!.changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <Sparkline candles={side.candles} positive={side.quote!.changePercent >= 0} />
                    <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl bg-glass p-3">
                      <div className="text-center"><p className="meta">Price</p><p className="text-xs font-semibold font-mono tabular-nums">{fmtPrice(side.quote!.price)}</p></div>
                      <div className="text-center"><p className="meta">Change</p><p className="text-xs font-semibold font-mono tabular-nums">{side.quote!.change >= 0 ? "+" : ""}{side.quote!.change.toFixed(2)}</p></div>
                      <div className="text-center"><p className="meta">Prev Close</p><p className="text-xs font-semibold font-mono tabular-nums">{fmtPrice(side.quote!.previousClose)}</p></div>
                      <div className="text-center"><p className="meta">Mkt Cap</p><p className="text-xs font-semibold font-mono tabular-nums">{fmtNum(side.quote!.marketCap)}</p></div>
                      <div className="text-center"><p className="meta">P/E</p><p className="text-xs font-semibold font-mono tabular-nums">{side.quote!.trailingPE != null ? side.quote!.trailingPE.toFixed(1) : "n/a"}</p></div>
                      <div className="text-center"><p className="meta">Volume</p><p className="text-xs font-semibold font-mono tabular-nums">{fmtNum(side.quote!.volume)}</p></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bento-card relative overflow-hidden px-8 py-16 text-center"
        >
          <div className="pointer-events-none absolute -inset-20 opacity-30" style={{ background: 'radial-gradient(circle at 50% 0%, var(--gold-glow-strong), transparent 60%)' }} />
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--gold-glow)' }}>
            <BarChart3 className="h-7 w-7" style={{ color: 'var(--gold)' }} />
          </div>
          <p className="heading-sm">Select two symbols to compare</p>
          <p className="body mt-2 max-w-sm mx-auto">Search and pick two tickers above to see a live side-by-side comparison.</p>
        </motion.div>
      )}
    </div>
  )
}
