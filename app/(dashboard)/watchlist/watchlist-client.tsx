"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, Plus, TrendingUp, TrendingDown, Star, Brain, X, SlidersHorizontal, Sparkles } from "lucide-react"

const INITIAL_WATCHLIST = [
  { symbol: "AAPL", name: "Apple Inc.", price: 178.20, change: 1.2, rating: "Buy", ratingScore: 82 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 892.50, change: 3.8, rating: "Strong Buy", ratingScore: 91 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 238.40, change: -0.6, rating: "Hold", ratingScore: 58 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 425.30, change: 0.8, rating: "Buy", ratingScore: 78 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.15, change: 1.5, rating: "Buy", ratingScore: 76 },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 192.60, change: 0.3, rating: "Buy", ratingScore: 74 },
]

type SortKey = "symbol" | "name" | "price" | "change" | "rating"

const ALL_SYMBOLS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "NVDA", name: "NVIDIA Corp." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "MSFT", name: "Microsoft Corp." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "AMD", name: "Advanced Micro Devices" },
]

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "change", label: "Change" },
  { key: "price", label: "Price" },
  { key: "rating", label: "Rating" },
  { key: "symbol", label: "Symbol" },
  { key: "name", label: "Name" },
]

function GlowCard({ children, className, glowColor = "oklch(0.55 0.18 255 / 0.15)" }: {
  children: React.ReactNode; className?: string; glowColor?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.008 }}
      transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.6 }}
      className="group relative transform-gpu"
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 blur-xl transition-all duration-500 group-hover:opacity-100"
        style={{ boxShadow: `0 0 48px 8px ${glowColor}` }}
      />
      <div className="relative glass-card overflow-hidden rounded-3xl">{children}</div>
    </motion.div>
  )
}

export function WatchlistClient() {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("change")
  const [sortAsc, setSortAsc] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const filtered = INITIAL_WATCHLIST
    .filter((w) => w.symbol.toLowerCase().includes(search.toLowerCase()) || w.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const m = sortAsc ? 1 : -1
      if (sortKey === "price") return (a.price - b.price) * m
      if (sortKey === "change") return (a.change - b.change) * m
      if (sortKey === "rating") return (a.ratingScore - b.ratingScore) * m
      return a[sortKey].localeCompare(b[sortKey]) * m
    })

  const suggestions = ALL_SYMBOLS.filter(
    (s) => !INITIAL_WATCHLIST.find((w) => w.symbol === s.symbol) &&
      (s.symbol.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 4)

  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="mb-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Watchlist</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track your favorite stocks with live prices and AI ratings.</p>
      </motion.div>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          ref={searchRef}
          className="glass-card relative flex-1 max-w-md rounded-2xl"
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        >
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true) }} placeholder="Search symbols..." className="w-full rounded-2xl bg-transparent py-3 pl-11 pr-10 text-sm outline-none placeholder:text-muted-foreground/60" />
          {search && (
            <button onClick={() => { setSearch(""); setShowSuggestions(false) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
          <AnimatePresence>
            {showSuggestions && search && suggestions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border/40 bg-background/95 p-2 shadow-2xl backdrop-blur-2xl"
              >
                {suggestions.map((s) => (
                  <button key={s.symbol} onClick={() => setSearch(s.symbol)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="font-medium">{s.symbol}</span>
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="ml-auto text-xs text-blue">+ Add</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card flex items-center gap-1 rounded-2xl p-1.5"
        >
          {SORT_OPTIONS.map((opt) => (
            <button key={opt.key} onClick={() => { setSortKey(opt.key); if (sortKey === opt.key) setSortAsc((a) => !a) }}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors ${
                sortKey === opt.key ? "bg-foreground/10 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="premium-btn premium-btn-primary px-4 py-2.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />Add Stock
        </motion.button>
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {filtered.map((w, i) => (
          <motion.div
            key={w.symbol}
            layout
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
            }}
          >
            <GlowCard glowColor={w.change >= 0 ? "oklch(0.62 0.16 168 / 0.2)" : "oklch(0.58 0.18 22 / 0.2)"}>
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl font-heading text-sm font-bold ${
                      w.change >= 0 ? "bg-emerald/10 text-emerald" : "bg-neg/10 text-neg"
                    }`}>
                      {w.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-heading text-sm font-semibold">{w.symbol}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          w.rating === "Strong Buy" ? "bg-emerald/15 text-emerald" : w.rating === "Buy" ? "bg-blue/15 text-blue" : "bg-gold/15 text-gold"
                        }`}>{w.rating}</span>
                      </div>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">{w.name}</p>
                    </div>
                  </div>
                  <Star className={`h-4 w-4 ${w.ratingScore >= 70 ? "text-gold fill-gold" : "text-muted-foreground/30"}`} />
                </div>

                <div className="mb-4 flex items-baseline justify-between">
                  <span className="font-heading text-2xl font-semibold tabular-nums">{fmt(w.price)}</span>
                  <span className={`flex items-center gap-1 text-sm font-medium tabular-nums ${w.change >= 0 ? "text-emerald" : "text-neg"}`}>
                    {w.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {w.change >= 0 ? "+" : ""}{w.change}%
                  </span>
                </div>

                <div className="rounded-2xl bg-white/[0.03] p-3 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-3.5 w-3.5 text-violet" />
                      <span className="text-xs text-muted-foreground">AI Confidence</span>
                    </div>
                    <span className="text-xs font-medium tabular-nums">{w.ratingScore}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/30">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${w.ratingScore}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className={`h-full rounded-full ${w.ratingScore >= 70 ? "bg-gradient-to-r from-emerald to-emerald/60" : w.ratingScore >= 50 ? "bg-gradient-to-r from-gold to-gold/60" : "bg-gradient-to-r from-neg to-neg/60"}`}
                    />
                  </div>
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="mt-4 w-full rounded-2xl border border-border/30 bg-white/[0.02] py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border/60 hover:text-foreground"
                >
                  <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />Run AI Analysis
                </motion.button>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </motion.div>

      <AnimatePresence>
        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="mb-5 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-border/30">
              <Search className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="font-heading text-base font-medium">No stocks match your search</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different symbol or name.</p>
            <button onClick={() => setSearch("")} className="premium-btn premium-btn-primary mt-5 px-5 py-2.5 text-xs">
              Clear search
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
