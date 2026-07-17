"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useRouter } from "next/navigation"
import { Trash2, TrendingUp, TrendingDown, Plus, Search, X, Loader2 } from "lucide-react"
import { addToWatchlist, removeFromWatchlist } from "@/app/actions/portfolio"
import type { WatchlistView } from "@/lib/portfolio"
import { EmptyState } from "@/components/ui/empty-state"
import { currencySymbol, logoUrl, sparklineSvg, fetchSparkline } from "@/lib/utils"

type Suggestion = { symbol: string; name: string; assetType: string }

function WatchlistCard({ item, onRemove, delay }: { item: WatchlistView & { sparkline?: string; logo?: string; currency?: string; exchange?: string; marketState?: string }; onRemove: (s: string) => void; delay: number }) {
  const pos = item.changePercent >= 0
  const ccySym = currencySymbol(item.currency)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="group glass-card edge-light relative overflow-hidden rounded-3xl p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {item.logo ? (
            <img src={item.logo} alt="" width={36} height={36} className="h-9 w-9 rounded-xl bg-white/10 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
          ) : (
            <div className={`flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-bold ${pos ? "bg-emerald/10 text-emerald" : "bg-neg/10 text-neg"}`}>
              {item.symbol.slice(0, 2)}
            </div>
          )}
          <div>
            <p className="font-heading text-base font-semibold">{item.symbol}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{item.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {item.marketState === "REGULAR" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pos" />}
          <button onClick={() => onRemove(item.symbol)} className="rounded-lg p-2 text-muted-foreground/50 transition-colors hover:bg-neg/10 hover:text-neg">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="font-heading text-2xl font-semibold tabular-nums">
          {ccySym}{item.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <span className={`flex items-center gap-1 text-sm font-medium ${pos ? "text-emerald" : "text-neg"}`}>
          {pos ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {pos ? "+" : ""}{item.changePercent.toFixed(2)}%
        </span>
      </div>
      {item.sparkline && (
        <div className="mt-2 h-6" dangerouslySetInnerHTML={{ __html: item.sparkline }} />
      )}
      {item.exchange && (
        <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="rounded-full border border-white/20 px-2 py-0.5">{item.exchange}</span>
          {item.marketState && <span>{item.marketState}</span>}
        </div>
      )}
    </motion.div>
  )
}

export function WatchlistClient({ items: initialItems }: { items: WatchlistView[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sparklines, setSparklines] = useState<Record<string, string>>({})
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setItems(initialItems) }, [initialItems])

  useEffect(() => {
    items.forEach(async (item) => {
      if (sparklines[item.symbol]) return
      const sp = await fetchSparkline(item.symbol)
      if (sp) {
        setSparklines((prev) => ({ ...prev, [item.symbol]: sparklineSvg(sp.values) }))
      }
    })
  }, [items, sparklines])

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return }
    const ctrl = new AbortController()
    setSearching(true)
    fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        const existing = new Set(items.map((i) => i.symbol))
        setSuggestions((d?.results || []).filter((s: Suggestion) => !existing.has(s.symbol)).slice(0, 6))
      })
      .catch(() => {})
      .finally(() => setSearching(false))
    return () => ctrl.abort()
  }, [query, items])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setSuggestions([])
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  async function handleAdd(symbol: string, name?: string) {
    setAdding(symbol); setError(null)
    try {
      await addToWatchlist({ symbol, name })
      setQuery(""); setSuggestions([])
      router.refresh()
    } catch (e: any) {
      setError(e?.message || "Could not add symbol.")
    } finally { setAdding(null) }
  }

  async function handleRemove(symbol: string) {
    setError(null)
    try {
      await removeFromWatchlist(symbol)
      setItems((prev) => prev.filter((i) => i.symbol !== symbol))
    } catch (e: any) {
      setError(e?.message || "Could not remove symbol.")
    }
  }

  return (
    <div className="relative p-6 lg:p-8">
      <div className="relative z-10 mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="mb-8">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Watchlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your favorite symbols with live prices and sparklines.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }} className="relative mb-6" ref={boxRef}>
          <div className="glass-card edge-light flex items-center gap-3 rounded-2xl px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a symbol to add (e.g. AAPL)" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50" />
            {searching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {query && <button onClick={() => { setQuery(""); setSuggestions([]) }}><X className="h-4 w-4 text-muted-foreground" /></button>}
          </div>
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border/30 bg-card/95 backdrop-blur-xl shadow-2xl"
              >
                {suggestions.map((s, i) => (
                  <motion.button
                    key={s.symbol}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    disabled={adding === s.symbol} onClick={() => handleAdd(s.symbol, s.name)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.05]"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{s.symbol}</span>
                      <span className="text-xs text-muted-foreground">{s.name}</span>
                    </div>
                    {adding === s.symbol ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 text-gold" />}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {error && <p className="mt-2 text-xs text-neg">{error}</p>}
        </motion.div>

        {items.length === 0 ? (
          <EmptyState icon={Plus} tone="blue" title="Add your first stock"
            description="Search a ticker above and add it to start tracking live prices, moves, and alerts."
            action={<button onClick={() => document.querySelector<HTMLInputElement>("input[placeholder*='Search a symbol']")?.focus()} className="glass-btn glass-btn-primary px-4 py-2 text-xs"><Plus className="h-3.5 w-3.5" />Add a stock</button>} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <WatchlistCard key={item.symbol} item={{ ...item, sparkline: sparklines[item.symbol] }} onRemove={handleRemove} delay={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
