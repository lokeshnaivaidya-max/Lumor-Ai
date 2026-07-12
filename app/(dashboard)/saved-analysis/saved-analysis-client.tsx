"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { FileText, Trash2, ExternalLink, Search, TrendingUp, TrendingDown, Sparkles, BarChart3, Clock } from "lucide-react"

const MOCK = [
  { symbol: "NVDA", type: "Deep Analysis", date: "2026-07-10", summary: "Strong buy with 87% confidence. AI tailwinds remain intact.", confidence: 87, direction: "up" as const },
  { symbol: "AAPL", type: "Technical", date: "2026-07-08", summary: "Neutral. RSI at 54, consolidating near resistance.", confidence: 62, direction: "neutral" as const },
  { symbol: "TSLA", type: "Earnings Preview", date: "2026-07-05", summary: "Cautious. Valuation remains stretched at 65x P/E.", confidence: 45, direction: "down" as const },
  { symbol: "MSFT", type: "Research Note", date: "2026-07-01", summary: "Azure growth accelerating. Raise target to $480.", confidence: 91, direction: "up" as const },
  { symbol: "BTC", type: "Market Outlook", date: "2026-06-28", summary: "Bull flag forming. Key resistance at $72K.", confidence: 73, direction: "up" as const },
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

export function SavedAnalysisClient() {
  const [search, setSearch] = useState("")
  const [analyses, setAnalyses] = useState(MOCK)
  const filtered = analyses.filter((a) => a.symbol.toLowerCase().includes(search.toLowerCase()) || a.type.toLowerCase().includes(search.toLowerCase()))
  const handleDelete = (symbol: string) => setAnalyses((prev) => prev.filter((a) => a.symbol !== symbol))

  const directionIcon = (d: "up" | "down" | "neutral") =>
    d === "up" ? TrendingUp : d === "down" ? TrendingDown : FileText

  const dirBg = (d: "up" | "down" | "neutral") =>
    d === "up" ? "bg-emerald/10 text-emerald" : d === "down" ? "bg-neg/10 text-neg" : "bg-gold/10 text-gold"

  const dirConfColor = (c: number) =>
    c >= 70 ? "text-emerald" : c >= 50 ? "text-gold" : "text-neg"

  const dirConfBar = (c: number) =>
    c >= 70 ? "bg-gradient-to-r from-emerald to-emerald/60" : c >= 50 ? "bg-gradient-to-r from-gold to-gold/60" : "bg-gradient-to-r from-neg to-neg/60"

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="mb-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Saved Analysis</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every analysis is automatically saved. Revisit past reports anytime.</p>
      </motion.div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="glass-card relative flex-1 max-w-md rounded-2xl"
        >
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search analyses..." className="w-full rounded-2xl bg-transparent py-3 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground/60" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="flex items-center gap-1.5 rounded-2xl glass-card px-3.5 py-2.5 text-xs text-muted-foreground/70"
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>{filtered.length} analysis{filtered.length !== 1 ? "es" : ""}</span>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {filtered.length > 0 ? (
          <motion.div
            key="grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((a, i) => {
              const Icon = directionIcon(a.direction)
              return (
                <motion.div
                  key={a.symbol}
                  layout
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
                  }}
                >
                  <GlowCard glowColor={
                    a.direction === "up" ? "oklch(0.62 0.16 168 / 0.2)" :
                    a.direction === "down" ? "oklch(0.58 0.18 22 / 0.15)" :
                    "oklch(0.75 0.12 75 / 0.2)"
                  }>
                    <div className="p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-2xl p-3 ${dirBg(a.direction)}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-heading text-sm font-semibold">{a.symbol}</p>
                            <span className="inline-block mt-1 rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-muted-foreground/80">{a.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
                          <Clock className="h-3 w-3" />
                          {a.date}
                        </div>
                      </div>
                      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{a.summary}</p>
                      <div className="mb-5 rounded-2xl bg-white/[0.03] p-3.5 dark:bg-white/[0.03]">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-muted-foreground">AI Confidence</span>
                          <span className={`font-semibold ${dirConfColor(a.confidence)}`}>{a.confidence}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-border/30">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${a.confidence}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full rounded-full ${dirConfBar(a.confidence)}`}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border/30 bg-white/[0.02] py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border/60 hover:text-foreground"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />Open Report
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(a.symbol)}
                          className="rounded-2xl border border-border/30 bg-white/[0.02] p-2.5 text-muted-foreground transition-colors hover:border-neg/40 hover:text-neg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </motion.button>
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="mb-5 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5 ring-1 ring-border/30 shadow-xl">
              <Sparkles className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="font-heading text-base font-medium">No saved analyses yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Run your first AI analysis to see it appear here.</p>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="premium-btn premium-btn-primary mt-5 px-5 py-2.5 text-xs"
            >
              <BarChart3 className="h-3.5 w-3.5" />Run Analysis
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
