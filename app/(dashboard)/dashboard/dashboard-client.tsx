"use client"

import { useState, useRef, useCallback } from "react"
import { motion, useSpring, useMotionValue } from "motion/react"
import {
  TrendingUp, TrendingDown, Wallet, BarChart3, Brain, Activity,
  ArrowUpRight, ArrowDownRight, Plus, Star, Bell, Sparkles,
  RefreshCw, Zap, LineChart, ArrowRight,
} from "lucide-react"

const MOCK_PORTFOLIO = { totalInvestment: 125000, currentValue: 142850, todayPnL: 2840, totalReturns: 17850, returnsPercent: 14.28 }
const MOCK_AI_INSIGHTS = [
  { text: "NVDA shows strong momentum with RSI at 62. Consider adding on dips.", type: "buy" as const, symbol: "NVDA" },
  { text: "Portfolio tech allocation at 68%. Consider rebalancing toward healthcare.", type: "alert" as const, symbol: null },
  { text: "TSLA breached resistance at $245. Bull flag forming on 4H.", type: "signal" as const, symbol: "TSLA" },
]
const MOCK_ACTIVITY = [
  { type: "buy", symbol: "NVDA", shares: 15, price: 892.5, time: "2h ago" },
  { type: "sell", symbol: "AAPL", shares: 10, price: 178.2, time: "1d ago" },
  { type: "alert", symbol: "TSLA", text: "Up 4.2% today", time: "3h ago" },
]
const MOCK_WATCHLIST = [
  { symbol: "AAPL", price: 178.2, change: 1.2, name: "Apple Inc." },
  { symbol: "NVDA", price: 892.5, change: 3.8, name: "NVIDIA Corp." },
  { symbol: "TSLA", price: 238.4, change: -0.6, name: "Tesla Inc." },
  { symbol: "MSFT", price: 425.3, change: 0.8, name: "Microsoft Corp." },
]

function SpotlightGlow() {
  const ref = useRef<HTMLDivElement>(null)
  const rawX = useMotionValue(-500)
  const rawY = useMotionValue(-500)
  const x = useSpring(rawX, { stiffness: 65, damping: 25, mass: 0.8 })
  const y = useSpring(rawY, { stiffness: 65, damping: 25, mass: 0.8 })

  const handleMove = useCallback((e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (r) { rawX.set(e.clientX - r.left); rawY.set(e.clientY - r.top) }
  }, [rawX, rawY])

  return (
    <div ref={ref} onMouseMove={handleMove} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute left-0 top-0 h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ x, y, background: "radial-gradient(circle at center, oklch(0.55 0.18 255 / 0.07), transparent 60%)" }}
      />
      <motion.div
        className="absolute left-0 top-0 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ x, y, background: "radial-gradient(circle at center, oklch(0.6 0.16 168 / 0.04), transparent 60%)" }}
      />
    </div>
  )
}

function GlowCard({ children, className, hover = true, glowColor = "oklch(0.55 0.18 255 / 0.15)" }: {
  children: React.ReactNode; className?: string; hover?: boolean; glowColor?: string
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.008 } : undefined}
      transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.6 }}
      className="group relative transform-gpu"
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 blur-xl transition-all duration-500 group-hover:opacity-100"
        style={{ boxShadow: `0 0 48px 8px ${glowColor}` }}
      />
      <div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-all duration-300 group-hover:opacity-60"
        style={{ boxShadow: `inset 0 0 20px 2px ${glowColor}` }}
      />
      <div className={`relative glass-card edge-light overflow-hidden rounded-3xl p-6 ${className || ""}`}>
        {children}
      </div>
    </motion.div>
  )
}

function AnimatedSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function PremiumStat({ icon: Icon, label, value, change, accent, trend }: {
  icon: React.ElementType; label: string; value: string; change?: string;
  accent: "blue" | "emerald" | "violet" | "gold"; trend?: "up" | "down"
}) {
  const colors = {
    blue: { icon: "text-blue", bg: "bg-blue/10" },
    emerald: { icon: "text-emerald", bg: "bg-emerald/10" },
    violet: { icon: "text-violet", bg: "bg-violet/10" },
    gold: { icon: "text-gold", bg: "bg-gold/10" },
  }
  const c = colors[accent]
  return (
    <div className="flex flex-col justify-between gap-2">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">{label}</p>
          <p className={`font-heading text-3xl font-semibold tracking-tight ${trend === "up" ? "text-emerald" : trend === "down" ? "text-neg" : ""}`}>
            {value}
          </p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ${c.icon}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      {change && (
        <div className="flex items-center gap-1.5">
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend === "up" ? "text-emerald" : trend === "down" ? "text-neg" : "text-muted-foreground"}`}>
            {trend === "up" && <TrendingUp className="h-3 w-3" />}
            {trend === "down" && <TrendingDown className="h-3 w-3" />}
            {change}
          </span>
        </div>
      )}
    </div>
  )
}

function AIInsightCard({ text, type, symbol, index }: {
  text: string; type: "buy" | "alert" | "signal"; symbol: string | null; index: number
}) {
  const config = {
    buy: { icon: TrendingUp, color: "emerald" as const, label: "Buy Signal" },
    alert: { icon: Bell, color: "gold" as const, label: "Alert" },
    signal: { icon: Sparkles, color: "blue" as const, label: "Signal" },
  }
  const cfg = config[type]
  const c = {
    emerald: { bar: "bg-emerald", icon: "text-emerald", bg: "bg-emerald/8", border: "border-emerald/15" },
    gold: { bar: "bg-gold", icon: "text-gold", bg: "bg-gold/8", border: "border-gold/15" },
    blue: { bar: "bg-blue", icon: "text-blue", bg: "bg-blue/8", border: "border-blue/15" },
  }[cfg.color]
  const Icon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.06 * index, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex gap-3.5 overflow-hidden rounded-2xl border border-border/20 bg-background/20 p-4 transition-all hover:border-border/50 hover:bg-background/40 hover:shadow-sm"
    >
      <div className={`absolute left-0 top-2 h-[calc(100%-16px)] w-[3px] rounded-full ${c.bar} opacity-70`} />
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${c.bg} ${c.icon}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {symbol && (
            <span className={`rounded-md border ${c.border} ${c.icon} px-1.5 py-0.5 text-[10px] font-bold tracking-wider`}>
              {symbol}
            </span>
          )}
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">{cfg.label}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </motion.div>
  )
}

function ActivityTimeline({ items }: { items: typeof MOCK_ACTIVITY }) {
  return (
    <div className="relative space-y-0">
      {items.map((item, i) => {
        const isBuy = item.type === "buy"
        const isSell = item.type === "sell"
        const color = isBuy ? "text-emerald" : isSell ? "text-neg" : "text-gold"
        const borderColor = isBuy ? "border-emerald/25" : isSell ? "border-neg/25" : "border-gold/25"
        const bgColor = isBuy ? "bg-emerald/10" : isSell ? "bg-neg/10" : "bg-gold/10"
        const Icon = isBuy ? ArrowUpRight : isSell ? ArrowDownRight : Bell
        const label = isBuy ? "Buy" : isSell ? "Sell" : "Alert"
        const desc = isBuy
          ? `Bought ${item.shares} shares of ${item.symbol}`
          : isSell
          ? `Sold ${item.shares} shares of ${item.symbol}`
          : `${item.symbol} — ${item.text}`

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 * i, duration: 0.4 }}
            className="group relative flex gap-4 pb-6 last:pb-0"
          >
            {i < items.length - 1 && (
              <div className="absolute left-[15px] top-[30px] h-full w-px bg-gradient-to-b from-border/40 to-transparent" />
            )}
            <div className={`relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${borderColor} ${bgColor} ${color}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>{label}</span>
                  <p className="text-sm font-medium">{desc}</p>
                </div>
                {item.price && (
                  <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">@ ${item.price.toFixed(2)}</p>
                )}
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground/50">{item.time}</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function WatchlistWidget({ items }: { items: typeof MOCK_WATCHLIST }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <motion.div
          key={item.symbol}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 * i, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="group flex items-center justify-between rounded-2xl px-3 py-2.5 transition-colors hover:bg-white/[0.04] dark:hover:bg-white/[0.04]"
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold ${
              item.change > 0 ? "bg-emerald/10 text-emerald" : "bg-neg/10 text-neg"
            }`}>
              {item.symbol.slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-semibold">{item.symbol}</p>
              <p className="text-xs text-muted-foreground/70">{item.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">${item.price.toFixed(2)}</p>
            <span className={`flex items-center gap-0.5 text-xs font-medium ${item.change > 0 ? "text-emerald" : "text-neg"}`}>
              {item.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {item.change > 0 ? "+" : ""}{item.change}%
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function MarketSummary() {
  const markets = [
    { name: "S&P 500", price: "5,432.10", change: "+0.45%" },
    { name: "NASDAQ", price: "17,123.45", change: "+0.82%" },
    { name: "DOW", price: "38,921.30", change: "-0.12%" },
    { name: "BTC/USD", price: "68,432", change: "+2.15%" },
  ]
  return (
    <div className="space-y-3">
      {markets.map((m, i) => (
        <motion.div
          key={m.name}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.06 * i, duration: 0.35 }}
          className="group flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-blue/40" />
            <span className="text-sm text-muted-foreground/80">{m.name}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium tabular-nums">{m.price}</span>
            <span className={`text-xs font-medium tabular-nums ${m.change.startsWith("+") ? "text-emerald" : "text-neg"}`}>
              {m.change}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export function DashboardClient() {
  const [greeting] = useState(() => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  })

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

  return (
    <div className="relative p-6 lg:p-8">
      <SpotlightGlow />

      <div className="relative z-10 mb-8 flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {greeting}
            <span className="ml-2 inline-block bg-gradient-to-r from-blue via-violet to-emerald bg-clip-text text-transparent font-heading">Alex</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Your portfolio overview and market intelligence.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="glass-card flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="premium-btn premium-btn-primary px-4 py-2.5 text-xs"
          >
            <Brain className="h-3.5 w-3.5" />
            AI Overview
          </motion.button>
        </motion.div>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-5 sm:grid-cols-6 md:grid-cols-12">
        <AnimatedSection delay={0.05} className="sm:col-span-3 md:col-span-4">
          <GlowCard glowColor="oklch(0.62 0.16 168 / 0.2)">
            <PremiumStat
              icon={Wallet}
              label="Portfolio Value"
              value={fmt(MOCK_PORTFOLIO.currentValue)}
              change={`+${fmt(MOCK_PORTFOLIO.totalReturns)} all time`}
              accent="emerald"
              trend="up"
            />
          </GlowCard>
        </AnimatedSection>

        <AnimatedSection delay={0.1} className="sm:col-span-3 md:col-span-3">
          <GlowCard glowColor="oklch(0.55 0.18 255 / 0.2)">
            <PremiumStat
              icon={TrendingUp}
              label="Today's P&L"
              value={`+${fmt(MOCK_PORTFOLIO.todayPnL)}`}
              change="+2.01% today"
              accent="blue"
              trend="up"
            />
          </GlowCard>
        </AnimatedSection>

        <AnimatedSection delay={0.15} className="sm:col-span-3 md:col-span-3">
          <GlowCard glowColor="oklch(0.75 0.12 75 / 0.2)">
            <PremiumStat
              icon={Activity}
              label="Total Returns"
              value={`+${MOCK_PORTFOLIO.returnsPercent.toFixed(1)}%`}
              change={`+${fmt(MOCK_PORTFOLIO.totalReturns)}`}
              accent="gold"
              trend="up"
            />
          </GlowCard>
        </AnimatedSection>

        <AnimatedSection delay={0.2} className="sm:col-span-3 md:col-span-2">
          <GlowCard glowColor="oklch(0.48 0.16 280 / 0.2)">
            <PremiumStat
              icon={BarChart3}
              label="Investment"
              value={fmt(MOCK_PORTFOLIO.totalInvestment)}
              accent="violet"
            />
          </GlowCard>
        </AnimatedSection>

        <AnimatedSection delay={0.25} className="sm:col-span-6 md:col-span-5 sm:row-span-2">
          <GlowCard glowColor="oklch(0.75 0.12 75 / 0.15)" className="flex h-full flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-gold" />
                <h2 className="font-heading text-sm font-medium">Watchlist</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass-card flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Plus className="h-3 w-3" />Add
              </motion.button>
            </div>
            <div className="flex-1">
              <WatchlistWidget items={MOCK_WATCHLIST} />
            </div>
          </GlowCard>
        </AnimatedSection>

        <AnimatedSection delay={0.3} className="sm:col-span-6 md:col-span-3 sm:row-span-2">
          <GlowCard glowColor="oklch(0.48 0.16 280 / 0.2)" className="flex h-full flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-violet" />
                <h2 className="font-heading text-sm font-medium">AI Insights</h2>
              </div>
              <span className="rounded-full bg-violet/10 px-2 py-0.5 text-[10px] font-medium text-violet">Live</span>
            </div>
            <div className="flex flex-1 flex-col gap-2.5">
              {MOCK_AI_INSIGHTS.map((insight, i) => (
                <AIInsightCard key={i} {...insight} index={i} />
              ))}
            </div>
          </GlowCard>
        </AnimatedSection>

        <AnimatedSection delay={0.35} className="sm:col-span-3 md:col-span-4">
          <GlowCard glowColor="oklch(0.55 0.18 255 / 0.15)">
            <div className="flex items-center gap-2 mb-4">
              <LineChart className="h-4 w-4 text-blue" />
              <h2 className="font-heading text-sm font-medium">Market Summary</h2>
            </div>
            <MarketSummary />
          </GlowCard>
        </AnimatedSection>

        <AnimatedSection delay={0.4} className="sm:col-span-6 md:col-span-8">
          <GlowCard glowColor="oklch(0.55 0.18 255 / 0.12)">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="h-4 w-4 text-blue" />
              <h2 className="font-heading text-sm font-medium">Recent Activity</h2>
            </div>
            <ActivityTimeline items={MOCK_ACTIVITY} />
          </GlowCard>
        </AnimatedSection>
      </div>
    </div>
  )
}
