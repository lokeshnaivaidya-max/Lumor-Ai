"use client"

import Link from "next/link"
import { motion } from "motion/react"
import {
  TrendingUp, TrendingDown, Wallet, BarChart3, Brain, Activity,
  ArrowUpRight, ArrowDownRight, Plus, Star, Bell, Sparkles,
  RefreshCw, LineChart, ArrowRight, FileText,
} from "lucide-react"
import type { PortfolioSummary, WatchlistView } from "@/lib/portfolio"
import { EmptyState } from "@/components/ui/empty-state"

type NotifView = { id: number; type: string; title: string; body: string | null; read: boolean; createdAt: string }
type AnalysisView = { id: number; symbol: string; kind: string; summary: string | null; confidence: number | null; direction: string; createdAt: string }
type IndexView = { symbol: string; name: string; price: number; changePercent: number }

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

function WatchlistWidget({ items }: { items: WatchlistView[] }) {
  if (items.length === 0) {
    return <EmptyState icon={Star} title="Your watchlist is empty." description="Add a symbol to start tracking it." action={<Link href="/watchlist" className="glass-btn glass-btn-primary px-4 py-2 text-xs">Go to Watchlist</Link>} />
  }
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
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold ${item.changePercent > 0 ? "bg-emerald/10 text-emerald" : "bg-neg/10 text-neg"}`}>
              {item.symbol.slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-semibold">{item.symbol}</p>
              <p className="text-xs text-muted-foreground/70">{item.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">${item.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <span className={`flex items-center gap-0.5 text-xs font-medium ${item.changePercent > 0 ? "text-emerald" : "text-neg"}`}>
              {item.changePercent > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {item.changePercent > 0 ? "+" : ""}{item.changePercent.toFixed(2)}%
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function AnalysisWidget({ items }: { items: AnalysisView[] }) {
  if (items.length === 0) {
    return <EmptyState icon={FileText} title="No analyses yet." description="Run an AI analysis to save it here." action={<Link href="/markets" className="glass-btn glass-btn-primary px-4 py-2 text-xs">Analyze a stock</Link>} />
  }
  return (
    <div className="flex flex-col gap-2.5">
      {items.slice(0, 4).map((a, i) => {
        const dir = a.direction === "up" ? "emerald" : a.direction === "down" ? "neg" : "gold"
        const bar = dir === "emerald" ? "bg-emerald/15 text-emerald" : dir === "neg" ? "bg-neg/15 text-neg" : "bg-gold/15 text-gold"
        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 * i, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="group relative flex gap-3.5 overflow-hidden rounded-2xl border border-border/20 bg-background/20 p-4 transition-all hover:border-border/50 hover:bg-background/40"
          >
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${bar}`}>
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${bar}`}>{a.symbol}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">{a.kind}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{a.summary || "Analysis saved."}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function NotificationWidget({ items }: { items: NotifView[] }) {
  if (items.length === 0) {
    return <EmptyState icon={Bell} title="No notifications yet." description="Price alerts and AI insights will appear here." action={<Link href="/notifications" className="glass-btn glass-btn-primary px-4 py-2 text-xs">View Notifications</Link>} />
  }
  const iconMap: Record<string, React.ElementType> = { price: TrendingUp, ai: Brain, portfolio: Wallet }
  return (
    <div className="space-y-2">
      {items.slice(0, 5).map((n, i) => {
        const Icon = iconMap[n.type] || Bell
        return (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 * i, duration: 0.35 }}
            className={`flex items-start gap-3 rounded-2xl px-3 py-2.5 ${n.read ? "" : "bg-primary/[0.04]"}`}
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet/10 text-violet">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{n.title}</p>
              {n.body && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{n.body}</p>}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export function DashboardClient({
  name,
  portfolio,
  watchlist,
  notifications,
  analyses,
  indices,
}: {
  name: string
  portfolio: PortfolioSummary
  watchlist: WatchlistView[]
  notifications: NotifView[]
  analyses: AnalysisView[]
  indices: IndexView[]
}) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
  const hasPortfolio = portfolio.holdingsCount > 0

  return (
    <div className="relative p-6 lg:p-8">
      <div className="relative z-10 mb-8 flex flex-wrap items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {greeting()}
            <span className="ml-2 inline-block bg-gradient-to-r from-blue via-violet to-emerald bg-clip-text text-transparent font-heading">{name}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Your portfolio overview and market intelligence.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex items-center gap-3">
          <Link href="/portfolio" className="glass-btn glass-btn-primary px-4 py-2.5 text-xs">
            <Wallet className="h-3.5 w-3.5" />Portfolio
          </Link>
        </motion.div>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-5 sm:grid-cols-6 md:grid-cols-12">
        {hasPortfolio ? (
          <>
            <AnimatedSection delay={0.05} className="sm:col-span-3 md:col-span-4">
              <GlowCard glowColor="oklch(0.62 0.16 168 / 0.2)">
                <PremiumStat icon={Wallet} label="Portfolio Value" value={fmt(portfolio.value)} accent="emerald" trend={portfolio.value >= portfolio.investment ? "up" : "down"} />
              </GlowCard>
            </AnimatedSection>
            <AnimatedSection delay={0.1} className="sm:col-span-3 md:col-span-3">
              <GlowCard glowColor="oklch(0.55 0.18 255 / 0.2)">
                <PremiumStat icon={TrendingUp} label="Today's P&L" value={`${portfolio.todayPnL >= 0 ? "+" : "-"}${fmt(Math.abs(portfolio.todayPnL))}`} accent="blue" trend={portfolio.todayPnL >= 0 ? "up" : "down"} />
              </GlowCard>
            </AnimatedSection>
            <AnimatedSection delay={0.15} className="sm:col-span-3 md:col-span-3">
              <GlowCard glowColor="oklch(0.75 0.12 75 / 0.2)">
                <PremiumStat icon={Activity} label="Total Returns" value={`${portfolio.totalReturns >= 0 ? "+" : "-"}${fmt(Math.abs(portfolio.totalReturns))}`} change={`${portfolio.returnsPercent.toFixed(2)}% all time`} accent="gold" trend={portfolio.totalReturns >= 0 ? "up" : "down"} />
              </GlowCard>
            </AnimatedSection>
            <AnimatedSection delay={0.2} className="sm:col-span-3 md:col-span-2">
              <GlowCard glowColor="oklch(0.48 0.16 280 / 0.2)">
                <PremiumStat icon={BarChart3} label="Investment" value={fmt(portfolio.investment)} accent="violet" />
              </GlowCard>
            </AnimatedSection>
          </>
        ) : (
          <AnimatedSection delay={0.05} className="sm:col-span-6 md:col-span-12">
            <GlowCard>
              <EmptyState icon={Wallet} title="No portfolio yet." description="Add your holdings to see live valuation and P&L." action={<Link href="/portfolio" className="glass-btn glass-btn-primary px-4 py-2 text-xs"><Plus className="h-3.5 w-3.5" />Add holdings</Link>} />
            </GlowCard>
          </AnimatedSection>
        )}

        <AnimatedSection delay={0.25} className="sm:col-span-6 md:col-span-5 sm:row-span-2">
          <GlowCard glowColor="oklch(0.75 0.12 75 / 0.15)" className="flex h-full flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-gold" />
                <h2 className="font-heading text-sm font-medium">Watchlist</h2>
              </div>
              <Link href="/watchlist" className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                <Plus className="h-3 w-3" />Add
              </Link>
            </div>
            <div className="flex-1">
              <WatchlistWidget items={watchlist} />
            </div>
          </GlowCard>
        </AnimatedSection>

        <AnimatedSection delay={0.3} className="sm:col-span-6 md:col-span-3 sm:row-span-2">
          <GlowCard glowColor="oklch(0.48 0.16 280 / 0.2)" className="flex h-full flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-violet" />
                <h2 className="font-heading text-sm font-medium">Saved Analysis</h2>
              </div>
              <Link href="/saved-analysis" className="rounded-full bg-violet/10 px-2 py-0.5 text-[10px] font-medium text-violet">View all</Link>
            </div>
            <div className="flex flex-1 flex-col gap-2.5">
              <AnalysisWidget items={analyses} />
            </div>
          </GlowCard>
        </AnimatedSection>

        <AnimatedSection delay={0.35} className="sm:col-span-3 md:col-span-4">
          <GlowCard glowColor="oklch(0.55 0.18 255 / 0.15)">
            <div className="mb-4 flex items-center gap-2">
              <LineChart className="h-4 w-4 text-blue" />
              <h2 className="font-heading text-sm font-medium">Market Indices</h2>
            </div>
            <div className="space-y-3">
              {indices.length === 0 ? (
                <p className="text-xs text-muted-foreground">Market data unavailable.</p>
              ) : (
                indices.map((m, i) => (
                  <div key={m.symbol} className="flex items-center justify-between rounded-xl px-1 py-1">
                    <span className="text-sm text-muted-foreground/80">{m.name}</span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium tabular-nums">{m.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                      <span className={`text-xs font-medium tabular-nums ${m.changePercent >= 0 ? "text-emerald" : "text-neg"}`}>
                        {m.changePercent >= 0 ? "+" : ""}{m.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlowCard>
        </AnimatedSection>

        <AnimatedSection delay={0.4} className="sm:col-span-6 md:col-span-8">
          <GlowCard glowColor="oklch(0.55 0.18 255 / 0.12)">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue" />
                <h2 className="font-heading text-sm font-medium">Notifications</h2>
              </div>
              <Link href="/notifications" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <NotificationWidget items={notifications} />
          </GlowCard>
        </AnimatedSection>
      </div>
    </div>
  )
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning, "
  if (h < 17) return "Good afternoon, "
  return "Good evening, "
}
