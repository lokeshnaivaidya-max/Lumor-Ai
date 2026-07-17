"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Search, Loader2, TrendingUp, TrendingDown } from "lucide-react"

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

export function SymbolSearch({ onSelect }: { onSelect: (result: SearchResult) => void }) {
  const [q, setQ] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const [focused, setFocused] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

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
    }, 220)
    return () => clearTimeout(id)
  }, [q])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  function choose(r: SearchResult) {
    onSelect(r)
    setQ("")
    setResults([])
    setOpen(false)
  }

  function typeColor(t: string): string {
    switch (t) {
      case "OPTION": return "bg-violet/10 text-violet"
      case "FUTURE": case "COMMODITY": return "bg-gold/10 text-gold"
      case "INDEX": return "bg-blue/10 text-blue"
      case "EQUITY": return "bg-emerald/10 text-emerald"
      case "CRYPTO": return "bg-cyan/10 text-cyan"
      case "FOREX": return "bg-purple/10 text-purple"
      default: return "bg-white/10 text-muted-foreground"
    }
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-2xl">
      <motion.div
        className={`flex items-center gap-3 rounded-[28px] px-5 py-3.5 border border-white/20 bg-white/15 backdrop-blur-xl transition-all duration-300 ${
          focused ? "border-white/40 shadow-2xl shadow-black/10 bg-white/20" : ""
        }`}
        animate={focused ? { scale: 1.01 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue" />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            setFocused(true)
            if (results.length) setOpen(true)
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing || e.keyCode === 229) return
            if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, results.length - 1))
            else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0))
            else if (e.key === "Enter" && results[active]) choose(results[active])
          }}
          placeholder="Search stocks, indices, options, futures, crypto, forex…"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          aria-label="Search symbols"
        />
        <kbd className="hidden rounded-lg border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
          Enter
        </kbd>
      </motion.div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            onMouseDown={(e) => e.preventDefault()}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-30 mt-2 w-full overflow-hidden rounded-[28px] border border-white/20 bg-white/20 backdrop-blur-2xl shadow-2xl shadow-black/20"
          >
            <div className="px-2 py-1">
              {results.map((r, i) => (
                <motion.button
                  key={`${r.symbol}-${r.type}-${r.strike ?? ""}-${r.optionType ?? ""}-${i}`}
                  onClick={() => choose(r)}
                  onMouseEnter={() => setActive(i)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left transition-all ${
                    i === active ? "bg-white/15 scale-[1.01]" : "hover:bg-white/10"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${typeColor(r.type)}`}>
                        {r.type === "OPTION" ? `${r.optionType ?? ""}` : r.type}
                      </span>
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {r.type === "OPTION" ? r.name : r.symbol}
                      </span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground mt-0.5">
                      {r.type === "OPTION" ? `${r.underlying ?? r.symbol} · ${r.exchange}` : r.name}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/20 px-2.5 py-0.5 text-[10px] text-muted-foreground">
                    {r.exchange || r.type}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
