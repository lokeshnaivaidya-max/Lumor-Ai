"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, useSpring, useMotionValue } from "motion/react"
import Link from "next/link"
import {
  Plus, Brain, Wallet, TrendingUp, ShieldCheck, BarChart3,
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

const PIE_COLORS = [
  "oklch(0.65 0.2 255)",
  "oklch(0.6 0.18 275)",
  "oklch(0.72 0.16 168)",
  "oklch(0.85 0.1 85)",
  "oklch(0.68 0.17 250)",
  "oklch(0.62 0.19 320)",
]

const TAB_ITEMS = ["holdings", "allocation", "performance"] as const
type Tab = (typeof TAB_ITEMS)[number]

function GlowCard({ children, className, glowColor = "oklch(0.55 0.18 255 / 0.15)" }: {
  children: React.ReactNode; className?: string; glowColor?: string
}) {
  return (
    <motion.div whileHover={{ y: -3, scale: 1.006 }} transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.6 }} className="group relative transform-gpu">
      <div className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 blur-xl transition-all duration-500 group-hover:opacity-100" style={{ boxShadow: `0 0 48px 8px ${glowColor}` }} />
      <div className="relative glass-card overflow-hidden rounded-3xl">{children}</div>
    </motion.div>
  )
}

function StatCard({ label, value, icon: Icon, trend, delay, glow }: {
  label: string; value: string; icon: React.ElementType; trend?: { value: string; positive: boolean }; delay: number; glow: string
}) {
  return (
    <GlowCard glowColor={glow}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }} className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">{label}</p>
            <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
            {trend && (
              <p className={`flex items-center gap-1.5 text-xs font-medium ${trend.positive ? "text-emerald" : "text-neg"}`}>
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-current/10">
                  {trend.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                </span>
                {trend.value}
              </p>
            )}
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${label === "Total P&L" ? "bg-emerald/10 text-emerald" : label === "Health Score" ? "bg-violet/10 text-violet" : "bg-blue/10 text-blue"}`}>
            <Icon className={`h-5 w-5 ${label === "Total P&L" ? "text-emerald" : label === "Health Score" ? "text-violet" : "text-blue"}`} />
          </div>
        </div>
      </motion.div>
    </GlowCard>
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
  const totalCost = summary.investment
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
    } catch (e: any) { setError(e?.message || "Failed to add holding") } finally { setBusy(false) }
  }

  async function handleRemove(id: number) {
    setBusy(true)
    try { await removeHolding(id) } catch { /* ignore */ } finally { setBusy(false) }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue/10"><BarChart3 className="h-5 w-5 text-blue" /></div>
            <div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight">Portfolio</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">Manage your holdings and track performance</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex items-center gap-2">
          <Link href="/chat" className="premium-btn premium-btn-ghost flex items-center gap-1.5 px-4 py-2.5 text-xs"><Brain className="h-3.5 w-3.5" />AI Review</Link>
          <button onClick={() => { setError(null); setAdding(true) }} className="premium-btn premium-btn-primary flex items-center gap-1.5 px-4 py-2.5 text-xs"><Plus className="h-3.5 w-3.5" />Add Holding</button>
        </motion.div>
      </div>

      {error && <p className="mb-4 rounded-xl bg-neg/10 px-4 py-2.5 text-xs text-neg">{error}</p>}

      {hasData ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Total Value" value={fmt(totalValue)} icon={Wallet} trend={{ value: "Live valuation", positive: true }} delay={0.05} glow="oklch(0.55 0.18 255 / 0.2)" />
            <StatCard label="Total P&L" value={`${totalPnL >= 0 ? "+" : ""}${fmt(totalPnL)}`} icon={TrendingUp} trend={{ value: `${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(2)}%`, positive: totalPnL >= 0 }} delay={0.1} glow="oklch(0.62 0.16 168 / 0.2)" />
            <StatCard label="Health Score" value={String(healthScore)} icon={ShieldCheck} trend={{ value: healthScore >= 70 ? "Well diversified" : "Concentrated", positive: healthScore >= 70 }} delay={0.15} glow="oklch(0.48 0.16 280 / 0.2)" />
          </div>

          <div className="mb-6 flex items-center justify-between">
            <TabBar active={view} onChange={setView} />
          </div>

          {view === "holdings" && (
            <motion.div key="holdings" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <GlowCard glowColor="oklch(0.55 0.18 255 / 0.1)">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/20">
                        <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">Symbol</th>
                        <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">Name</th>
                        <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">Shares</th>
                        <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">Avg Price</th>
                        <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">Current</th>
                        <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">P&amp;L</th>
                        <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">Allocation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map((h, idx) => {
                        const pnl = h.marketValue - h.costBasis
                        const pnlPct = h.costBasis > 0 ? ((h.price - h.avgPrice) / h.avgPrice) * 100 : 0
                        const alloc = allocations[idx]?.pct ?? 0
                        return (
                          <motion.tr key={h.symbol} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05, duration: 0.5 }}
                            className={`group transition-colors ${idx % 2 === 1 ? "bg-black/[0.015] dark:bg-white/[0.015]" : ""} hover:bg-black/[0.03] dark:hover:bg-white/[0.03]`}>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${["from-blue/20 to-blue/10", "from-emerald/20 to-emerald/10", "from-violet/20 to-violet/10", "from-gold/20 to-gold/10", "from-cyan/20 to-cyan/10", "from-pink/20 to-pink/10"][idx % 6]} flex items-center justify-center`}>
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
                                <div className="h-1.5 w-12 overflow-hidden rounded-full bg-border/40">
                                  <div className="h-full rounded-full" style={{ width: `${alloc}%`, background: PIE_COLORS[idx % PIE_COLORS.length] }} />
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
              </GlowCard>
            </motion.div>
          )}

          {view === "allocation" && (
            <motion.div key="allocation" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid gap-6 lg:grid-cols-2">
              <GlowCard glowColor="oklch(0.48 0.16 280 / 0.15)">
                <div className="p-6">
                  <h3 className="mb-5 font-heading text-sm font-medium">Allocation by Holding</h3>
                  <div className="space-y-5">
                    {allocations.map((a, i) => (
                      <motion.div key={a.symbol} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2.5">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="font-medium">{a.symbol}</span>
                          </div>
                          <span className="font-mono text-sm font-semibold tabular-nums text-muted-foreground">{a.pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-border/30">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${a.pct}%` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.1 }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${PIE_COLORS[i % PIE_COLORS.length]}, ${PIE_COLORS[i % PIE_COLORS.length]}cc)` }} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </GlowCard>

              <GlowCard glowColor="oklch(0.62 0.16 168 / 0.15)">
                <div className="p-6">
                  <h3 className="mb-5 font-heading text-sm font-medium">Holdings Allocation</h3>
                  <div className="flex flex-col items-center">
                    <div className="relative flex h-52 w-52 items-center justify-center">
                      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                        {allocations.map((a, i) => {
                          const offset = allocations.slice(0, i).reduce((s, x) => s + x.pct, 0)
                          const circumference = 2 * Math.PI * 38
                          const dash = (a.pct / 100) * circumference
                          return (
                            <motion.circle key={a.symbol} cx="50" cy="50" r="38" fill="none" stroke={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth="8" strokeLinecap="round"
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
                        <motion.div key={h.symbol} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3.5 py-2.5 dark:bg-white/[0.03]">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-xs font-medium">{h.symbol}</span>
                          </div>
                          <span className="font-mono text-xs tabular-nums text-muted-foreground">{allocations[i]?.pct.toFixed(1)}%</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          )}

          {view === "performance" && (
            <motion.div key="performance" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <GlowCard glowColor="oklch(0.55 0.18 255 / 0.12)">
                <div className="p-8">
                  <h3 className="font-heading text-base font-medium">Performance Analytics</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">Portfolio performance over time</p>
                  <div className="mt-6 flex h-64 items-center justify-center rounded-2xl border border-dashed border-border/40 bg-white/[0.015]">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue/10"><BarChart3 className="h-7 w-7 text-blue" /></div>
                      <p className="text-sm font-medium text-foreground">Chart coming soon</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Interactive performance charts will appear here</p>
                    </div>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/50 px-6 py-20 text-center">
          <div className="mb-4 rounded-2xl bg-white/[0.03] p-5 ring-1 ring-border/30"><Wallet className="h-8 w-8 text-muted-foreground/40" /></div>
          <p className="font-heading text-lg font-medium">No portfolio yet.</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">Add your first holding to see live valuation, P&amp;L, and allocation analytics.</p>
          <button onClick={() => setAdding(true)} className="premium-btn premium-btn-primary mt-5 px-5 py-2.5 text-xs"><Plus className="h-3.5 w-3.5" />Add Holding</button>
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => !busy && setAdding(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.25 }}
            className="glass-card edge-light w-full max-w-md rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-heading text-lg font-medium">Add Holding</h3>
              <button onClick={() => !busy && setAdding(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Symbol</label>
                  <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="AAPL" className="premium-input w-full" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Quantity</label>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="10" className="premium-input w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Avg Price</label>
                  <input type="number" value={avgPrice} onChange={(e) => setAvgPrice(e.target.value)} placeholder="150.00" className="premium-input w-full" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Name (opt)</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Apple Inc." className="premium-input w-full" />
                </div>
              </div>
              {error && <p className="text-xs text-neg">{error}</p>}
              <button onClick={handleAdd} disabled={busy} className="premium-btn premium-btn-primary flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs disabled:opacity-60">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Add Holding
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
