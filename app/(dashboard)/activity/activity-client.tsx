"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "motion/react"
import {
  Activity, Star, Briefcase, LineChart, MessageSquare, Bell,
  LogIn, User, Search, GitCompare, TrendingUp, type LucideIcon,
} from "lucide-react"

export type ActivityItem = {
  id: string; type: string; title: string; ticker?: string; href?: string; timestamp: string
}

const ICONS: Record<string, LucideIcon> = {
  portfolio: Briefcase, watchlist: Star, analysis: LineChart, chat: MessageSquare,
  notification: Bell, login: LogIn, profile: User, search: Search,
  compare: GitCompare, "trade-planner": TrendingUp,
}

function absoluteDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function timeAgo(iso: string, now: number | null): string {
  if (now == null) return absoluteDate(iso)
  const then = new Date(iso).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return absoluteDate(iso)
}

function groupItems(items: ActivityItem[], nowMs: number | null) {
  if (!nowMs) return [{ label: "Timeline", items }]
  const todayStart = new Date(nowMs).setHours(0, 0, 0, 0)
  const yesterdayStart = todayStart - 86400000
  const weekStart = todayStart - 6 * 86400000

  const today: ActivityItem[] = []
  const yesterday: ActivityItem[] = []
  const lastWeek: ActivityItem[] = []
  const earlier: ActivityItem[] = []

  for (const item of items) {
    const t = new Date(item.timestamp).getTime()
    if (t >= todayStart) today.push(item)
    else if (t >= yesterdayStart) yesterday.push(item)
    else if (t >= weekStart) lastWeek.push(item)
    else earlier.push(item)
  }

  const result = []
  if (today.length) result.push({ label: "Today", items: today })
  if (yesterday.length) result.push({ label: "Yesterday", items: yesterday })
  if (lastWeek.length) result.push({ label: "Last 7 Days", items: lastWeek })
  if (earlier.length) result.push({ label: "Earlier", items: earlier })
  return result.length ? result : [{ label: "Timeline", items }]
}

export function ActivityClient({ items }: { items: ActivityItem[] }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(id)
  }, [])

  const groups = groupItems(items, now)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <hr className="divider divider--gold" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="glass relative mb-8 flex flex-col gap-3 overflow-hidden rounded-3xl p-8 lg:p-10">
        <div className="pointer-events-none absolute -inset-24 opacity-40" style={{ background: 'radial-gradient(circle at 0% 50%, var(--gold-glow-strong), transparent 55%)' }} />
        <div className="glow-page relative">
          <p className="subheading"><span className="dot-gold" /> Activity</p>
          <h1 className="heading mt-2 text-[var(--text-primary)]">Your Recent Actions</h1>
          <p className="body mt-3 max-w-md">A live timeline of your investment research, stock analyses, portfolio updates, and chat conversations.</p>
        </div>
      </motion.div>

       {items.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="bento-card relative overflow-hidden px-8 py-14 text-center">
          <div className="pointer-events-none absolute -inset-20 opacity-40" style={{ background: 'radial-gradient(circle at 50% 0%, var(--gold-glow-strong), transparent 60%)' }} />
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--gold-glow)]"><Activity className="h-7 w-7 text-[var(--gold)]" /></div>
          <p className="heading-sm">No activity yet</p>
          <p className="body mt-2 mx-auto max-w-sm">Explore the markets, save an analysis, or update your profile to get started.</p>
          <div className="relative mt-8 grid max-w-lg gap-3 sm:grid-cols-3">
            {[
              { t: "Search a stock", d: "Browse markets & quotes", href: "/markets" },
              { t: "Run an analysis", d: "Ask Lumora AI", href: "/chat" },
              { t: "Plan a trade", d: "Use Trade Planner", href: "/trade-planner" },
            ].map((s) => (
              <Link key={s.t} href={s.href} className="glass-card sweep flex flex-col items-center gap-1 rounded-2xl p-4 text-center transition-transform hover:-translate-y-1">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{s.t}</p>
                <p className="meta">{s.d}</p>
              </Link>
            ))}
          </div>
        </motion.div>
       ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.label} className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {group.label}
              </h3>
              <div className="relative pl-6">
                <span className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-[var(--gold)] via-[var(--gold)]/40 to-transparent" />
                <ul className="space-y-3">
                  {group.items.map((item, i) => {
                    const Icon = ICONS[item.type] ?? Activity
                    const body = (
                      <div className="glass-card group flex items-center gap-4 px-5 py-3.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--gold-glow)] text-[var(--gold)]"><Icon className="h-4 w-4" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
                          <p className="meta mt-0.5 flex items-center gap-1.5">
                            {item.ticker ? <span className="font-semibold text-[var(--gold)]">{item.ticker} · </span> : null}
                            <span>{timeAgo(item.timestamp, now)}</span>
                          </p>
                        </div>
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--line-strong)]" />
                      </div>
                    )
                    return (
                      <motion.li key={item.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.4 }} className="relative">
                        <span className="absolute -left-[22px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[var(--gold)] shadow-[0_0_0_4px_var(--gold-glow)]" />
                        {item.href ? <Link href={item.href} className="block">{body}</Link> : body}
                      </motion.li>
                    )
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
