"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Search, Loader2, Clock, TrendingUp, X, ChevronRight } from "lucide-react"
import { logActivity } from "@/app/actions/activity"

export type SearchResult = {
  symbol: string
  name: string
  exchange: string
  type: string
  strike?: number
  optionType?: "CE" | "PE"
  expiry?: string
  underlying?: string
}

const RECENT_STORAGE_KEY = "lumora_recent_searches"

const TRENDING_QUICK: SearchResult[] = [
  { symbol: "^NSEI", name: "NIFTY 50", exchange: "NSE", type: "INDEX" },
  { symbol: "^NSEBANK", name: "BANK NIFTY", exchange: "NSE", type: "INDEX" },
  { symbol: "LTF.NS", name: "L&T Finance", exchange: "NSE", type: "EQUITY" },
  { symbol: "RELIANCE.NS", name: "Reliance Industries", exchange: "NSE", type: "EQUITY" },
  { symbol: "^NSEI", name: "NIFTY 25000 CE", exchange: "NSE", type: "OPTION", strike: 25000, optionType: "CE", expiry: "JUL", underlying: "NIFTY" },
  { symbol: "GC=F", name: "Gold Futures", exchange: "COMEX", type: "COMMODITY" },
  { symbol: "BTC-USD", name: "Bitcoin", exchange: "CCC", type: "CRYPTO" },
  { symbol: "INR=X", name: "USD / INR", exchange: "FX", type: "FOREX" },
]

export function SymbolSearch({ onSelect }: { onSelect: (result: SearchResult) => void }) {
  const [q, setQ] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const [focused, setFocused] = useState(false)
  const [recent, setRecent] = useState<SearchResult[]>([])

  const boxRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_STORAGE_KEY)
      if (stored) setRecent(JSON.parse(stored))
    } catch {}
  }, [])

  function saveRecent(item: SearchResult) {
    try {
      const updated = [item, ...recent.filter((r) => r.symbol !== item.symbol || r.name !== item.name)].slice(0, 8)
      setRecent(updated)
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated))
    } catch {}
  }

  function clearRecent() {
    setRecent([])
    try {
      localStorage.removeItem(RECENT_STORAGE_KEY)
    } catch {}
  }

  useEffect(() => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setResults(data.results || [])
        setOpen(true)
        setActive(0)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 150)
    return () => clearTimeout(id)
  }, [q])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  // Auto-scroll active keyboard item into view
  useEffect(() => {
    if (!open || !listRef.current) return
    const activeEl = listRef.current.querySelector(`[data-index="${active}"]`)
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [active, open])

  function choose(r: SearchResult) {
    saveRecent(r)
    onSelect(r)
    logActivity({ type: "search", title: `Searched ${r.symbol}`, ticker: r.symbol, href: "/markets?symbol=" + r.symbol }).catch(() => {})
    setQ("")
    setResults([])
    setOpen(false)
  }

  function typeBadge(t: string) {
    switch (t.toUpperCase()) {
      case "OPTION":
        return <span className="rounded-md bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-400 border border-purple-500/20">OPTION</span>
      case "FUTURE":
      case "COMMODITY":
        return <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">FUT/COMM</span>
      case "INDEX":
        return <span className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">INDEX</span>
      case "EQUITY":
        return <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">EQUITY</span>
      case "CRYPTO":
        return <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/20">CRYPTO</span>
      case "FOREX":
      case "CURRENCY":
        return <span className="rounded-md bg-pink-500/15 px-2 py-0.5 text-[10px] font-semibold text-pink-400 border border-pink-500/20">FOREX</span>
      default:
        return <span className="rounded-md bg-zinc-500/15 px-2 py-0.5 text-[10px] font-semibold text-zinc-400 border border-zinc-500/20">{t}</span>
    }
  }

  const showRecentOrTrending = open && !q.trim()

  return (
    <div ref={boxRef} className="relative w-full max-w-2xl">
      <motion.div
        className={`flex items-center gap-3 rounded-[24px] px-5 py-3.5 glass-strong transition-all duration-300 ${
          focused
            ? "ring-2 ring-[var(--gold)] border-transparent shadow-2xl shadow-black/30"
            : "border border-[var(--line-strong)]"
        }`}
        animate={focused ? { scale: 1.005 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 250, damping: 20 }}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--gold)]" />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            setFocused(true)
            setOpen(true)
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false)
              return
            }
            if (!open) return
            const maxIdx = q.trim() ? results.length - 1 : recent.length + TRENDING_QUICK.length - 1
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setActive((a) => Math.min(a + 1, maxIdx))
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              setActive((a) => Math.max(a - 1, 0))
            } else if (e.key === "Enter") {
              e.preventDefault()
              if (q.trim() && results[active]) {
                choose(results[active])
              } else if (!q.trim()) {
                const combined = [...recent, ...TRENDING_QUICK]
                if (combined[active]) choose(combined[active])
              }
            }
          }}
          placeholder="Search stocks, indices, options (e.g. NIFTY 25000 CE), futures, crypto…"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          aria-label="Search symbols"
        />
        {q && (
          <button
            onClick={() => {
              setQ("")
              setResults([])
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <kbd className="hidden rounded-lg border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-mono text-muted-foreground sm:block">
          ESC
        </kbd>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            onMouseDown={(e) => e.preventDefault()}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-[24px] border border-[var(--line-strong)] bg-[#0B0F19]/96 dark:bg-[#070A12]/96 backdrop-blur-2xl shadow-2xl shadow-black/80 ring-1 ring-white/10"
          >
            <div ref={listRef} className="max-h-[380px] overflow-y-auto p-2 scrollbar-thin">
              {q.trim() ? (
                results.length > 0 ? (
                  results.map((r, i) => (
                    <motion.button
                      key={`${r.symbol}-${r.type}-${r.strike ?? ""}-${r.optionType ?? ""}-${i}`}
                      data-index={i}
                      onClick={() => choose(r)}
                      onMouseEnter={() => setActive(i)}
                      className={`flex w-full items-center justify-between gap-4 rounded-xl px-3.5 py-2.5 text-left transition-all ${
                        i === active
                          ? "bg-white/15 text-white shadow-sm ring-1 ring-white/20"
                          : "hover:bg-white/10 text-zinc-200"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {typeBadge(r.type)}
                          <span className="font-mono text-sm font-semibold tracking-tight text-white">
                            {r.type === "OPTION" ? r.name : r.symbol}
                          </span>
                        </div>
                        <div className="truncate text-xs text-zinc-400 mt-0.5">
                          {r.type === "OPTION"
                            ? `${r.underlying ?? r.symbol} · ${r.expiry ?? ""} ${r.strike ?? ""} ${r.optionType ?? ""}`
                            : r.name}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-mono text-zinc-400">
                          {r.exchange || r.type}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
                      </div>
                    </motion.button>
                  ))
                ) : (
                  <div className="p-6 text-center text-sm text-zinc-400">
                    No matching instruments found for &ldquo;{q}&rdquo;
                  </div>
                )
              ) : (
                <div className="p-2 space-y-3">
                  {recent.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-[var(--gold)]" /> Recent Searches</span>
                        <button onClick={clearRecent} className="text-[10px] text-zinc-500 hover:text-zinc-300">Clear</button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 mt-1">
                        {recent.map((r, i) => (
                          <button
                            key={`rec-${r.symbol}-${i}`}
                            data-index={i}
                            onClick={() => choose(r)}
                            onMouseEnter={() => setActive(i)}
                            className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all ${
                              i === active ? "bg-white/15 text-white" : "bg-white/5 hover:bg-white/10 text-zinc-300"
                            }`}
                          >
                            <span className="font-mono font-medium truncate">{r.symbol}</span>
                            <span className="text-[10px] text-zinc-500 truncate">{r.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-[var(--gold)]" /> Trending Universe
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      {TRENDING_QUICK.map((r, i) => {
                        const idx = recent.length + i
                        return (
                          <button
                            key={`trend-${r.symbol}-${i}`}
                            data-index={idx}
                            onClick={() => choose(r)}
                            onMouseEnter={() => setActive(idx)}
                            className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all ${
                              idx === active ? "bg-white/15 text-white" : "bg-white/5 hover:bg-white/10 text-zinc-300"
                            }`}
                          >
                            <span className="font-mono font-semibold text-white">{r.type === "OPTION" ? "NIFTY 25000 CE" : r.name}</span>
                            <span className="text-[10px] text-zinc-400">{r.type}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
