"use client"

import Link from "next/link"
import { motion } from "motion/react"
import {
  Activity,
  Star,
  Briefcase,
  LineChart,
  MessageSquare,
  Bell,
  LogIn,
  User,
  Search,
  GitCompare,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

export type ActivityItem = {
  id: string
  type: string
  title: string
  ticker?: string
  href?: string
  timestamp: string
}

const ICONS: Record<string, LucideIcon> = {
  portfolio: Briefcase,
  watchlist: Star,
  analysis: LineChart,
  chat: MessageSquare,
  notification: Bell,
  login: LogIn,
  profile: User,
  search: Search,
  compare: GitCompare,
  "trade-planner": TrendingUp,
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function ActivityClient({ items }: { items: ActivityItem[] }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <hr className="dm-rule dm-rule--gold dm-animate" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="dm-heading dm-animate">Activity</h1>
        <p className="dm-body dm-animate dm-animate--delay-1">Your recent actions across Lumora, newest first.</p>
      </motion.div>

      {items.length === 0 ? (
        <div className="dm-card dm-card--inset p-10 text-center">
          <p className="dm-body text-muted-foreground">No activity yet. Explore the markets, save an analysis, or update your profile to get started.</p>
        </div>
      ) : (
        <div className="dm-card dm-card--inset dm-animate dm-animate--delay-1">
          <ul className="divide-y divide-[var(--glass-border)]">
            {items.map((item, i) => {
              const Icon = ICONS[item.type] ?? Activity
              const body = (
                <div className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-foreground/[0.03]">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="dm-body truncate font-medium text-foreground">{item.title}</p>
                    <p className="dm-meta mt-0.5">
                      {item.ticker ? <span className="text-gold">{item.ticker} · </span> : null}
                      {timeAgo(item.timestamp)}
                    </p>
                  </div>
                </div>
              )
              return (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.4) }}
                >
                  {item.href ? (
                    <Link href={item.href} className="block">{body}</Link>
                  ) : (
                    body
                  )}
                </motion.li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
