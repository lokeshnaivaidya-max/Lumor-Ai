"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useRouter } from "next/navigation"
import { Trash2, TrendingUp, TrendingDown, Plus, Search, X, Loader2, Star } from "lucide-react"
import { addToWatchlist, removeFromWatchlist } from "@/app/actions/portfolio"
import type { WatchlistView } from "@/lib/portfolio"
import { currencySymbol, sparklineSvg, fetchSparkline } from "@/lib/utils"

type Suggestion = { symbol: string; name: string; assetType: string }

function WatchlistCard({ item, onRemove, delay }: { item: WatchlistView & { sparkline?: string; logo?: string; currency?: string; exchange?: string; marketState?: string }; onRemove: (s: string) => void; delay: number }) {
  const pos = item.changePercent >= 0
  const ccySym = currencySymbol(item.currency)
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileHover={{ y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="glass-card float-card flex flex-col">
      <div className="flex items-start justify-between p-5">
        <div className="flex items-center gap-3">
          {item.logo ? (
            <img src={item.logo} alt="" width={36} height={36} className="h-9 w-9 rounded-xl bg-[var(--panel)] object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
          ) : (
            <div className={`flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-bold ${pos ? "bg-[var(--pos-glow)] text-[var(--pos)]" : "bg-[var(--neg-glow)] text-[var(--neg)]"}`}>{item.symbol.slice(0, 2)}</div>
          )}
          <div>
            <p className="heading-sm">{item.symbol}</p>
            <p className="meta line-clamp-1">{item.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {item.marketState === "REGULAR" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--pos)]" />}
          <button onClick={() => onRemove(item.symbol)} className="rounded-lg p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--neg-glow)] hover:text-[var(--neg)] pressable"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
        <div className="px-5 pb-5">
          <div className="flex items-center justify-between">
            <p className="stat-number">{ccySym}{item.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <span className={`chip ${pos ? "chip-pos" : "chip-neg"} flex items-center gap-1`}>
              {pos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{pos ? "+" : ""}{item.changePercent.toFixed(2)}%
            </span>
          </div>
          {item.sparkline && <div className="mt-3 h-6" dangerouslySetInnerHTML={{ __html: item.sparkline }} />}
          {item.exchange && (
            <div className="mt-3 flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
              <span className="rounded-full border border-[var(--line)] px-2 py-0.5">{item.exchange}</span>
              {item.marketState && <span>{item.marketState}</span>}
            </div>
          )}
        </div>
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
      if (sp) setSparklines((prev) => ({ ...prev, [item.symbol]: sparklineSvg(sp.values) }))
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
    } catch (e: any) { setError(e?.message || "Could not add symbol.") } finally { setAdding(null) }
  }
  async function handleRemove(symbol: string) {
    setError(null)
    try {
      await removeFromWatchlist(symbol)
      setItems((prev) => prev.filter((i) => i.symbol !== symbol))
    } catch (e: any) { setError(e?.message || "Could not remove symbol.") }
  }

  return (
    <div className="p-6 lg:p-8">
      <hr className="divider divider--gold" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="page-head mb-8 glow-page">
        <p className="subheading"><span className="dot-gold" /> Watchlist</p>
        <h1 className="heading mt-1">Stocks You Follow</h1>
        <p className="body mt-2">Track your favorite symbols with live prices and sparklines.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }} className="relative mb-6 max-w-xl" ref={boxRef}>
        <div className="glass-input flex items-center gap-3 rounded-2xl px-4 py-3">
          <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a symbol to add (e.g. AAPL)" className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]" />
          {searching && <Loader2 className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" />}
          {query && <button onClick={() => { setQuery(""); setSuggestions([]) }}><X className="h-4 w-4 text-[var(--text-tertiary)]" /></button>}
        </div>
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel-2)] shadow-2xl">
              {suggestions.map((s, i) => (
                <motion.button key={s.symbol} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03, duration: 0.2 }} disabled={adding === s.symbol} onClick={() => handleAdd(s.symbol, s.name)} className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--panel)]">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[var(--text-primary)]">{s.symbol}</span>
                    <span className="meta">{s.name}</span>
                  </div>
                  {adding === s.symbol ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 text-[var(--gold)]" />}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        {error && <p className="mt-2 text-xs text-[var(--neg)]">{error}</p>}
      </motion.div>

      {items.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="bento-card relative overflow-hidden px-8 py-16 text-center">
          <div className="pointer-events-none absolute -inset-20 opacity-40" style={{ background: 'radial-gradient(circle at 50% 0%, var(--gold-glow-strong), transparent 60%)' }} />
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--gold-glow)]"><Star className="h-7 w-7 text-[var(--gold)]" /></div>
          <p className="heading-sm">Add your first stock</p>
          <p className="body mt-2 mx-auto max-w-sm">Search a ticker above and add it to start tracking live prices, moves, and alerts.</p>
          <motion.button onClick={() => document.querySelector<HTMLInputElement>("input[placeholder*='Search a symbol']")?.focus()} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn btn--gold mt-6"><Plus className="h-3.5 w-3.5" />Add a stock</motion.button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (<WatchlistCard key={item.symbol} item={{ ...item, sparkline: sparklines[item.symbol] }} onRemove={handleRemove} delay={i} />))}
        </div>
      )}
    </div>
  )
}
