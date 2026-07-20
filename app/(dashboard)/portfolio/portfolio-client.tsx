"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, useSpring, useMotionValue } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus, Wallet, TrendingUp, ShieldCheck, BarChart3,
  ChevronRight, ArrowUpRight, ArrowDownRight, X, Loader2, Trash2,
} from "lucide-react"
import { addHolding, removeHolding } from "@/app/actions/portfolio"

type Holding = {
  symbol: string
  name: string | null
  quantity: number
  avgPrice: number
  price: number
  change: number
  changePercent: number
  marketValue: number
  costBasis: number
}

type Summary = {
  investment: number
  value: number
  todayPnL: number
  totalReturns: number
  returnsPercent: number
  holdingsCount: number
}

const TAB_ITEMS = ["holdings", "allocation", "performance"] as const
type Tab = (typeof TAB_ITEMS)[number]

function StatCard({ label, value, trend, delay }: {
  label: string; value: string; trend?: { value: string; positive: boolean }; delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
      className="bento-card"
    >
      <div className="p-6">
        <div className="space-y-2">
          <p className="meta">{label}</p>
          <p className="stat-number font-mono tabular-nums">{value}</p>
          {trend && (
            <p className={`flex items-center gap-1.5 text-xs font-medium ${trend.positive ? "text-emerald" : "text-neg"}`}>
              {trend.value}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function TabBar({ active, onChange }: { active: Tab; onChange: (v: Tab) => void }) {
  return (
    <div className="glass-card relative inline-flex gap-1 rounded-2xl p-1.5">
      {TAB_ITEMS.map((tab) => (
        <button key={tab} onClick={() => onChange(tab)}
          className={`relative z-10 rounded-xl px-5 py-2 text-sm capitalize transition-colors ${active === tab ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>
          {tab}
          {active === tab && <motion.div layoutId="portfolio-tab-pill" className="absolute inset-0 -z-10 rounded-xl bg-foreground/10 shadow-sm" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
        </button>
      ))}
    </div>
  )
}

export function PortfolioClient({ holdings: initial, summary: initialSummary }: { holdings: Holding[]; summary: Summary }) {
  const router = useRouter()
  const [holdings, setHoldings] = useState(initial)
  const [summary, setSummary] = useState(initialSummary)
  const [view, setView] = useState<Tab>("holdings")
  const [adding, setAdding] = useState(false)
  const [symbol, setSymbol] = useState("")
  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [avgPrice, setAvgPrice] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setHoldings(initial); setSummary(initialSummary) }, [initial, initialSummary])

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

  const totalValue = summary.value
  const totalPnL = summary.totalReturns
  const pnlPercent = summary.returnsPercent
  const hasData = holdings.length > 0

  const allocations = hasData
    ? holdings.map((h) => ({ symbol: h.symbol, pct: totalValue > 0 ? (h.marketValue / totalValue) * 100 : 0 }))
    : []

  const maxAlloc = allocations.reduce((m, a) => Math.max(m, a.pct), 0)
  const healthScore = !hasData
    ? 0
    : Math.max(0, Math.min(100, Math.round(100 - maxAlloc * 0.4 - (holdings.length < 3 ? 12 : 0))))

  async function handleAdd() {
    setError(null)
    const q = Number(quantity)
    const p = Number(avgPrice)
    if (!symbol.trim()) { setError("Symbol is required"); return }
    if (!Number.isFinite(q) || q <= 0) { setError("Quantity must be greater than 0"); return }
    if (!Number.isFinite(p) || p < 0) { setError("Average price must be 0 or greater"); return }
    setBusy(true)
    try {
      await addHolding({ symbol, name: name || undefined, quantity: q, avgPrice: p })
      setAdding(false); setSymbol(""); setName(""); setQuantity(""); setAvgPrice("")
      router.refresh()
    } catch (e: any) { setError(e?.message || "Failed to add holding") } finally { setBusy(false) }
  }

  async function handleRemove(id: number) {
    setBusy(true)
    try { await removeHolding(id); router.refresh() } catch { /* ignore */ } finally { setBusy(false) }
  }

  return (
    <div className="p-6 lg:p-8">
      <hr className="divider divider--gold" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="page-head mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="glow-page">
          <p className="subheading"><span className="dot-gold" /> Portfolio</p>
          <h1 className="heading mt-1">Your Holdings</h1>
          <p className="body mt-2">Manage your holdings and track performance</p>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex items-center gap-2">
          <Link href="/chat" className="lm-btn flex items-center gap-1.5 px-4 py-2.5 text-xs"><BarChart3 className="h-3.5 w-3.5" />AI Review</Link>
          <button onClick={() => { setError(null); setAdding(true) }} className="lm-btn lm-btn--gold flex items-center gap-1.5 px-4 py-2.5 text-xs"><Plus className="h-3.5 w-3.5" />Add Holding</button>
        </motion.div>
      </motion.div>

      {error && <p className="mb-4 rounded-xl bg-neg/10 px-4 py-2.5 text-xs text-neg">{error}</p>}

      {hasData ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Total Value" value={fmt(totalValue)} trend={{ value: "Live valuation", positive: true }} delay={0.05} />
            <StatCard label="Total P&L" value={`${totalPnL >= 0 ? "+" : ""}${fmt(totalPnL)}`} trend={{ value: `${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(2)}%`, positive: totalPnL >= 0 }} delay={0.1} />
            <StatCard label="Health Score" value={String(healthScore)} trend={{ value: healthScore >= 70 ? "Well diversified" : "Concentrated", positive: healthScore >= 70 }} delay={0.15} />
          </div>

          <div className="mb-6 flex items-center justify-between">
            <TabBar active={view} onChange={setView} />
          </div>

          {view === "holdings" && (
            <motion.div key="holdings" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="table-wrap">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: "var(--glass-border)" }}>
                        <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>Symbol</th>
                        <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>Name</th>
                        <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>Shares</th>
                        <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>Avg Price</th>
                        <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>Current</th>
                        <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>P&amp;L</th>
                        <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>Allocation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map((h, idx) => {
                        const pnl = h.marketValue - h.costBasis
                        const pnlPct = h.costBasis > 0 ? ((h.price - h.avgPrice) / h.avgPrice) * 100 : 0
                        const alloc = allocations[idx]?.pct ?? 0
                        return (
                          <motion.tr key={h.symbol} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05, duration: 0.5 }}
                            className="table-row table-row--clickable group">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/10">
                                  <span className="text-xs font-bold text-foreground">{h.symbol.slice(0, 2)}</span>
                                </div>
                                <span className="font-semibold">{h.symbol}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-muted-foreground">{h.name ?? "—"}</td>
                            <td className="px-5 py-4 text-right font-mono text-sm tabular-nums">{h.quantity}</td>
                            <td className="px-5 py-4 text-right font-mono text-sm tabular-nums">{fmt(h.avgPrice)}</td>
                            <td className="px-5 py-4 text-right font-mono text-sm font-semibold tabular-nums">{fmt(h.price)}</td>
                            <td className={`px-5 py-4 text-right font-mono text-sm font-semibold tabular-nums ${pnl >= 0 ? "text-emerald" : "text-neg"}`}>
                              {pnl >= 0 ? "+" : ""}{fmt(pnl)}
                              <span className="ml-1.5 text-xs font-sans font-normal opacity-75">({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)</span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="h-1.5 w-12 overflow-hidden rounded-full bg-border">
                                  <motion.div
                                    className="h-full rounded-full bg-gold"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${alloc}%` }}
                                    transition={{ duration: 0.8, delay: idx * 0.05 }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">{alloc.toFixed(1)}%</span>
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {view === "allocation" && (
            <motion.div key="allocation" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid gap-6 lg:grid-cols-2">
              <div className="bento-card">
                <div className="p-6">
                  <h3 className="heading mb-5">Allocation by Holding</h3>
                  <div className="space-y-5">
                    {allocations.map((a, i) => (
                      <motion.div key={a.symbol} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-gold" />
                            <span className="font-medium">{a.symbol}</span>
                          </div>
                          <span className="font-mono text-sm font-semibold tabular-nums text-muted-foreground">{a.pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-border">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${a.pct}%` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.1 }} className="h-full rounded-full bg-gold" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bento-card">
                <div className="p-6">
                  <h3 className="heading mb-5">Holdings Allocation</h3>
                  <div className="flex flex-col items-center">
                    <div className="relative flex h-52 w-52 items-center justify-center">
                      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                        {allocations.map((a, i) => {
                          const offset = allocations.slice(0, i).reduce((s, x) => s + x.pct, 0)
                          const circumference = 2 * Math.PI * 38
                          const dash = (a.pct / 100) * circumference
                          return (
                            <motion.circle key={a.symbol} cx="50" cy="50" r="38" fill="none" stroke="currentColor" className="text-gold" strokeWidth="8" strokeLinecap="round"
                              strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-((offset / 100) * circumference)}
                              initial={{ strokeDasharray: `0 ${circumference}` }} animate={{ strokeDasharray: `${dash} ${circumference - dash}` }}
                              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.1 }} />
                          )
                        })}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-heading text-lg font-bold">{holdings.length}</span>
                        <span className="text-[10px] text-muted-foreground">Holdings</span>
                      </div>
                    </div>
                    <div className="mt-6 grid w-full grid-cols-2 gap-2">
                      {holdings.map((h, i) => (
                        <motion.div key={h.symbol} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }} className="flex items-center justify-between rounded-xl bg-card px-3.5 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-gold" />
                            <span className="text-xs font-medium">{h.symbol}</span>
                          </div>
                          <span className="font-mono text-xs tabular-nums text-muted-foreground">{allocations[i]?.pct.toFixed(1)}%</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === "performance" && (
            <motion.div key="performance" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="bento-card">
                <div className="p-8">
                  <h3 className="heading">Performance Analytics</h3>
                  <p className="body mt-0.5">Portfolio performance over time</p>
                  <div className="mt-6 flex h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-card">
                    <div className="text-center">
                      <p className="body font-medium text-foreground">Chart coming soon</p>
                      <p className="body mt-0.5">Interactive performance charts will appear here</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bento-card relative overflow-hidden px-8 py-16 text-center"
        >
          <div className="pointer-events-none absolute -inset-20 opacity-30" style={{ background: 'radial-gradient(circle at 50% 0%, var(--gold-glow-strong), transparent 60%)' }} />
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--gold-glow)' }}>
            <Wallet className="h-7 w-7" style={{ color: 'var(--gold)' }} />
          </div>
          <p className="heading-sm">No portfolio yet</p>
          <p className="body mt-2 max-w-sm mx-auto">Add your first holding to see live valuation, P&amp;L, and allocation analytics.</p>
          <motion.button
            onClick={() => setAdding(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn btn--gold mt-6"
          >
            <Plus className="h-3.5 w-3.5" />Add Holding
          </motion.button>
        </motion.div>
      )}

      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => !busy && setAdding(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.25 }}
            className="glass-card w-full max-w-md rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="heading">Add Holding</h3>
              <button onClick={() => !busy && setAdding(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-foreground/10"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="meta mb-1.5 block">Symbol</label>
                  <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="AAPL" className="glass-input w-full" />
                </div>
                <div>
                  <label className="meta mb-1.5 block">Quantity</label>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="10" className="glass-input w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="meta mb-1.5 block">Avg Price</label>
                  <input type="number" value={avgPrice} onChange={(e) => setAvgPrice(e.target.value)} placeholder="150.00" className="glass-input w-full" />
                </div>
                <div>
                  <label className="meta mb-1.5 block">Name (opt)</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Apple Inc." className="glass-input w-full" />
                </div>
              </div>
              {error && <p className="text-xs text-neg">{error}</p>}
              <button onClick={handleAdd} disabled={busy} className="lm-btn lm-btn--gold flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs disabled:opacity-60">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Add Holding
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
