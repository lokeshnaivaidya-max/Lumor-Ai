"use client"

import Link from "next/link"
import { motion } from "motion/react"
import {
  TrendingUp, TrendingDown, Wallet, BarChart3, ArrowUpRight, ArrowDownRight,
  Plus, Bell, LineChart, ArrowRight, Star,
} from "lucide-react"
import type { PortfolioSummary, WatchlistView } from "@/lib/portfolio"

type NotifView = { id: number; type: string; title: string; body: string | null; read: boolean; createdAt: string }
type AnalysisView = { id: number; symbol: string; kind: string; summary: string | null; confidence: number | null; direction: string; createdAt: string }
type IndexView = { symbol: string; name: string; price: number; changePercent: number }

function StatCard({ icon: Icon, label, value, change, trend, className }: {
  icon: React.ElementType; label: string; value: string; change?: string;
  trend?: "up" | "down"; className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`dm-card dm-card--inset ${className || ""}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="dm-meta">{label}</p>
        <Icon className="h-4 w-4 text-[oklch(0.53_0.015_75)]" />
      </div>
      <p className={`dm-stat ${trend === "up" ? "text-[oklch(0.62_0.16_168)]" : trend === "down" ? "text-[oklch(0.55_0.22_22)]" : ""}`}>
        {value}
      </p>
      {change && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${trend === "up" ? "text-[oklch(0.62_0.16_168)]" : trend === "down" ? "text-[oklch(0.55_0.22_22)]" : "text-[oklch(0.53_0.015_75)]"}`}>
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
      <div className="flex flex-col items-start gap-3 py-4">
        <p className="dm-body" style={{ maxWidth: 260 }}>Your watchlist is empty. Start tracking symbols you care about.</p>
        <Link href="/watchlist" className="lm-btn lm-btn--gold" style={{ fontSize: "0.75rem", padding: "0.5rem 1.25rem" }}>
          Add symbols
        </Link>
      </div>
    )
  }
  return (
    <div className="space-y-1">
      {items.slice(0, 4).map((item, i) => (
        <motion.div
          key={item.symbol}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.04 * i, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-[oklch(0.91_0.01_75_/_0.03)]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold tracking-tight text-[oklch(0.53_0.015_75)]">
              {item.symbol.slice(0, 2)}
            </span>
            <div>
              <p className="text-sm font-medium text-[oklch(0.91_0.01_75)]">{item.symbol}</p>
              <p className="text-xs text-[oklch(0.53_0.015_75)]">{item.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium tabular-nums text-[oklch(0.91_0.01_75)]">${item.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${item.changePercent > 0 ? "text-[oklch(0.62_0.16_168)]" : "text-[oklch(0.55_0.22_22)]"}`}>
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
    return (
      <div className="flex flex-col items-start gap-3 py-4">
        <p className="dm-body" style={{ maxWidth: 260 }}>No saved analyses yet. Run AI analysis on any market symbol.</p>
        <Link href="/markets" className="lm-btn" style={{ fontSize: "0.75rem", padding: "0.5rem 1.25rem" }}>
          Explore markets
        </Link>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      {items.slice(0, 4).map((a, i) => {
        const dir = a.direction === "up" ? "text-[oklch(0.62_0.16_168)]" : a.direction === "down" ? "text-[oklch(0.55_0.22_22)]" : "text-[oklch(0.75_0.1_85)]"
        const bar = a.direction === "up" ? "bg-[oklch(0.62_0.16_168_/_0.1)]" : a.direction === "down" ? "bg-[oklch(0.55_0.22_22_/_0.1)]" : "bg-[oklch(0.75_0.1_85_/_0.1)]"
        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 * i, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[oklch(0.91_0.01_75_/_0.03)]"
          >
            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${bar} ${dir}`}>
              <BarChart3 className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[oklch(0.91_0.01_75)]">{a.symbol}</span>
                <span className="text-[10px] uppercase tracking-wider text-[oklch(0.53_0.015_75)]">{a.kind}</span>
              </div>
              <p className="mt-0.5 line-clamp-1 text-xs text-[oklch(0.53_0.015_75)]">{a.summary || "Analysis saved."}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function NotificationWidget({ items }: { items: NotifView[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 py-4">
        <p className="dm-body" style={{ maxWidth: 260 }}>No notifications. Alerts and AI insights will appear here.</p>
        <Link href="/notifications" className="lm-btn" style={{ fontSize: "0.75rem", padding: "0.5rem 1.25rem" }}>
          Manage alerts
        </Link>
      </div>
    )
  }
  return (
    <div className="space-y-1">
      {items.slice(0, 4).map((n, i) => (
        <motion.div
          key={n.id}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.04 * i, duration: 0.35 }}
          className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${n.read ? "" : "bg-[oklch(0.75_0.1_85_/_0.04)]"}`}
        >
          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.53_0.015_75)]" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[oklch(0.91_0.01_75)]">{n.title}</p>
            {n.body && <p className="mt-0.5 line-clamp-1 text-xs text-[oklch(0.53_0.015_75)]">{n.body}</p>}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export function DashboardClient({
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
    <>
      <div className="mb-10">
        <hr className="dm-rule dm-rule--gold dm-animate" />
        <h1 className="dm-heading dm-animate dm-animate--delay-1" style={{ marginTop: "1.25rem" }}>
          Overview
        </h1>
        <p className="dm-body dm-animate dm-animate--delay-2" style={{ marginTop: "0.5rem" }}>
          Portfolio intelligence and market summary at a glance.
        </p>
      </div>

      {hasPortfolio ? (
        <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Wallet} label="Portfolio Value" value={fmt(portfolio.value)} trend={portfolio.value >= portfolio.investment ? "up" : "down"} className="dm-animate dm-animate--delay-1" />
          <StatCard icon={TrendingUp} label="Today's P&L" value={`${portfolio.todayPnL >= 0 ? "+" : "-"}${fmt(Math.abs(portfolio.todayPnL))}`} trend={portfolio.todayPnL >= 0 ? "up" : "down"} className="dm-animate dm-animate--delay-2" />
          <StatCard icon={BarChart3} label="Total Returns" value={`${portfolio.totalReturns >= 0 ? "+" : "-"}${fmt(Math.abs(portfolio.totalReturns))}`} change={`${portfolio.returnsPercent.toFixed(2)}% all time`} trend={portfolio.totalReturns >= 0 ? "up" : "down"} className="dm-animate dm-animate--delay-3" />
          <StatCard icon={BarChart3} label="Investment" value={fmt(portfolio.investment)} className="dm-animate dm-animate--delay-4" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <div className="dm-card dm-card--inset">
            <hr className="dm-rule" style={{ marginBottom: "1rem" }} />
            <p className="dm-heading dm-heading--small" style={{ marginBottom: "0.5rem" }}>
              No portfolio yet.
            </p>
            <p className="dm-body" style={{ marginBottom: "1.5rem", maxWidth: 320 }}>
              Add your holdings to track live valuation and returns.
            </p>
            <Link href="/portfolio" className="lm-btn lm-btn--gold" style={{ fontSize: "0.8rem" }}>
              <Plus className="h-3.5 w-3.5" />Add holdings
            </Link>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="lg:col-span-4"
        >
          <div className="dm-card dm-card--inset" style={{ borderRadius: "2rem" }}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-[oklch(0.75_0.1_85)]" />
                <h2 className="dm-heading dm-heading--small">Watchlist</h2>
              </div>
              <Link href="/watchlist" className="text-xs text-[oklch(0.53_0.015_75)] hover:text-[oklch(0.91_0.01_75)] transition-colors">
                View all
              </Link>
            </div>
            <WatchlistWidget items={watchlist} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="lg:col-span-3"
        >
          <div className="dm-card dm-card--inset" style={{ borderRadius: "1.75rem" }}>
            <div className="mb-4 flex items-center gap-2">
              <LineChart className="h-4 w-4 text-[oklch(0.53_0.015_75)]" />
              <h2 className="dm-heading dm-heading--small">Indices</h2>
            </div>
            {indices.length === 0 ? (
              <p className="dm-body">Market data unavailable.</p>
            ) : (
              <div className="space-y-3">
                {indices.map((m, i) => (
                  <div key={m.symbol} className="flex items-center justify-between">
                    <span className="text-sm text-[oklch(0.91_0.01_75)]">{m.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm tabular-nums text-[oklch(0.91_0.01_75)]">{m.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                      <span className={`text-xs font-medium tabular-nums ${m.changePercent >= 0 ? "text-[oklch(0.62_0.16_168)]" : "text-[oklch(0.55_0.22_22)]"}`}>
                        {m.changePercent >= 0 ? "+" : ""}{m.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="lg:col-span-5"
        >
          <div className="dm-card dm-card--inset" style={{ borderRadius: "1.5rem" }}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[oklch(0.53_0.015_75)]" />
                <h2 className="dm-heading dm-heading--small">Notifications</h2>
              </div>
              <Link href="/notifications" className="flex items-center gap-1 text-xs text-[oklch(0.53_0.015_75)] hover:text-[oklch(0.91_0.01_75)] transition-colors">
                All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <NotificationWidget items={notifications} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
          className="lg:col-span-7"
        >
          <div className="dm-card dm-card--inset" style={{ borderRadius: "1.75rem" }}>
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[oklch(0.53_0.015_75)]" />
              <h2 className="dm-heading dm-heading--small">Saved Analysis</h2>
            </div>
            <AnalysisWidget items={analyses} />
          </div>
        </motion.div>
      </div>
    </>
  )
}
