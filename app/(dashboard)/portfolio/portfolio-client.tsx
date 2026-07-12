"use client"

import { useState, useRef } from "react"
import { motion } from "motion/react"
import {
  Plus, Brain, Wallet, TrendingUp, ShieldCheck, BarChart3,
  ChevronRight, ArrowUpRight, ArrowDownRight,
} from "lucide-react"
import { CountUp } from "@/components/count-up"

const MOCK_HOLDINGS = [
  { symbol: "NVDA", name: "NVIDIA Corp.", shares: 25, avgPrice: 824.30, currentPrice: 892.50, sector: "Technology", allocation: 35 },
  { symbol: "AAPL", name: "Apple Inc.", shares: 40, avgPrice: 172.10, currentPrice: 178.20, sector: "Technology", allocation: 20 },
  { symbol: "MSFT", name: "Microsoft Corp.", shares: 15, avgPrice: 398.40, currentPrice: 425.30, sector: "Technology", allocation: 15 },
  { symbol: "TSLA", name: "Tesla Inc.", shares: 30, avgPrice: 218.50, currentPrice: 238.40, sector: "Automotive", allocation: 18 },
  { symbol: "AMZN", name: "Amazon.com Inc.", shares: 8, avgPrice: 185.20, currentPrice: 192.60, sector: "Consumer Cyclical", allocation: 12 },
]
const SECTOR_DATA = [
  { name: "Technology", allocation: 70, color: "oklch(0.65 0.2 255)" },
  { name: "Automotive", allocation: 18, color: "oklch(0.6 0.18 275)" },
  { name: "Consumer Cyclical", allocation: 12, color: "oklch(0.72 0.16 168)" },
]

const TAB_ITEMS = ["holdings", "allocation", "performance"] as const

const PIE_COLORS = [
  "oklch(0.65 0.2 255)",
  "oklch(0.6 0.18 275)",
  "oklch(0.72 0.16 168)",
  "oklch(0.85 0.1 85)",
  "oklch(0.68 0.17 250)",
]

function GlowCard({ children, className, glowColor = "oklch(0.55 0.18 255 / 0.15)" }: {
  children: React.ReactNode; className?: string; glowColor?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.006 }}
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

function StatCard({ label, value, icon: Icon, trend, delay }: {
  label: string; value: string; icon: React.ElementType; trend?: { value: string; positive: boolean }; delay: number
}) {
  return (
    <GlowCard glowColor={
      label === "Total Value" ? "oklch(0.55 0.18 255 / 0.2)" :
      label === "Total P&L" ? "oklch(0.62 0.16 168 / 0.2)" :
      "oklch(0.48 0.16 280 / 0.2)"
    }>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
        className="p-6"
      >
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
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            label === "Total P&L" ? "bg-emerald/10" : label === "Health Score" ? "bg-violet/10" : "bg-blue/10"
          }`}>
            <Icon className={`h-5 w-5 ${
              label === "Total P&L" ? "text-emerald" : label === "Health Score" ? "text-violet" : "text-blue"
            }`} />
          </div>
        </div>
      </motion.div>
    </GlowCard>
  )
}

function TabBar({ active, onChange }: {
  active: string; onChange: (v: "holdings" | "allocation" | "performance") => void
}) {
  return (
    <div className="glass-card relative inline-flex gap-1 rounded-2xl p-1.5">
      {TAB_ITEMS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`relative z-10 rounded-xl px-5 py-2 text-sm capitalize transition-colors ${
            active === tab ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab}
          {active === tab && (
            <motion.div
              layoutId="portfolio-tab-pill"
              className="absolute inset-0 -z-10 rounded-xl bg-foreground/10 shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  )
}

export function PortfolioClient() {
  const [view, setView] = useState<"holdings" | "allocation" | "performance">("holdings")
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n)
  const totalValue = MOCK_HOLDINGS.reduce((a, h) => a + h.shares * h.currentPrice, 0)
  const totalCost = MOCK_HOLDINGS.reduce((a, h) => a + h.shares * h.avgPrice, 0)
  const totalPnL = totalValue - totalCost
  const pnlPercent = (totalPnL / totalCost) * 100

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue/10">
              <BarChart3 className="h-5 w-5 text-blue" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight">Portfolio</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">Manage your holdings and track performance</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="premium-btn premium-btn-ghost flex items-center gap-1.5 px-4 py-2.5 text-xs"
          >
            <Brain className="h-3.5 w-3.5" />
            AI Review
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="premium-btn premium-btn-primary flex items-center gap-1.5 px-4 py-2.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Holding
          </motion.button>
        </motion.div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Value" value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={Wallet} trend={{ value: "+2.4% vs last month", positive: true }} delay={0.05} />
        <StatCard label="Total P&L" value={`${totalPnL >= 0 ? "+" : ""}$${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={TrendingUp} trend={{ value: `${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(2)}%`, positive: totalPnL >= 0 }} delay={0.1} />
        <StatCard label="Health Score" value="82" icon={ShieldCheck} trend={{ value: "Strong diversification", positive: true }} delay={0.15} />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <TabBar active={view} onChange={setView} />
        <div className="hidden items-center gap-2 sm:flex">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="premium-btn premium-btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs"
          >
            <Brain className="h-3.5 w-3.5" />AI Review
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="premium-btn premium-btn-primary flex items-center gap-1.5 px-3 py-2 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />Add Holding
          </motion.button>
        </div>
      </div>

      {view === "holdings" && (
        <motion.div
          key="holdings"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
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
                    <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_HOLDINGS.map((h, idx) => {
                    const pnl = (h.currentPrice - h.avgPrice) * h.shares
                    const pnlPct = ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100
                    return (
                      <motion.tr
                        key={h.symbol}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className={`group cursor-pointer transition-colors ${
                          idx % 2 === 1 ? "bg-black/[0.015] dark:bg-white/[0.015]" : ""
                        } hover:bg-black/[0.03] dark:hover:bg-white/[0.03]`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${
                              ["from-blue/20 to-blue/10", "from-emerald/20 to-emerald/10", "from-violet/20 to-violet/10", "from-gold/20 to-gold/10", "from-cyan/20 to-cyan/10"][idx % 5]
                            } flex items-center justify-center`}>
                              <span className="text-xs font-bold text-foreground">{h.symbol.slice(0, 2)}</span>
                            </div>
                            <span className="font-semibold">{h.symbol}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{h.name}</td>
                        <td className="px-5 py-4 text-right font-mono text-sm tabular-nums">{h.shares}</td>
                        <td className="px-5 py-4 text-right font-mono text-sm tabular-nums">{fmt(h.avgPrice)}</td>
                        <td className="px-5 py-4 text-right font-mono text-sm font-semibold tabular-nums">{fmt(h.currentPrice)}</td>
                        <td className={`px-5 py-4 text-right font-mono text-sm font-semibold tabular-nums ${pnl >= 0 ? "text-emerald" : "text-neg"}`}>
                          {pnl >= 0 ? "+" : ""}{fmt(pnl)}
                          <span className="ml-1.5 text-xs font-sans font-normal opacity-75">({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-border/40">
                              <div className="h-full rounded-full" style={{ width: `${h.allocation}%`, background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{h.allocation}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1 rounded-xl border border-border/60 px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                          >
                            Trade <ChevronRight className="h-3 w-3" />
                          </motion.button>
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
        <motion.div
          key="allocation"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="grid gap-6 lg:grid-cols-2"
        >
          <GlowCard glowColor="oklch(0.48 0.16 280 / 0.15)">
            <div className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-heading text-sm font-medium">Sector Distribution</h3>
                <span className="rounded-full bg-violet/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet">Overview</span>
              </div>
              <div className="space-y-5">
                {SECTOR_DATA.map((s, i) => (
                  <motion.div key={s.name}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                        <span className="font-medium">{s.name}</span>
                      </div>
                      <span className="font-mono text-sm font-semibold tabular-nums text-muted-foreground">{s.allocation}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-border/30">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.allocation}%` }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${s.color}, ${s.color}cc)` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="oklch(0.62 0.16 168 / 0.15)">
            <div className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-heading text-sm font-medium">Holdings Allocation</h3>
                <span className="rounded-full bg-emerald/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald">Diversified</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative flex h-52 w-52 items-center justify-center">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    {MOCK_HOLDINGS.map((h, i) => {
                      const offset = MOCK_HOLDINGS.slice(0, i).reduce((a, b) => a + b.allocation, 0)
                      const circumference = 2 * Math.PI * 38
                      const dash = (h.allocation / 100) * circumference
                      return (
                        <motion.circle
                          key={h.symbol}
                          cx="50" cy="50" r="38" fill="none"
                          stroke={PIE_COLORS[i % PIE_COLORS.length]}
                          strokeWidth="8" strokeLinecap="round"
                          strokeDasharray={`${dash} ${circumference - dash}`}
                          strokeDashoffset={-((offset / 100) * circumference)}
                          initial={{ strokeDasharray: `0 ${circumference}` }}
                          animate={{ strokeDasharray: `${dash} ${circumference - dash}` }}
                          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.1 }}
                        />
                      )
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-heading text-lg font-bold">100%</span>
                    <span className="text-[10px] text-muted-foreground">Allocated</span>
                  </div>
                </div>
                <div className="mt-6 grid w-full grid-cols-2 gap-2">
                  {MOCK_HOLDINGS.map((h, i) => (
                    <motion.div key={h.symbol}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                      className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3.5 py-2.5 dark:bg-white/[0.03]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-xs font-medium">{h.symbol}</span>
                      </div>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">{h.allocation}%</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </GlowCard>
        </motion.div>
      )}

      {view === "performance" && (
        <motion.div
          key="performance"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <GlowCard glowColor="oklch(0.55 0.18 255 / 0.12)">
            <div className="p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-base font-medium">Performance Analytics</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">Portfolio performance over time</p>
                </div>
                <div className="glass-card flex items-center gap-1 rounded-2xl p-1">
                  {["1M", "3M", "1Y", "ALL"].map((p) => (
                    <button key={p}
                      className={`rounded-xl px-4 py-1.5 text-xs font-medium transition-colors ${
                        p === "1M" ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border/40 bg-white/[0.015]">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue/10">
                    <BarChart3 className="h-7 w-7 text-blue" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Chart coming soon</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Interactive performance charts will appear here</p>
                </div>
              </div>
            </div>
          </GlowCard>
        </motion.div>
      )}
    </div>
  )
}
