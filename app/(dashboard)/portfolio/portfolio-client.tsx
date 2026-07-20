"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useSpring, useMotionValue } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus, Wallet, TrendingUp, ShieldCheck, BarChart3,
  ChevronRight, ArrowUpRight, ArrowDownRight, X, Loader2, Trash2,
} from "lucide-react"
import { Counter, FadeScale } from "@/components/reveal"
import { addHolding, removeHolding } from "@/app/actions/portfolio"

type Holding = {
  symbol: string; name: string | null; quantity: number; avgPrice: number
  price: number; change: number; changePercent: number; marketValue: number; costBasis: number
}
type Summary = {
  investment: number; value: number; todayPnL: number; totalReturns: number
  returnsPercent: number; holdingsCount: number
}
const TAB_ITEMS = ["holdings", "allocation", "performance"] as const
type Tab = (typeof TAB_ITEMS)[number]

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function TabBar({ active, onChange }: { active: Tab; onChange: (v: Tab) => void }) {
  return (
    <div className="glass-card inline-flex gap-1 rounded-2xl p-1.5">
      {TAB_ITEMS.map((tab) => (
        <button key={tab} onClick={() => onChange(tab)}
          className={`relative z-10 rounded-xl px-5 py-2 text-sm capitalize transition-colors ${active === tab ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"}`}>
          {tab}
          {active === tab && <motion.div layoutId="portfolio-tab-pill" className="absolute inset-0 -z-10 rounded-xl bg-[var(--panel-2)] shadow-sm" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
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

  const totalValue = summary.value
  const totalPnL = summary.totalReturns
  const pnlPercent = summary.returnsPercent
  const hasData = holdings.length > 0
  const allocations = hasData
    ? holdings.map((h) => ({ symbol: h.symbol, pct: totalValue > 0 ? (h.marketValue / totalValue) * 100 : 0 }))
    : []
  const maxAlloc = allocations.reduce((m, a) => Math.max(m, a.pct), 0)
  const healthScore = !hasData ? 0 : Math.max(0, Math.min(100, Math.round(100 - maxAlloc * 0.4 - (holdings.length < 3 ? 12 : 0))))

  async function handleAdd() {
    setError(null)
    const q = Number(quantity); const p = Number(avgPrice)
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
    try { await removeHolding(id); router.refresh() } catch { } finally { setBusy(false) }
  }

  return (
    <div className="p-6 lg:p-8">
      <hr className="divider divider--gold" />

      {/* FEATURED HEADER */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="glass relative mb-8 flex flex-col gap-6 overflow-hidden rounded-3xl p-8 sm:flex-row sm:items-end sm:justify-between lg:p-10">
        <div className="pointer-events-none absolute -inset-24 opacity-40" style={{ background: 'radial-gradient(circle at 0% 0%, var(--gold-glow-strong), transparent 55%)' }} />
        <div className="glow-page relative">
          <p className="subheading"><span className="dot-gold" /> Portfolio</p>
          <h1 className="heading mt-2 text-[var(--text-primary)]">Your Holdings</h1>
          <p className="body mt-3 max-w-md">Live valuation, profit &amp; loss, and allocation — all in one view.</p>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="relative flex items-center gap-2">
          <Link href="/chat" className="lm-btn lm-btn-soft flex items-center gap-1.5 px-4 py-2.5 text-xs"><BarChart3 className="h-3.5 w-3.5" />AI Review</Link>
          <button onClick={() => { setError(null); setAdding(true) }} className="lm-btn lm-btn-gold flex items-center gap-1.5 px-4 py-2.5 text-xs"><Plus className="h-3.5 w-3.5" />Add Holding</button>
        </motion.div>
      </motion.div>

      {error && <p className="mb-4 rounded-xl border border-[var(--neg-glow)] bg-[var(--neg-glow)] px-4 py-2.5 text-xs text-[var(--neg)]">{error}</p>}

      {hasData ? (
        <>
          {/* KPI STRIP */}
          <div className="mb-8 grid gap-6 sm:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="surface-card p-6 lg:p-8">
              <p className="subheading">Total Value</p>
              <p className="stat-number mt-3 text-[var(--text-primary)]"><Counter value={totalValue} prefix="$" decimals={2} className="stat-number" /></p>
              <p className="mt-2 font-mono text-xs text-[var(--text-tertiary)]">Live valuation</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }} className="surface-card p-6 lg:p-8">
              <p className="subheading">Total P&amp;L</p>
              <p className={`stat-number mt-3 ${totalPnL >= 0 ? "text-[var(--pos)]" : "text-[var(--neg)]"}`}><Counter value={totalPnL} prefix={totalPnL >= 0 ? "+$" : "-$"} decimals={2} className="stat-number" /></p>
              <p className={`mt-2 flex items-center gap-1 font-mono text-xs ${pnlPercent >= 0 ? "text-[var(--pos)]" : "text-[var(--neg)]"}`}>{pnlPercent >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }} className="surface-card p-6 lg:p-8">
              <p className="subheading">Health Score</p>
              <p className="stat-number mt-3 text-[var(--gold)]"><Counter value={healthScore} className="stat-number" suffix="/100" /></p>
              <p className="mt-2 font-mono text-xs text-[var(--text-tertiary)]">{healthScore >= 70 ? "Well diversified" : "Concentrated"}</p>
            </motion.div>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <TabBar active={view} onChange={setView} />
          </div>

          {view === "holdings" && (
            <motion.div key="holdings" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="glass-card overflow-hidden rounded-3xl">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10 backdrop-blur-xl" style={{ background: "var(--surface-alt)" }}>
                      <tr className="border-b" style={{ borderColor: "var(--line)" }}>
                        <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>Symbol</th>
                        <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>Name</th>
                        <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>Shares</th>
                        <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>Avg Price</th>
                        <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>Current</th>
                        <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>P&amp;L</th>
                        <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-tertiary)" }}>Allocation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map((h, idx) => {
                        const pnl = h.marketValue - h.costBasis
                        const pnlPct = h.costBasis > 0 ? ((h.price - h.avgPrice) / h.avgPrice) * 100 : 0
                        const alloc = allocations[idx]?.pct ?? 0
                        return (
                          <motion.tr initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05, duration: 0.5 }} className="group transition-colors duration-200 hover:bg-[var(--panel-2)]/60" style={{ borderColor: "var(--line)" }}>
                            <td className="px-6 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--gold-glow)]"><span className="text-xs font-bold text-[var(--gold)]">{h.symbol.slice(0, 2)}</span></div>
                                <span className="font-semibold text-[var(--text-primary)]">{h.symbol}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-[var(--text-secondary)]" style={{ borderBottom: "1px solid var(--line)" }}>{h.name ?? "—"}</td>
                            <td className="px-6 py-4 text-right font-mono text-sm tabular-nums text-[var(--text-primary)]" style={{ borderBottom: "1px solid var(--line)" }}>{h.quantity}</td>
                            <td className="px-6 py-4 text-right font-mono text-sm tabular-nums text-[var(--text-primary)]" style={{ borderBottom: "1px solid var(--line)" }}>{fmt(h.avgPrice)}</td>
                            <td className="px-6 py-4 text-right font-mono text-sm font-semibold tabular-nums text-[var(--text-primary)]" style={{ borderBottom: "1px solid var(--line)" }}>{fmt(h.price)}</td>
                            <td className={`px-6 py-4 text-right font-mono text-sm font-semibold tabular-nums ${pnl >= 0 ? "text-[var(--pos)]" : "text-[var(--neg)]"}`} style={{ borderBottom: "1px solid var(--line)" }}>
                              {pnl >= 0 ? "+" : ""}{fmt(pnl)}
                              <span className="ml-1.5 text-xs font-sans font-normal opacity-75">({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)</span>
                            </td>
                            <td className="px-6 py-4 text-right" style={{ borderBottom: "1px solid var(--line)" }}>
                              <div className="flex items-center justify-end gap-2">
                                <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[var(--panel-2)]">
                                  <motion.div className="h-full rounded-full bg-[var(--gold)]" initial={{ width: 0 }} animate={{ width: `${alloc}%` }} transition={{ duration: 0.8, delay: idx * 0.05 }} />
                                </div>
                                <span className="text-xs text-[var(--text-tertiary)]">{alloc.toFixed(1)}%</span>
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
              <div className="surface-card p-6 lg:p-8">
                <h3 className="heading mb-6">Allocation by Holding</h3>
                <div className="space-y-5">
                  {allocations.map((a, i) => (
                    <motion.div key={a.symbol} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
                          <span className="font-medium text-[var(--text-primary)]">{a.symbol}</span>
                        </div>
                        <span className="font-mono text-sm font-semibold tabular-nums text-[var(--text-secondary)]">{a.pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--panel-2)]">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${a.pct}%` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.1 }} className="h-full rounded-full bg-[var(--gold)]" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="surface-card p-6 lg:p-8">
                <h3 className="heading mb-6">Holdings Allocation</h3>
                <div className="flex flex-col items-center">
                  <div className="relative flex h-52 w-52 items-center justify-center">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                      {allocations.map((a, i) => {
                        const offset = allocations.slice(0, i).reduce((s, x) => s + x.pct, 0)
                        const circumference = 2 * Math.PI * 38
                        const dash = (a.pct / 100) * circumference
                        return (
                          <motion.circle key={a.symbol} cx="50" cy="50" r="38" fill="none" stroke="var(--gold)" strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-((offset / 100) * circumference)}
                            initial={{ strokeDasharray: `0 ${circumference}` }} animate={{ strokeDasharray: `${dash} ${circumference - dash}` }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.1 }} />
                        )
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-serif text-lg font-bold text-[var(--text-primary)]">{holdings.length}</span>
                      <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">Holdings</span>
                    </div>
                  </div>
                  <div className="mt-6 grid w-full grid-cols-2 gap-2">
                    {holdings.map((h, i) => (
                      <motion.div key={h.symbol} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }} className="flex items-center justify-between rounded-xl bg-[var(--panel)] px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
                          <span className="text-xs font-medium text-[var(--text-primary)]">{h.symbol}</span>
                        </div>
                        <span className="font-mono text-xs tabular-nums text-[var(--text-tertiary)]">{allocations[i]?.pct.toFixed(1)}%</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === "performance" && (
            <motion.div key="performance" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="bento-card p-8">
                <h3 className="heading mb-1">Performance Analytics</h3>
                <p className="body mt-0.5">Portfolio performance over time</p>
                <div className="mt-6 flex h-64 items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--panel)]">
                  <div className="text-center">
                    <p className="font-medium text-[var(--text-primary)]">Chart coming soon</p>
                    <p className="body mt-0.5">Interactive performance charts will appear here</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="bento-card relative overflow-hidden px-8 py-14 text-center">
          <div className="pointer-events-none absolute -inset-20 opacity-40" style={{ background: 'radial-gradient(circle at 50% 0%, var(--gold-glow-strong), transparent 60%)' }} />
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--gold-glow)]"><Wallet className="h-7 w-7 text-[var(--gold)]" /></div>
          <p className="heading-sm">No portfolio yet</p>
          <p className="body mt-2 mx-auto max-w-sm">Add your first holding to see live valuation, P&amp;L, and allocation analytics.</p>
          <motion.button onClick={() => setAdding(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="lm-btn lm-btn-gold mt-6"><Plus className="h-3.5 w-3.5" />Add Holding</motion.button>

          <div className="relative mt-10 border-t border-[var(--line)] pt-8">
            <div className="mb-4 flex items-center justify-center gap-2">
              <span className="chip chip-gold text-[10px] uppercase tracking-wide">Sample preview</span>
            </div>
            <p className="meta mb-5">Here's how your allocation might look once you add holdings:</p>
            <div className="mx-auto grid max-w-lg gap-3 sm:grid-cols-3">
              {[
                { s: "AAPL", pct: 38, c: "var(--gold)" },
                { s: "MSFT", pct: 33, c: "var(--gold)" },
                { s: "NVDA", pct: 29, c: "var(--gold)" },
              ].map((h, i) => (
                <FadeScale key={h.s} delay={0.1 + i * 0.08}>
                  <div className="glass-card p-4 text-left">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: h.c }} />{h.s}
                      </span>
                      <span className="font-mono text-xs tabular-nums text-[var(--text-tertiary)]">{h.pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--panel-2)]">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${h.pct}%` }} transition={{ duration: 1, delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full" style={{ background: h.c }} />
                    </div>
                  </div>
                </FadeScale>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => !busy && setAdding(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.25 }} className="glass-card w-full max-w-md rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="heading">Add Holding</h3>
              <button onClick={() => !busy && setAdding(false)} className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--panel-2)]"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="meta mb-1.5 block">Symbol</label>
                  <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="AAPL" className="field__input w-full" />
                </div>
                <div>
                  <label className="meta mb-1.5 block">Quantity</label>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="10" className="field__input w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="meta mb-1.5 block">Avg Price</label>
                  <input type="number" value={avgPrice} onChange={(e) => setAvgPrice(e.target.value)} placeholder="150.00" className="field__input w-full" />
                </div>
                <div>
                  <label className="meta mb-1.5 block">Name (opt)</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Apple Inc." className="field__input w-full" />
                </div>
              </div>
              {error && <p className="text-xs text-[var(--neg)]">{error}</p>}
              <button onClick={handleAdd} disabled={busy} className="lm-btn lm-btn-gold flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs disabled:opacity-60">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Add Holding
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
