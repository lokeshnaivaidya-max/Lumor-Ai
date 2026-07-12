"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Plus, Brain } from "lucide-react"

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

export function PortfolioClient() {
  const [view, setView] = useState<"holdings" | "allocation" | "performance">("holdings")
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n)
  const totalValue = MOCK_HOLDINGS.reduce((a, h) => a + h.shares * h.currentPrice, 0)
  const totalCost = MOCK_HOLDINGS.reduce((a, h) => a + h.shares * h.avgPrice, 0)
  const totalPnL = totalValue - totalCost
  const pnlPercent = (totalPnL / totalCost) * 100

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Portfolio</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your holdings, track performance.</p>
      </motion.div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Value</p>
          <p className="mt-1.5 font-heading text-2xl font-semibold tracking-tight text-emerald tabular-nums">{fmt(totalValue)}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total P&L</p>
          <p className={`mt-1.5 font-heading text-2xl font-semibold tracking-tight tabular-nums ${totalPnL >= 0 ? "text-emerald" : "text-neg"}`}>
            {totalPnL >= 0 ? "+" : ""}{fmt(totalPnL)}
            <span className="ml-1 text-sm font-sans">({pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%)</span>
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Health Score</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-emerald to-emerald/60" />
            </div>
            <span className="font-heading text-lg font-semibold text-emerald">82</span>
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        {(["holdings", "allocation", "performance"] as const).map((tab) => (
          <button key={tab} onClick={() => setView(tab)}
            className={`rounded-full px-4 py-2 text-sm capitalize transition-colors ${view === tab ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button className="glass-card flex items-center gap-1.5 rounded-full px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <Brain className="h-3.5 w-3.5" />AI Review
          </button>
          <button className="premium-btn premium-btn-primary px-3 py-2 text-xs">
            <Plus className="h-3.5 w-3.5" />Add Holding
          </button>
        </div>
      </div>

      {view === "holdings" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-4 text-left">Symbol</th>
                  <th className="px-5 py-4 text-left">Name</th>
                  <th className="px-5 py-4 text-right">Shares</th>
                  <th className="px-5 py-4 text-right">Avg Price</th>
                  <th className="px-5 py-4 text-right">Current</th>
                  <th className="px-5 py-4 text-right">P&L</th>
                  <th className="px-5 py-4 text-right">Allocation</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {MOCK_HOLDINGS.map((h) => {
                  const pnl = (h.currentPrice - h.avgPrice) * h.shares
                  const pnlPct = ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100
                  return (
                    <tr key={h.symbol} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-5 py-4"><span className="font-medium">{h.symbol}</span></td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{h.name}</td>
                      <td className="px-5 py-4 text-right text-sm tabular-nums">{h.shares}</td>
                      <td className="px-5 py-4 text-right text-sm tabular-nums">{fmt(h.avgPrice)}</td>
                      <td className="px-5 py-4 text-right text-sm font-medium tabular-nums">{fmt(h.currentPrice)}</td>
                      <td className={`px-5 py-4 text-right text-sm font-medium tabular-nums ${pnl >= 0 ? "text-emerald" : "text-neg"}`}>
                        {pnl >= 0 ? "+" : ""}{fmt(pnl)} ({(pnlPct >= 0 ? "+" : "")}{pnlPct.toFixed(1)}%)
                      </td>
                      <td className="px-5 py-4 text-right text-sm tabular-nums">{h.allocation}%</td>
                      <td className="px-5 py-4 text-right">
                        <button className="glass-card rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground">Edit</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {view === "allocation" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-heading mb-4 text-sm font-medium">Sector Distribution</h3>
            <div className="space-y-4">
              {SECTOR_DATA.map((s) => (
                <div key={s.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span>{s.name}</span>
                    <span className="text-muted-foreground tabular-nums">{s.allocation}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${s.allocation}%` }}
                      className="h-full rounded-full" style={{ background: s.color }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-heading mb-4 text-sm font-medium">Holdings Allocation</h3>
            <div className="flex h-48 items-center justify-center">
              <div className="relative h-40 w-40">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  {MOCK_HOLDINGS.map((h, i) => {
                    const offset = MOCK_HOLDINGS.slice(0, i).reduce((a, b) => a + b.allocation, 0)
                    const circumference = 2 * Math.PI * 38
                    const dash = (h.allocation / 100) * circumference
                    const colors = ["oklch(0.65 0.2 255)", "oklch(0.6 0.18 275)", "oklch(0.72 0.16 168)", "oklch(0.85 0.1 85)", "oklch(0.68 0.17 250)"]
                    return <circle key={h.symbol} cx="50" cy="50" r="38" fill="none" stroke={colors[i % colors.length]} strokeWidth="8"
                      strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-((offset / 100) * circumference)}
                      className="transition-all duration-700"
                    />
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="font-heading text-lg font-semibold">100%</span></div>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {MOCK_HOLDINGS.map((h, i) => {
                const colors = ["oklch(0.65 0.2 255)", "oklch(0.6 0.18 275)", "oklch(0.72 0.16 168)", "oklch(0.85 0.1 85)", "oklch(0.68 0.17 250)"]
                return <div key={h.symbol} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[i] }} />{h.symbol}</div>
                  <span className="text-muted-foreground tabular-nums">{h.allocation}%</span>
                </div>
              })}
            </div>
          </div>
        </motion.div>
      )}

      {view === "performance" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-6">
          <h3 className="font-heading mb-4 text-sm font-medium">Performance Analytics</h3>
          <p className="text-sm text-muted-foreground">Portfolio performance chart and metrics coming soon.</p>
        </motion.div>
      )}
    </div>
  )
}
