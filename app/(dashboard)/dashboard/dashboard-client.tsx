"use client"

import Link from "next/link"
import { motion } from "motion/react"
import {
  TrendingUp, TrendingDown, Wallet, BarChart3, ArrowUpRight, ArrowDownRight,
  Plus, Bell, LineChart, ArrowRight, Star, Activity, Search,
  Eye, Layers,
} from "lucide-react"
import type { PortfolioSummary, WatchlistView } from "@/lib/portfolio"
import { MarketFocus } from "./market-focus"

type NotifView = { id: number; type: string; title: string; body: string | null; read: boolean; createdAt: string }
type AnalysisView = { id: number; symbol: string; kind: string; summary: string | null; confidence: number | null; direction: string; createdAt: string }
type IndexView = { symbol: string; name: string; price: number; changePercent: number }

function Kpi({ label, value, change, trend, delay }: {
  label: string; value: string; change?: string; trend?: "up" | "down"; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
      className="bento-card flex flex-col justify-between p-6"
    >
      <div className="flex items-center justify-between">
        <span className="meta">{label}</span>
      </div>
      <div className="mt-4">
        <p className={`stat-number ${trend === "up" ? "text-[var(--pos)]" : trend === "down" ? "text-[var(--neg)]" : "text-[var(--text-primary)]"}`}>
          {value}
        </p>
        {change && (
          <p className={`mt-1.5 flex items-center gap-1 font-mono text-xs ${trend === "up" ? "text-[var(--pos)]" : trend === "down" ? "text-[var(--neg)]" : "text-[var(--text-tertiary)]"}`}>
            {trend === "up" && <TrendingUp className="h-3 w-3" />}
            {trend === "down" && <TrendingDown className="h-3 w-3" />}
            {change}
          </p>
        )}
      </div>
    </motion.div>
  )
}

function SectionHead({ label, href, cta }: { label: string; href?: string; cta?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <p className="meta">{label}</p>
      {href && (
        <Link href={href} className="link-premium flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
          {cta ?? "View all"} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  )
}

function WatchlistPanel({ items }: { items: WatchlistView[] }) {
  if (items.length === 0) {
    return (
      <div className="bento-card relative flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="pointer-events-none absolute -inset-24 opacity-40" style={{ background: 'radial-gradient(circle at 50% 50%, var(--gold-glow-strong), transparent 60%)' }} />
        <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--gold-glow)] text-[var(--gold)]">
          <Eye className="h-6 w-6" />
        </div>
        <p className="heading-sm">Your watchlist is empty</p>
        <p className="body-sm mt-2 mb-6 max-w-xs">Start tracking the symbols that matter to you.</p>
        <Link href="/watchlist" className="btn btn--gold"><Plus className="h-3.5 w-3.5" /> Add stocks</Link>
      </div>
    )
  }
  return (
    <div className="bento-card h-full p-6">
      <SectionHead label="Watchlist" href="/watchlist" cta="Manage" />
      <div className="space-y-1.5">
        {items.slice(0, 5).map((item, i) => {
          const pos = item.changePercent >= 0
          return (
            <motion.div
              key={item.symbol}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.05 }}
              className="group flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-300 hover:bg-[var(--panel-2)] hover:pl-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--gold-glow)] font-mono text-xs font-bold text-[var(--gold)]">
                  {item.symbol.slice(0, 2)}
                </span>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{item.symbol}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">{item.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                  ${item.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <p className={`font-mono text-[11px] font-medium ${pos ? "text-[var(--pos)]" : "text-[var(--neg)]"}`}>
                  {pos ? "+" : ""}{item.changePercent.toFixed(2)}%
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function InsightsPanel({ analyses }: { analyses: AnalysisView[] }) {
  if (analyses.length === 0) {
    return (
      <div className="bento-card relative flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="pointer-events-none absolute -inset-24 opacity-40" style={{ background: 'radial-gradient(circle at 50% 50%, var(--gold-glow-strong), transparent 60%)' }} />
        <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--gold-glow)] text-[var(--gold)]">
          <BarChart3 className="h-6 w-6" />
        </div>
        <p className="heading-sm">No AI insights yet</p>
        <p className="body-sm mt-2 mb-6 max-w-xs">Run analysis on any stock to surface signals here.</p>
        <Link href="/markets" className="btn btn--gold"><BarChart3 className="h-3.5 w-3.5" /> Analyze a stock</Link>
      </div>
    )
  }
  return (
    <div className="bento-card h-full p-6">
      <SectionHead label="AI Insights" href="/saved-analysis" cta="Library" />
      <div className="space-y-1.5">
        {analyses.slice(0, 4).map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.25 + i * 0.05 }}
            className="group rounded-xl px-3 py-2.5 transition-all duration-300 hover:bg-[var(--panel-2)] hover:pl-5"
          >
            <div className="flex items-center gap-3">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg font-mono text-[10px] font-bold ${
                a.direction === "bullish" ? "bg-[var(--pos-glow)] text-[var(--pos)]" :
                a.direction === "bearish" ? "bg-[var(--neg-glow)] text-[var(--neg)]" : "bg-[var(--gold-glow)] text-[var(--gold)]"
              }`}>
                {a.symbol.slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{a.symbol}</span>
                  <span className="meta">{a.kind}</span>
                  {a.confidence != null && <span className="badge text-[10px]">{Math.round(a.confidence * 100)}%</span>}
                </div>
                {a.summary && <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">{a.summary}</p>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ActivityPanel({ notifications }: { notifications: NotifView[] }) {
  if (notifications.length === 0) {
    return (
      <div className="bento-card relative flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="pointer-events-none absolute -inset-24 opacity-40" style={{ background: 'radial-gradient(circle at 50% 50%, var(--gold-glow-strong), transparent 60%)' }} />
        <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--gold-glow)] text-[var(--gold)]">
          <Search className="h-6 w-6" />
        </div>
        <p className="heading-sm">No activity yet</p>
        <p className="body-sm mt-2 max-w-xs">Search a stock or run analysis to get started.</p>
      </div>
    )
  }
  return (
    <div className="bento-card h-full p-6">
      <SectionHead label="Recent Activity" href="/notifications" cta="Feed" />
      <div className="space-y-1.5">
        {notifications.slice(0, 4).map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 + i * 0.05 }}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 hover:bg-[var(--panel-2)]"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--gold-glow)] text-[var(--gold)]">
              <Activity className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">{n.title}</p>
              {n.body && <p className="truncate text-xs text-[var(--text-secondary)]">{n.body}</p>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function IndexTicker({ indices }: { indices: IndexView[] }) {
  if (indices.length === 0) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="bento-card flex items-center gap-6 overflow-x-auto px-6 py-4"
      style={{ scrollbarWidth: "none" }}
    >
      {indices.map((idx, i) => {
        const pos = idx.changePercent >= 0
        return (
          <motion.div
            key={idx.symbol}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="flex shrink-0 items-center gap-3"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--panel-2)]">
              <Layers className="h-4 w-4 text-[var(--gold)]" />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{idx.name}</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                  {idx.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`flex items-center gap-0.5 font-mono text-xs ${pos ? "text-[var(--pos)]" : "text-[var(--neg)]"}`}>
                  {pos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {pos ? "+" : ""}{idx.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </motion.div>
        )
      })}
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
      {/* FEATURED HERO — asymmetric, full-bleed editorial */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="bento-card relative overflow-hidden bento-full"
      >
        <div className="pointer-events-none absolute -inset-32 opacity-50" style={{ background: 'radial-gradient(circle at 18% 0%, var(--gold-glow-strong), transparent 55%)' }} />
        <div className="relative flex flex-col gap-8 p-8 lg:flex-row lg:items-end lg:justify-between lg:p-12">
          <div className="max-w-xl">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <p className="subheading"><span className="dot-gold" /> Dashboard</p>
              <span className="h-3 w-px bg-[var(--line-strong)]" />
              <span className="badge">{watchlist.length} Watching</span>
              <span className="badge">{analyses.length} Analyses</span>
            </div>
            <h1 className="title">
              Welcome back{name ? <>, <span className="text-gradient">{name.split(" ")[0]}</span></> : ""}.
            </h1>
            <p className="body mt-4">
              Your intelligence desk. Markets, holdings, and AI signals — composed into one view.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/markets" className="btn btn--gold"><LineChart className="h-3.5 w-3.5" /> Explore markets</Link>
              <Link href="/chat" className="btn"><Activity className="h-3.5 w-3.5" /> Ask AI</Link>
            </div>
          </div>

          {/* Featured portfolio figure */}
          <div className="shrink-0 text-right lg:pl-8">
            <p className="meta">Portfolio Value</p>
            <p className="stat-number mt-2 text-[clamp(2.5rem,5vw,3.6rem)] text-[var(--gold)]">
              {hasPortfolio
                ? `$${portfolio.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                : "—"}
            </p>
            <p className={`mt-2 flex items-center justify-end gap-1.5 font-mono text-sm ${hasPortfolio ? (portfolio.returnsPercent >= 0 ? "text-[var(--pos)]" : "text-[var(--neg)]") : "text-[var(--text-tertiary)]"}`}>
              {hasPortfolio ? (
                <>
                  {portfolio.returnsPercent >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {portfolio.returnsPercent >= 0 ? "+" : ""}{portfolio.returnsPercent.toFixed(2)}% all-time
                </>
              ) : (
                "No holdings yet"
              )}
            </p>
            <Link href="/portfolio" className="link-premium mt-3 inline-block font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              Manage portfolio <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Index ticker strip */}
      <IndexTicker indices={indices} />

      {/* KPI ROW */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Portfolio Value" value={hasPortfolio ? `$${portfolio.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"} delay={0.05} />
        <Kpi label="Total Return" value={hasPortfolio ? `${portfolio.returnsPercent >= 0 ? "+" : ""}${portfolio.returnsPercent.toFixed(2)}%` : "—"} trend={hasPortfolio ? (portfolio.returnsPercent >= 0 ? "up" : "down") : undefined} delay={0.1} />
        <Kpi label="Watching" value={String(watchlist.length)} delay={0.15} />
        <Kpi label="AI Analyses" value={String(analyses.length)} delay={0.2} />
      </div>

      {/* MARKETS IN FOCUS — stock summary, chart, AI analysis, news */}
      <MarketFocus initialSymbol={watchlist[0]?.symbol || "AAPL"} />

      {/* ASYMMETRIC BENTO — 6-col grid */}
      <div className="bento-grid bento-grid--dashboard">
        <div className="bento-wide">
          <WatchlistPanel items={watchlist} />
        </div>
        <div className="bento-half">
          <InsightsPanel analyses={analyses} />
        </div>
        <div className="bento-full">
          <ActivityPanel notifications={notifications} />
        </div>
      </div>
    </div>
  )
}
