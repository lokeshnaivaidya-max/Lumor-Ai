"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Search, Plus, TrendingUp, TrendingDown, Star, ChevronDown, Brain } from "lucide-react"

const INITIAL_WATCHLIST = [
  { symbol: "AAPL", name: "Apple Inc.", price: 178.20, change: 1.2, rating: "Buy", ratingScore: 82 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 892.50, change: 3.8, rating: "Strong Buy", ratingScore: 91 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 238.40, change: -0.6, rating: "Hold", ratingScore: 58 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 425.30, change: 0.8, rating: "Buy", ratingScore: 78 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.15, change: 1.5, rating: "Buy", ratingScore: 76 },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 192.60, change: 0.3, rating: "Buy", ratingScore: 74 },
]

type SortKey = "symbol" | "name" | "price" | "change" | "rating"

export function WatchlistClient() {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("change")
  const [sortAsc, setSortAsc] = useState(false)

  const filtered = INITIAL_WATCHLIST
    .filter((w) => w.symbol.toLowerCase().includes(search.toLowerCase()) || w.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const mul = sortAsc ? 1 : -1
      if (sortKey === "price") return (a.price - b.price) * mul
      if (sortKey === "change") return (a.change - b.change) * mul
      if (sortKey === "rating") return (a.ratingScore - b.ratingScore) * mul
      return a[sortKey].localeCompare(b[sortKey]) * mul
    })

  const formatCurrency = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Watchlist</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track your favorite stocks with live prices and AI ratings.</p>
      </motion.div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="glass relative flex-1 rounded-2xl">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbols..."
            className="w-full rounded-2xl bg-transparent py-3 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        <button className="glass flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <Star className="h-3.5 w-3.5 text-gold" />
          Favorites
        </button>
        <button className="glass-strong flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20">
          <Plus className="h-3.5 w-3.5" />
          Add Stock
        </button>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel edge-light rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {(["symbol", "name", "price", "change", "rating"] as const).map((k) => (
                  <th key={k} className="cursor-pointer px-5 py-4 text-left" onClick={() => { setSortKey(k); setSortAsc((a) => !a) }}>
                    <div className="flex items-center gap-1">
                      {k}
                      <ChevronDown className={`h-3 w-3 transition-transform ${sortKey === k ? sortAsc ? "rotate-180" : "" : "opacity-30"}`} />
                    </div>
                  </th>
                ))}
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((w) => (
                <tr key={w.symbol} className="transition-colors hover:bg-white/5">
                  <td className="px-5 py-4">
                    <span className="font-medium">{w.symbol}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{w.name}</td>
                  <td className="px-5 py-4 text-sm font-medium">{formatCurrency(w.price)}</td>
                  <td className={`px-5 py-4 text-sm font-medium ${w.change >= 0 ? "text-emerald" : "text-neg"}`}>
                    <div className="flex items-center gap-1">
                      {w.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {w.change >= 0 ? "+" : ""}{w.change}%
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        w.rating === "Strong Buy" ? "bg-emerald/15 text-emerald" :
                        w.rating === "Buy" ? "bg-blue/15 text-blue" :
                        "bg-gold/15 text-gold"
                      }`}>{w.rating}</span>
                      <span className="text-xs text-muted-foreground">{w.ratingScore}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                      <Brain className="mr-1 inline h-3 w-3" />
                      Analyze
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
