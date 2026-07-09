"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Search, Loader2 } from "lucide-react"

type Result = { symbol: string; name: string; exchange: string; type: string }

export function SymbolSearch({ onSelect }: { onSelect: (symbol: string) => void }) {
  const [q, setQ] = useState("")
  const [results, setResults] = useState<Result[]>([])
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

  function choose(r: Result) {
    onSelect(r.symbol)
    setQ("")
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-2xl">
      <div
        className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 backdrop-blur transition-all duration-300 ${
          focused ? "glass-strong shadow-2xl shadow-black/30 ring-1 ring-accent/40" : "glass"
        }`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />
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
          placeholder="Search any stock, ETF, or index worldwide…"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          aria-label="Search symbols"
        />
        <kbd className="hidden rounded-md border border-border bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
          Enter
        </kbd>
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl glass-strong shadow-2xl shadow-black/50"
          >
            {results.map((r, i) => (
              <li key={r.symbol}>
                <button
                  onClick={() => choose(r)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition-colors ${
                    i === active ? "bg-accent/12" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-mono text-sm text-foreground">{r.symbol}</div>
                    <div className="truncate text-xs text-muted-foreground">{r.name}</div>
                  </div>
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                    {r.exchange || r.type}
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
