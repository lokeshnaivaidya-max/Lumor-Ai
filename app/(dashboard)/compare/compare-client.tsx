"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, TrendingUp, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

type Quote = { symbol: string; name: string; price: number; change: number; changePercent: number; previousClose: number }

type Side = { symbol: string; quote: Quote | null }

function GlowCard({ children, glowColor = "oklch(0.55 0.18 255 / 0.15)" }: { children: React.ReactNode; glowColor?: string }) {
  return (
    <motion.div whileHover={{ y: -3, scale: 1.006 }} transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.6 }} className="group relative transform-gpu">
      <div className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 blur-xl transition-all duration-500 group-hover:opacity-100" style={{ boxShadow: `0 0 48px 8px ${glowColor}` }} />
      <div className="relative glass-card overflow-hidden rounded-3xl">{children}</div>
    </motion.div>
  )
}

export function CompareClient() {
  const [a, setA] = useState<Side>({ symbol: "", quote: null })
  const [b, setB] = useState<Side>({ symbol: "", quote: null })
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([])
  const [activeBox, setActiveBox] = useState<"a" | "b" | null>(null)
  const [loading, setLoading] = useState<"a" | "b" | null>(null)

  async function loadQuote(sym: string, box: "a" | "b") {
    const s = sym.trim().toUpperCase()
    if (!s) return
    setLoading(box)
    try {
      const res = await fetch(`/api/quote?q=${encodeURIComponent(s)}`)
      const data = await res.json()
      const q: Quote | undefined = data.quotes?.find((x: Quote) => x.symbol === s)
      if (box === "a") setA({ symbol: s, quote: q ?? null })
      else setB({ symbol: s, quote: q ?? null })
    } finally { setLoading(null) }
  }

  async function fetchSuggestions(input: string) {
    if (!input.trim()) { setSuggestions([]); return }
    const res = await fetch(`/api/search?q=${encodeURIComponent(input.trim())}`)
    const data = await res.json()
    setSuggestions((data?.results || []).slice(0, 6))
  }

  const rows = (() => {
    if (!a.quote || !b.quote) return []
    const pair = [
      { label: "Current Price", a: `$${a.quote.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, b: `$${b.quote.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, winner: a.quote.price >= b.quote.price ? "a" : "b" },
      { label: "Change %", a: `${a.quote.changePercent >= 0 ? "+" : ""}${a.quote.changePercent.toFixed(2)}%`, b: `${b.quote.changePercent >= 0 ? "+" : ""}${b.quote.changePercent.toFixed(2)}%`, winner: a.quote.changePercent >= b.quote.changePercent ? "a" : "b" },
      { label: "Day Move", a: `${a.quote.change >= 0 ? "+" : ""}$${a.quote.change.toFixed(2)}`, b: `${b.quote.change >= 0 ? "+" : ""}$${b.quote.change.toFixed(2)}`, winner: a.quote.change >= b.quote.change ? "a" : "b" },
    ]
    return pair
  })()

  const aWins = rows.filter((r) => r.winner === "a").length
  const bWins = rows.filter((r) => r.winner === "b").length

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Compare Stocks</h1>
        <p className="mt-1 text-sm text-muted-foreground">Side-by-side comparison with live market data.</p>
      </motion.div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {(["a", "b"] as const).map((box, i) => {
          const side = box === "a" ? a : b
          return (
            <motion.div key={box} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 + i * 0.08 }} className="relative">
              <div className="glass-card flex items-center gap-3 rounded-2xl px-4 py-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-xl text-[11px] font-bold text-white ${i === 0 ? "bg-blue" : "bg-emerald"}`}>{i + 1}</div>
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={side.symbol}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase()
                    if (box === "a") setA({ ...a, symbol: v, quote: null })
                    else setB({ ...b, symbol: v, quote: null })
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
                    className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border/40 bg-background/95 p-2 shadow-2xl backdrop-blur-2xl"
                  >
                    {suggestions.map((s) => (
                      <motion.button
                        key={s.symbol}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15 }}
                        onMouseDown={() => { loadQuote(s.symbol, box); setSuggestions([]); setActiveBox(null) }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-white/[0.04]"
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
            <GlowCard glowColor="oklch(0.48 0.16 280 / 0.2)">
              <div className="p-5">
                <div className="mb-2 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-violet" />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Live Snapshot</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <strong className={a.quote.changePercent >= b.quote.changePercent ? "text-blue" : "text-emerald"}>{a.symbol}</strong> is trading at $
                  {a.quote.price.toLocaleString("en-US", { maximumFractionDigits: 2 })} ({a.quote.changePercent >= 0 ? "+" : ""}{a.quote.changePercent.toFixed(2)}%) and{" "}
                  <strong className={b.quote.changePercent > a.quote.changePercent ? "text-emerald" : "text-blue"}>{b.symbol}</strong> at $
                  {b.quote.price.toLocaleString("en-US", { maximumFractionDigits: 2 })} ({b.quote.changePercent >= 0 ? "+" : ""}{b.quote.changePercent.toFixed(2)}%).
                  {aWins > bWins ? ` ${a.symbol} leads on ${aWins} of ${aWins + bWins} metrics.` : bWins > aWins ? ` ${b.symbol} leads on ${bWins} of ${aWins + bWins} metrics.` : " The two are tied on the compared metrics."}
                </p>
              </div>
            </GlowCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-6">
            <GlowCard glowColor="oklch(0.55 0.18 255 / 0.12)">
              <div className="p-6">
                <div className="mb-6 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 ${aWins >= bWins ? "bg-blue/15" : "bg-blue/5"}`}>
                      <span className={`text-xs font-medium ${aWins > bWins ? "text-blue" : "text-muted-foreground/50"}`}>{a.symbol} — {aWins} {aWins === 1 ? "lead" : "leads"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center"><span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Metric</span></div>
                  <div className="text-center">
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 ${bWins > aWins ? "bg-emerald/15" : "bg-emerald/5"}`}>
                      <span className={`text-xs font-medium ${bWins > aWins ? "text-emerald" : "text-muted-foreground/50"}`}>{b.symbol} — {bWins} {bWins === 1 ? "lead" : "leads"}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-5">
                  {rows.map((row) => (
                    <div key={row.label}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{row.label}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className={`font-medium tabular-nums flex items-center gap-1 ${row.winner === "a" ? "text-blue font-semibold" : "text-muted-foreground"}`}>
                            {row.winner === "a" && <span className="h-1.5 w-1.5 rounded-full bg-blue" />}{row.a}
                          </span>
                          <span className="text-muted-foreground/30">vs</span>
                          <span className={`font-medium tabular-nums flex items-center gap-1 ${row.winner === "b" ? "text-emerald font-semibold" : "text-muted-foreground"}`}>
                            {row.b}{row.winner === "b" && <span className="h-1.5 w-1.5 rounded-full bg-emerald" />}
                          </span>
                        </div>
                      </div>
                      <div className="relative flex h-6 items-center gap-1">
                        <div className="flex-1">
                          <motion.div initial={{ width: 0 }} whileInView={{ width: row.winner === "a" ? "100%" : "50%" }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full rounded-l-full ${row.winner === "a" ? "bg-gradient-to-r from-blue/50 to-blue/20" : "bg-white/5"}`} />
                        </div>
                        <div className={`h-6 w-0.5 rounded-full ${row.winner === "a" ? "bg-blue" : row.winner === "b" ? "bg-emerald" : "bg-white/10"}`} />
                        <div className="flex-1">
                          <motion.div initial={{ width: 0 }} whileInView={{ width: row.winner === "b" ? "100%" : "50%" }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            className={`ml-auto h-full rounded-r-full ${row.winner === "b" ? "bg-gradient-to-l from-emerald/50 to-emerald/20" : "bg-white/5"}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlowCard>
          </motion.div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[a, b].map((side, idx) => (
              <motion.div key={side.symbol} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 + idx * 0.1 }}>
                <GlowCard glowColor={idx === 0 ? "oklch(0.55 0.18 255 / 0.2)" : "oklch(0.62 0.16 168 / 0.2)"}>
                  <div className="p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl font-heading text-sm font-bold text-white ${idx === 0 ? "bg-blue" : "bg-emerald"}`}>{side.symbol.slice(0, 2)}</div>
                        <div>
                          <p className="font-heading text-sm font-semibold">{side.symbol}</p>
                          <p className="text-xs text-muted-foreground/70">{side.quote?.name}</p>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${side.quote!.changePercent >= 0 ? "bg-emerald/15 text-emerald" : "bg-neg/15 text-neg"}`}>
                        {side.quote!.changePercent >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {side.quote!.changePercent >= 0 ? "+" : ""}{side.quote!.changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/[0.03] p-3 dark:bg-white/[0.03]">
                      <div className="text-center"><p className="text-[10px] text-muted-foreground/60">Price</p><p className="text-xs font-semibold tabular-nums">${side.quote!.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p></div>
                      <div className="text-center"><p className="text-[10px] text-muted-foreground/60">Change</p><p className="text-xs font-semibold tabular-nums">{side.quote!.change >= 0 ? "+" : ""}{side.quote!.change.toFixed(2)}</p></div>
                      <div className="text-center"><p className="text-[10px] text-muted-foreground/60">Prev Close</p><p className="text-xs font-semibold tabular-nums">${side.quote!.previousClose.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p></div>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </>
        ) : (
        <EmptyState
          icon={BarChart3}
          tone="blue"
          title="Select two symbols to compare"
          description="Search and pick two tickers above to see a live side-by-side comparison."
        />
      )}
    </div>
  )
}
