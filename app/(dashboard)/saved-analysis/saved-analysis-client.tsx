"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import Link from "next/link"
import { Trash2, ArrowUpRight, ArrowDownRight, Minus, Plus, LineChart, FileText } from "lucide-react"
import { deleteSavedAnalysis } from "@/app/actions/saved-analysis"
import { useRouter } from "next/navigation"

type Analysis = {
  id: number
  symbol: string
  kind: string
  summary: string | null
  confidence: number | null
  direction: string
  createdAt: string
}

function DirectionBadge({ direction }: { direction: string }) {
  if (direction === "up") return <span className="badge badge-emerald"><ArrowUpRight className="h-3 w-3" />BULLISH</span>
  if (direction === "down") return <span className="badge badge-neg"><ArrowDownRight className="h-3 w-3" />BEARISH</span>
  return <span className="badge badge-gold"><Minus className="h-3 w-3" />NEUTRAL</span>
}

export function SavedAnalysisClient({ analyses: initial }: { analyses: Analysis[] }) {
  const [items, setItems] = useState(initial)
  const [removing, setRemoving] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => { setItems(initial) }, [initial])

  async function handleDelete(id: number) {
    setRemoving(id); setError(null)
    try {
      await deleteSavedAnalysis(id)
      setItems((p) => p.filter((a) => a.id !== id))
    } catch (e: any) {
      setError(e?.message || "Could not delete analysis.")
    } finally { setRemoving(null) }
  }

  return (
    <div className="p-6 lg:p-8">
      <hr className="divider divider--gold" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="page-head mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="glow-page">
          <p className="subheading"><span className="dot-gold" /> Analysis</p>
          <h1 className="heading mt-1">Saved Reports</h1>
          <p className="body mt-2">Your curated AI market analyses.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/markets")}
          className="lm-btn lm-btn--gold flex items-center gap-2 px-4 py-2.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />New analysis
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="mb-4 rounded-xl border border-neg/20 bg-neg/[0.06] px-4 py-2.5 text-xs text-neg"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bento-card relative overflow-hidden px-8 py-14 text-center"
        >
          <div className="pointer-events-none absolute -inset-20 opacity-30" style={{ background: 'radial-gradient(circle at 50% 0%, var(--gold-glow-strong), transparent 60%)' }} />
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--gold-glow)' }}>
            <LineChart className="h-7 w-7" style={{ color: 'var(--gold)' }} />
          </div>
          <p className="heading-sm">No saved analyses yet</p>
          <p className="body mt-2 max-w-sm mx-auto">Run an AI analysis on any stock and save it here to revisit Lumora's insights anytime.</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/markets")}
            className="btn btn--gold sweep mt-6"
          >
            <Plus className="h-3.5 w-3.5" />Analyze a stock
          </motion.button>
          <div className="relative mt-8">
            <p className="meta mb-3">Or try a prompt in chat</p>
            <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                { q: "Should I buy NVDA now?", t: "Entry timing" },
                { q: "Is AAPL overvalued?", t: "Valuation" },
                { q: "TSLA outlook next quarter", t: "Forecast" },
              ].map((ex) => (
                <Link key={ex.t} href={`/chat?prompt=${encodeURIComponent(ex.q)}`} className="glass-card sweep flex flex-col gap-1 rounded-2xl p-4 text-left transition-transform hover:-translate-y-1">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{ex.t}</span>
                  <span className="meta line-clamp-2">{ex.q}</span>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div layout className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {items.map((a, i) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                whileHover={{ y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, filter: "blur(6px)" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: removing === a.id ? 0 : 0.04 * i }}
                className={`glass-card relative p-5 float-card ${
                  removing === a.id ? "pointer-events-none scale-95 opacity-0 blur-sm" : ""
                }`}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="heading-sm">{a.symbol}</p>
                      <p className="meta capitalize">{a.kind}</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(a.id)} disabled={removing === a.id}
                    className="rounded-lg p-2 text-muted-foreground/50 transition-colors hover:bg-neg/10 hover:text-neg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <DirectionBadge direction={a.direction} />
                  {a.confidence != null && (
                    <span className={`chip ${a.confidence >= 0.6 ? "chip-pos" : a.confidence < 0.4 ? "chip-neg" : "chip-gold"}`}>Confidence {Math.round(a.confidence * 100)}%</span>
                  )}
                </div>
                <p className="body mt-3 line-clamp-3">{a.summary || "Analysis saved."}</p>
                <p className="meta mt-3">{new Date(a.createdAt).toLocaleDateString()}</p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
