"use client"

import Link from "next/link"
import { motion } from "motion/react"
import {
  TrendingUp, TrendingDown, Wallet, BarChart3, ArrowUpRight, ArrowDownRight,
  Plus, Bell, LineChart, ArrowRight, Star, Sparkles, Activity, Search,
  Eye,
} from "lucide-react"
import type { PortfolioSummary, WatchlistView } from "@/lib/portfolio"

type NotifView = { id: number; type: string; title: string; body: string | null; read: boolean; createdAt: string }
type AnalysisView = { id: number; symbol: string; kind: string; summary: string | null; confidence: number | null; direction: string; createdAt: string }
type IndexView = { symbol: string; name: string; price: number; changePercent: number }

function MetricPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border px-3.5 py-2" style={{ borderColor: "var(--glass-border)", background: "var(--glass-bg)" }}>
      <Icon className="h-3.5 w-3.5" style={{ color: "var(--text-tertiary)" }} />
      <div>
        <p className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>{label}</p>
        <p className="text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{value}</p>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, change, trend, delay = 0 }: {
  icon: React.ElementType; label: string; value: string; change?: string;
  trend?: "up" | "down"; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
      className="glass-card rounded-2xl p-5 h-full"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="meta">{label}</p>
        <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: "var(--glass-bg)" }}>
          <Icon className="h-3.5 w-3.5" style={{ color: "var(--text-tertiary)" }} />
        </span>
      </div>
      <p className={`stat-number ${trend === "up" ? "text-[var(--emerald)]" : trend === "down" ? "text-[var(--rose)]" : ""}`}>
        {value}
      </p>
      {change && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${trend === "up" ? "text-[var(--emerald)]" : trend === "down" ? "text-[var(--rose)]" : "text-[var(--text-tertiary)]"}`}>
            {trend === "up" && <TrendingUp className="h-3 w-3" />}
            {trend === "down" && <TrendingDown className="h-3 w-3" />}
            {change}
          </span>
        </div>
      )}
    </motion.div>
  )
}

function WatchlistWidget({ items }: { items: WatchlistView[] }) {
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="bento-card rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center"
      >
        <div className="pointer-events-none absolute -inset-16 opacity-30" style={{ background: 'radial-gradient(circle at 50% 50%, var(--gold-glow-strong), transparent 60%)' }} />
        <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--gold-glow)", color: "var(--gold)" }}>
          <Eye className="h-6 w-6" />
        </div>
        <p className="heading-sm">Your watchlist is empty</p>
        <p className="body-sm mt-2 mb-6 max-w-xs">Start tracking stocks and markets you care about.</p>
        <Link href="/watchlist" className="btn btn--gold">
          <Plus className="h-3.5 w-3.5" /> Add stocks
        </Link>
      </motion.div>
    )
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="bento-card rounded-2xl p-6 h-full"
    >
      <div className="mb-5 flex items-center justify-between">
        <p className="meta">Watchlist</p>
        <Link href="/watchlist" className="btn btn--ghost btn--sm">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {items.slice(0, 5).map((item, i) => {
          const pos = item.changePercent >= 0
          return (
            <motion.div
              key={item.symbol}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.25 + i * 0.04 }}
              className="group flex items-center justify-between rounded-xl px-3.5 py-3 transition-all duration-300 hover:pl-5"
              style={{ background: "var(--glass-bg)" }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold" style={{ background: "var(--gold-glow)", color: "var(--gold)" }}>
                  {item.symbol.slice(0, 2)}
                </span>
                <div>
                  <p className="text-sm font-medium leading-tight" style={{ color: "var(--text-primary)" }}>{item.symbol}</p>
                  <p className="text-[11px] leading-tight" style={{ color: "var(--text-tertiary)" }}>{item.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-semibold tabular-nums leading-tight" style={{ color: "var(--text-primary)" }}>
                  ${item.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-[11px] font-medium leading-tight ${pos ? "text-[var(--emerald)]" : "text-[var(--rose)]"}`}>
                  {pos ? "+" : ""}{item.changePercent.toFixed(2)}%
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

function InsightsWidget({ analyses }: { analyses: AnalysisView[] }) {
  if (analyses.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        className="bento-card rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center"
      >
        <div className="pointer-events-none absolute -inset-16 opacity-30" style={{ background: 'radial-gradient(circle at 50% 50%, var(--gold-glow-strong), transparent 60%)' }} />
        <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--gold-glow)", color: "var(--gold)" }}>
          <BarChart3 className="h-6 w-6" />
        </div>
        <p className="heading-sm">No AI insights yet</p>
        <p className="body-sm mt-2 mb-6 max-w-xs">Run AI analysis on any stock to get started.</p>
        <Link href="/markets" className="btn btn--gold">
          <Sparkles className="h-3.5 w-3.5" /> Analyze a stock
        </Link>
      </motion.div>
    )
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      className="bento-card rounded-2xl p-6 h-full"
    >
      <div className="mb-5 flex items-center justify-between">
        <p className="meta">AI Insights</p>
        <Link href="/saved-analysis" className="btn btn--ghost btn--sm">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {analyses.slice(0, 4).map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.35 + i * 0.04 }}
            className="group rounded-xl px-3.5 py-3 transition-all duration-300 hover:pl-5"
            style={{ background: "var(--glass-bg)" }}
          >
            <div className="flex items-center gap-2.5">
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold ${
                a.direction === "bullish" ? "bg-[var(--emerald-glow)] text-[var(--emerald)]" :
                a.direction === "bearish" ? "bg-[var(--rose-glow)] text-[var(--rose)]" : "bg-[var(--gold-glow)] text-[var(--gold)]"
              }`}>
                {a.symbol.slice(0, 2)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium leading-tight" style={{ color: "var(--text-primary)" }}>{a.symbol}</span>
                  <span className="meta leading-tight">{a.kind}</span>
                  {a.confidence != null && (
                    <span className="badge text-[10px]">{Math.round(a.confidence * 100)}%</span>
                  )}
                </div>
                {a.summary && (
                  <p className="mt-0.5 text-xs line-clamp-1 leading-tight" style={{ color: "var(--text-secondary)" }}>{a.summary}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function IndexTicker({ indices }: { indices: IndexView[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="glass rounded-2xl px-5 py-3.5"
    >
      <div className="flex items-center gap-8 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {indices.map((idx) => {
          const pos = idx.changePercent >= 0
          return (
            <div key={idx.symbol} className="flex shrink-0 items-center gap-3">
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{idx.name}</p>
                <p className="font-mono text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {idx.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-medium ${
                pos ? "text-[var(--emerald)]" : "text-[var(--rose)]"
              }`}>
                {pos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {pos ? "+" : ""}{idx.changePercent.toFixed(2)}%
              </span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

function ActivityWidget({ notifications }: { notifications: NotifView[] }) {
  if (notifications.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        className="bento-card rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center"
      >
        <div className="pointer-events-none absolute -inset-16 opacity-30" style={{ background: 'radial-gradient(circle at 50% 50%, var(--gold-glow-strong), transparent 60%)' }} />
        <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--gold-glow)", color: "var(--gold)" }}>
          <Search className="h-6 w-6" />
        </div>
        <p className="heading-sm">No activity yet</p>
        <p className="body-sm mt-2 max-w-xs">Search a stock or run analysis to get started.</p>
      </motion.div>
    )
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
      className="bento-card rounded-2xl p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <p className="meta">Recent Activity</p>
        <Link href="/notifications" className="btn btn--ghost btn--sm">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {notifications.slice(0, 4).map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.45 + i * 0.04 }}
            className="group flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all duration-300 hover:pl-5"
            style={{ background: "var(--glass-bg)" }}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs" style={{ background: "var(--gold-glow)", color: "var(--gold)" }}>
              <Activity className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight" style={{ color: "var(--text-primary)" }}>{n.title}</p>
              {n.body && <p className="mt-0.5 text-xs line-clamp-1 leading-tight" style={{ color: "var(--text-secondary)" }}>{n.body}</p>}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export function DashboardClient({
  name, portfolio, watchlist, notifications, analyses, indices,
}: {
  name: string; portfolio: PortfolioSummary; watchlist: WatchlistView[];
  notifications: NotifView[]; analyses: AnalysisView[]; indices: IndexView[]
}) {
  const hasPortfolio = portfolio.value > 0
  return (
    <div className="space-y-6">
      {/* Hero — full-width editorial composition */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="bento-card relative overflow-hidden px-8 py-8 float-subtle"
      >
        <div className="pointer-events-none absolute -inset-20 opacity-40" style={{ background: 'radial-gradient(circle at 30% 0%, var(--gold-glow-strong), transparent 60%)' }} />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <p className="subheading"><span className="dot-gold" /> Dashboard</p>
            <span className="h-3 w-px" style={{ background: "var(--glass-border)" }} />
            <MetricPill icon={Eye} label="Watching" value={String(watchlist.length)} />
            <MetricPill icon={BarChart3} label="Analyses" value={String(analyses.length)} />
            <MetricPill icon={Bell} label="Updates" value={String(notifications.length)} />
          </div>
          <h1 className="heading" style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)" }}>
            Welcome back{name ? `, ${name.split(" ")[0]}` : ""}
          </h1>
          <p className="body mt-2 max-w-lg">
            Here&rsquo;s your market overview at a glance.
          </p>
        </div>
      </motion.div>

      {/* Index Ticker */}
      {indices.length > 0 && <IndexTicker indices={indices} />}

      {/* Bento Grid — varied card sizes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Portfolio Value — wide card */}
        <div className="lg:col-span-2">
          <StatCard
            icon={Wallet} label="Portfolio Value"
            value={hasPortfolio ? `$${portfolio.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "No holdings yet"}
            change={hasPortfolio
              ? `${portfolio.returnsPercent >= 0 ? "+" : ""}${portfolio.returnsPercent.toFixed(2)}%`
              : undefined}
            trend={hasPortfolio
              ? (portfolio.returnsPercent >= 0 ? "up" as const : "down" as const)
              : undefined}
            delay={0.1}
          />
        </div>

        {/* Watching stat */}
        <StatCard
          icon={Eye} label="Watching"
          value={String(watchlist.length)}
          delay={0.15}
        />

        {/* Analyses stat */}
        <StatCard
          icon={BarChart3} label="Analyses"
          value={String(analyses.length)}
          delay={0.2}
        />
      </div>

      {/* Main Grid — 2-column */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WatchlistWidget items={watchlist} />
        <InsightsWidget analyses={analyses} />
      </div>

      {/* Activity — full width */}
      <ActivityWidget notifications={notifications} />
    </div>
  )
}
