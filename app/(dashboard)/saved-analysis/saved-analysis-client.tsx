"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Trash2, ArrowUpRight, ArrowDownRight, Minus, Plus, FileText } from "lucide-react"
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
      <hr className="dm-rule dm-rule--gold dm-animate" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="dm-heading dm-animate">Saved Analysis</h1>
          <p className="dm-body dm-animate dm-animate--delay-1">Your curated AI market analyses.</p>
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
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <p className="dm-body">No saved analyses yet</p>
          <p className="dm-body dm-animate dm-animate--delay-1 mt-1 max-w-sm">Run an AI analysis on any stock and save it here to revisit Lumora's insights anytime.</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/markets")}
            className="lm-btn lm-btn--gold mt-6 flex items-center gap-2 px-4 py-2 text-xs"
          >
            Analyze a stock
          </motion.button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div layout className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {items.map((a, i) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, filter: "blur(6px)" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: removing === a.id ? 0 : 0.04 * i }}
                className={`dm-card dm-card--inset dm-animate relative p-5 ${
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
                      <p className="dm-heading text-base">{a.symbol}</p>
                      <p className="dm-meta capitalize">{a.kind}</p>
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
                    <span className="dm-meta">Confidence {Math.round(a.confidence * 100)}%</span>
                  )}
                </div>
                <p className="dm-body mt-3 line-clamp-3">{a.summary || "Analysis saved."}</p>
                <p className="dm-meta mt-3">{new Date(a.createdAt).toLocaleDateString()}</p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
