"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "motion/react"
import { Trash2, Sparkles, ArrowUpRight, ArrowDownRight, Minus, Plus, FileText } from "lucide-react"
import { deleteSavedAnalysis } from "@/app/actions/saved-analysis"
import { EmptyState } from "@/components/ui/empty-state"
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
  if (direction === "up") return <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald"><ArrowUpRight className="h-3 w-3" />BULLISH</span>
  if (direction === "down") return <span className="inline-flex items-center gap-0.5 rounded-md bg-neg/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-neg"><ArrowDownRight className="h-3 w-3" />BEARISH</span>
  return <span className="inline-flex items-center gap-0.5 rounded-md bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-gold"><Minus className="h-3 w-3" />NEUTRAL</span>
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
    <div className="relative p-6 lg:p-8">
      <div className="relative z-10 mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Saved Analysis</h1>
            <p className="mt-1 text-sm text-muted-foreground">Your curated AI market analyses.</p>
          </div>
          <button onClick={() => router.push("/markets")} className="premium-btn premium-btn-primary px-4 py-2.5 text-xs">
            <Plus className="h-3.5 w-3.5" />New analysis
          </button>
        </motion.div>

        {error && <p className="mb-4 text-xs text-neg">{error}</p>}

        {items.length === 0 ? (
          <EmptyState
            icon={FileText}
            tone="violet"
            title="No saved analyses yet"
            description="Run an AI analysis on any stock and save it here to revisit Lumora's insights anytime."
            action={
              <button onClick={() => router.push("/markets")} className="premium-btn premium-btn-primary px-4 py-2 text-xs">
                <Sparkles className="h-3.5 w-3.5" />Analyze a stock
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {items.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4 }}
                className="group glass-card edge-light relative overflow-hidden rounded-3xl p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/10 text-violet">
                      <Sparkles className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="font-heading text-base font-semibold">{a.symbol}</p>
                      <p className="text-xs capitalize text-muted-foreground">{a.kind}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(a.id)} disabled={removing === a.id} className="rounded-lg p-2 text-muted-foreground/50 transition-colors hover:bg-neg/10 hover:text-neg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <DirectionBadge direction={a.direction} />
                  {a.confidence != null && (
                    <span className="text-xs text-muted-foreground">Confidence {Math.round(a.confidence * 100)}%</span>
                  )}
                </div>
                <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground">{a.summary || "Analysis saved."}</p>
                <p className="mt-3 text-[11px] text-muted-foreground/60">{new Date(a.createdAt).toLocaleDateString()}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
