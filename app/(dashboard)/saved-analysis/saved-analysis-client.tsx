"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { FileText, Trash2, ExternalLink, Search, TrendingUp, TrendingDown } from "lucide-react"

const MOCK = [
  { symbol: "NVDA", type: "Deep Analysis", date: "2026-07-10", summary: "Strong buy with 87% confidence. AI tailwinds remain intact.", confidence: 87, direction: "up" as const },
  { symbol: "AAPL", type: "Technical", date: "2026-07-08", summary: "Neutral. RSI at 54, consolidating near resistance.", confidence: 62, direction: "neutral" as const },
  { symbol: "TSLA", type: "Earnings Preview", date: "2026-07-05", summary: "Cautious. Valuation remains stretched at 65x P/E.", confidence: 45, direction: "down" as const },
  { symbol: "MSFT", type: "Research Note", date: "2026-07-01", summary: "Azure growth accelerating. Raise target to $480.", confidence: 91, direction: "up" as const },
  { symbol: "BTC", type: "Market Outlook", date: "2026-06-28", summary: "Bull flag forming. Key resistance at $72K.", confidence: 73, direction: "up" as const },
]

export function SavedAnalysisClient() {
  const [search, setSearch] = useState("")
  const [analyses, setAnalyses] = useState(MOCK)
  const filtered = analyses.filter((a) => a.symbol.toLowerCase().includes(search.toLowerCase()) || a.type.toLowerCase().includes(search.toLowerCase()))
  const handleDelete = (symbol: string) => setAnalyses((prev) => prev.filter((a) => a.symbol !== symbol))

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Saved Analysis</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every analysis is automatically saved. Revisit past reports anytime.</p>
      </motion.div>

      <div className="mb-6 glass relative rounded-2xl max-w-md">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search analyses..." className="w-full rounded-2xl bg-transparent py-3 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground/60" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        {filtered.map((a, i) => (
          <div key={i} className="glass-card edge-light rounded-2xl p-5 transition-all hover:bg-white/[0.02]">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`rounded-xl p-2.5 ${a.direction === "up" ? "bg-emerald/10 text-emerald" : a.direction === "down" ? "bg-neg/10 text-neg" : "bg-gold/10 text-gold"}`}>
                  {a.direction === "up" ? <TrendingUp className="h-4 w-4" /> : a.direction === "down" ? <TrendingDown className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{a.symbol}</span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">{a.type}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.summary}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{a.date}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                        <div className={`h-full rounded-full ${a.confidence >= 70 ? "bg-emerald" : a.confidence >= 50 ? "bg-gold" : "bg-neg"}`}
                          style={{ width: `${a.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{a.confidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="glass rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-foreground">
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(a.symbol)} className="glass rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-neg">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No saved analyses yet</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
