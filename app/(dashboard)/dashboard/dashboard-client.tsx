"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { TrendingUp, TrendingDown, Wallet, BarChart3, Brain, Activity, ArrowUpRight, ArrowDownRight, Plus, Star, Bell, Sparkles, RefreshCw } from "lucide-react"

const MOCK_PORTFOLIO = { totalInvestment: 125000, currentValue: 142850, todayPnL: 2840, totalReturns: 17850, returnsPercent: 14.28 }
const MOCK_AI_INSIGHTS = [
  { text: "NVDA shows strong momentum with RSI at 62. Consider adding on dips.", type: "buy" as const, symbol: "NVDA" },
  { text: "Portfolio tech allocation at 68%. Consider rebalancing toward healthcare.", type: "alert" as const, symbol: null },
  { text: "TSLA breached resistance at $245. Bull flag forming on 4H.", type: "signal" as const, symbol: "TSLA" },
]
const MOCK_ACTIVITY = [
  { type: "buy", symbol: "NVDA", shares: 15, price: 892.50, time: "2h ago" },
  { type: "sell", symbol: "AAPL", shares: 10, price: 178.20, time: "1d ago" },
  { type: "alert", symbol: "TSLA", text: "Up 4.2% today", time: "3h ago" },
]
const MOCK_WATCHLIST = [
  { symbol: "AAPL", price: 178.20, change: 1.2, name: "Apple Inc." },
  { symbol: "NVDA", price: 892.50, change: 3.8, name: "NVIDIA Corp." },
  { symbol: "TSLA", price: 238.40, change: -0.6, name: "Tesla Inc." },
  { symbol: "MSFT", price: 425.30, change: 0.8, name: "Microsoft Corp." },
]

function StatCard({ icon: Icon, label, value, change, accent }: { icon: React.ElementType; label: string; value: string; change?: string; accent: "blue" | "emerald" | "purple" | "gold" }) {
  const accentStyles = {
    blue: "border-blue/20 from-blue/5 to-transparent",
    emerald: "border-emerald/20 from-emerald/5 to-transparent",
    purple: "border-violet/20 from-violet/5 to-transparent",
    gold: "border-gold/20 from-gold/5 to-transparent",
  }
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={`glass-card edge-light relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${accentStyles[accent]}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl font-semibold tracking-tight">{value}</p>
          {change && <p className="flex items-center gap-1 text-xs text-emerald"><TrendingUp className="h-3 w-3" />{change}</p>}
        </div>
        <div className={`rounded-xl bg-white/5 p-2.5 ${accent === "blue" ? "text-blue" : accent === "emerald" ? "text-emerald" : accent === "purple" ? "text-violet" : "text-gold"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  )
}

function InsightCard({ text, type, symbol }: { text: string; type: "buy" | "alert" | "signal"; symbol: string | null }) {
  const colors = { buy: "border-emerald/20 bg-emerald/[0.03]", alert: "border-gold/20 bg-gold/[0.03]", signal: "border-blue/20 bg-blue/[0.03]" }
  const icons = { buy: TrendingUp, alert: Bell, signal: Sparkles }
  const Icon = icons[type]
  return (
    <div className={`flex gap-3 rounded-xl border p-3.5 ${colors[type]}`}>
      <div className="mt-0.5 shrink-0"><Icon className="h-4 w-4 text-muted-foreground" /></div>
      <div>
        {symbol && <span className="text-xs font-semibold text-foreground">{symbol}</span>}
        <p className="text-sm text-muted-foreground mt-0.5">{text}</p>
      </div>
    </div>
  )
}

export function DashboardClient() {
  const [greeting] = useState(() => { const h = new Date().getHours(); if (h < 12) return "Good morning"; if (h < 17) return "Good afternoon"; return "Good evening" })
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{greeting} <span className="text-gradient">&#x1F31E;</span></h1>
          <p className="mt-1 text-sm text-muted-foreground">Here&apos;s your portfolio overview and market intelligence.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="glass-card flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button className="premium-btn premium-btn-primary px-4 py-2 text-xs">
            <Brain className="h-3.5 w-3.5" />
            AI Overview
          </button>
        </div>
      </motion.div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Portfolio Value" value={fmt(MOCK_PORTFOLIO.currentValue)} change={`+${fmt(MOCK_PORTFOLIO.totalReturns)} all time`} accent="emerald" />
        <StatCard icon={TrendingUp} label="Today's P&L" value={`+${fmt(MOCK_PORTFOLIO.todayPnL)}`} change="+2.01% today" accent="blue" />
        <StatCard icon={BarChart3} label="Total Investment" value={fmt(MOCK_PORTFOLIO.totalInvestment)} accent="purple" />
        <StatCard icon={Activity} label="Total Returns" value={`+${MOCK_PORTFOLIO.returnsPercent.toFixed(1)}%`} change={`+${fmt(MOCK_PORTFOLIO.totalReturns)}`} accent="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
              <div className="flex items-center gap-2"><Star className="h-4 w-4 text-gold" /><h2 className="font-heading text-sm font-medium">Watchlist</h2></div>
              <button className="glass-card flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                <Plus className="h-3 w-3" />Add
              </button>
            </div>
            <div className="divide-y divide-border/30">
              {MOCK_WATCHLIST.map((item) => (
                <div key={item.symbol} className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/[0.02]">
                  <div><p className="text-sm font-medium">{item.symbol}</p><p className="text-xs text-muted-foreground">{item.name}</p></div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums">${item.price.toFixed(2)}</p>
                      <p className={`flex items-center gap-0.5 text-xs ${item.change > 0 ? "text-emerald" : "text-neg"}`}>
                        {item.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {item.change > 0 ? "+" : ""}{item.change}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
              <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-blue" /><h2 className="font-heading text-sm font-medium">Recent Activity</h2></div>
            </div>
            <div className="divide-y divide-border/30">
              {MOCK_ACTIVITY.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-1.5 ${item.type === "buy" ? "bg-emerald/10 text-emerald" : item.type === "sell" ? "bg-neg/10 text-neg" : "bg-gold/10 text-gold"}`}>
                      {item.type === "buy" ? <ArrowUpRight className="h-3.5 w-3.5" /> : item.type === "sell" ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <p className="text-sm">{item.type === "buy" ? `Bought ${item.shares} shares of ${item.symbol}` : item.type === "sell" ? `Sold ${item.shares} shares of ${item.symbol}` : `${item.symbol} — ${item.text}`}</p>
                      {item.price && <p className="text-xs text-muted-foreground">@ ${item.price.toFixed(2)}</p>}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
              <div className="flex items-center gap-2"><Brain className="h-4 w-4 text-violet" /><h2 className="font-heading text-sm font-medium">AI Insights</h2></div>
              <span className="rounded-full bg-violet/10 px-2 py-0.5 text-[10px] font-medium text-violet">Live</span>
            </div>
            <div className="space-y-3 p-5">
              {MOCK_AI_INSIGHTS.map((insight, i) => <InsightCard key={i} {...insight} />)}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass-card rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
              <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-emerald" /><h2 className="font-heading text-sm font-medium">Market Summary</h2></div>
            </div>
            <div className="space-y-3 p-5">
              {[
                { name: "S&P 500", price: "5,432.10", change: "+0.45%" },
                { name: "NASDAQ", price: "17,123.45", change: "+0.82%" },
                { name: "DOW", price: "38,921.30", change: "-0.12%" },
                { name: "BTC/USD", price: "68,432", change: "+2.15%" },
              ].map((m) => (
                <div key={m.name} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{m.name}</span>
                  <div className="text-right">
                    <span className="text-sm font-medium tabular-nums">{m.price}</span>
                    <span className={`ml-2 text-xs ${m.change.startsWith("+") ? "text-emerald" : "text-neg"}`}>{m.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
