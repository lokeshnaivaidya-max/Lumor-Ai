"use client"

import Link from "next/link"
import { motion } from "motion/react"
import {
  TrendingUp, TrendingDown, Wallet, BarChart3, ArrowUpRight, ArrowDownRight,
  Plus, Bell, LineChart, ArrowRight, Star, Sparkles, Activity, Search,
} from "lucide-react"
import type { PortfolioSummary, WatchlistView } from "@/lib/portfolio"

type NotifView = { id: number; type: string; title: string; body: string | null; read: boolean; createdAt: string }
type AnalysisView = { id: number; symbol: string; kind: string; summary: string | null; confidence: number | null; direction: string; createdAt: string }
type IndexView = { symbol: string; name: string; price: number; changePercent: number }

function StatCard({ icon: Icon, label, value, change, trend, delay = 0 }: {
  icon: React.ElementType; label: string; value: string; change?: string;
  trend?: "up" | "down"; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="meta">{label}</p>
        <Icon className="h-4 w-4" style={{ color: "var(--text-tertiary)" }} />
      </div>
      <p className={`stat-number ${trend === "up" ? "text-[var(--emerald)]" : trend === "down" ? "text-[var(--rose)]" : ""}`}>
        {value}
      </p>
      {change && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${trend === "up" ? "text-[var(--emerald)]" : trend === "down" ? "text-[var(--rose)]" : "text-[var(--text-tertiary)]"}`}>
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
        className="glass-card rounded-2xl p-6"
      >
        <p className="meta mb-3">Watchlist</p>
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--gold-soft)] text-[var(--gold)]">
            <Star className="h-4 w-4" />
          </span>
          <p className="body">Track your first stock</p>
        </div>
        <Link href="/watchlist" className="btn btn--gold btn--sm">
          <Plus className="h-3 w-3" /> Add your first
        </Link>
      </motion.div>
    )
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="meta">Watchlist</p>
        <Link href="/watchlist" className="btn btn--ghost btn--sm">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-3">
        {items.slice(0, 4).map((item, i) => {
          const pos = item.changePercent >= 0
          return (
            <motion.div
              key={item.symbol}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.25 + i * 0.05 }}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--glass-base)]"
            >
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{item.symbol}</p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{item.name}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-medium tabular-nums text-[var(--text-primary)]">
                  ${item.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-xs font-medium ${pos ? "text-[var(--emerald)]" : "text-[var(--rose)]"}`}>
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
        className="glass-card rounded-2xl p-6"
      >
        <p className="meta mb-3">AI Insights</p>
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--gold-soft)] text-[var(--gold)]">
            <LineChart className="h-4 w-4" />
          </span>
          <p className="body">Run your first AI analysis</p>
        </div>
        <Link href="/markets" className="btn btn--gold btn--sm">
          <Sparkles className="h-3 w-3" /> Analyze a stock
        </Link>
      </motion.div>
    )
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="meta">AI Insights</p>
        <Link href="/saved-analysis" className="btn btn--ghost btn--sm">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-3">
        {analyses.slice(0, 3).map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.35 + i * 0.05 }}
            className="rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--glass-base)]"
          >
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${
                a.direction === "bullish" ? "text-[var(--emerald)]" :
                a.direction === "bearish" ? "text-[var(--rose)]" : "text-[var(--amber)]"
              }`}>
                {a.symbol}
              </span>
              <span className="meta">{a.kind}</span>
              {a.confidence != null && (
                <span className="badge badge--neutral text-[10px]">{a.confidence}%</span>
              )}
            </div>
            {a.summary && (
              <p className="mt-1 text-xs line-clamp-1" style={{ color: "var(--text-secondary)" }}>{a.summary}</p>
            )}
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
      className="glass rounded-2xl px-5 py-3"
    >
      <div className="flex items-center gap-6 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {indices.map((idx) => {
          const pos = idx.changePercent >= 0
          return (
            <div key={idx.symbol} className="flex shrink-0 items-center gap-3">
              <div>
                <p className="text-xs font-medium text-[var(--text-primary)]">{idx.name}</p>
                <p className="font-mono text-sm font-semibold tabular-nums text-[var(--text-primary)]">
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
        className="glass-card rounded-2xl p-6"
      >
        <p className="meta mb-3">Recent Activity</p>
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--gold-soft)] text-[var(--gold)]">
            <Search className="h-4 w-4" />
          </span>
          <p className="body">Search a stock to begin</p>
        </div>
      </motion.div>
    )
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="meta">Recent Activity</p>
        <Link href="/notifications" className="btn btn--ghost btn--sm">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {notifications.slice(0, 3).map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.45 + i * 0.05 }}
            className="rounded-xl px-3 py-2 transition-colors hover:bg-[var(--glass-base)]"
          >
            <p className="text-sm font-medium text-[var(--text-primary)]">{n.title}</p>
            {n.body && <p className="text-xs line-clamp-1" style={{ color: "var(--text-secondary)" }}>{n.body}</p>}
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
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="subheading animate-fade-up">Dashboard</p>
        <h1 className="heading mt-1 animate-fade-up delay-1">
          Welcome back{name ? `, ${name.split(" ")[0]}` : ""}
        </h1>
        <p className="body mt-2 animate-fade-up delay-2">
          Here&rsquo;s your market overview at a glance.
        </p>
      </motion.div>

      {/* Index Ticker */}
      {indices.length > 0 && <IndexTicker indices={indices} />}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <StatCard
          icon={Activity} label="Watching"
          value={String(watchlist.length)}
          delay={0.15}
        />
        <StatCard
          icon={BarChart3} label="Analyses"
          value={String(analyses.length)}
          delay={0.2}
        />
        <StatCard
          icon={Bell} label="Updates"
          value={String(notifications.length)}
          delay={0.25}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WatchlistWidget items={watchlist} />
        <InsightsWidget analyses={analyses} />
      </div>

      {/* Activity */}
      <ActivityWidget notifications={notifications} />
    </div>
  )
}
