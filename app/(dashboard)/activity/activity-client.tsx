"use client"

import Link from "next/link"
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
      <hr className="divider divider--gold" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="glass relative mb-8 flex flex-col gap-3 overflow-hidden rounded-3xl p-8 lg:p-10">
        <div className="pointer-events-none absolute -inset-24 opacity-40" style={{ background: 'radial-gradient(circle at 0% 50%, var(--gold-glow-strong), transparent 55%)' }} />
        <div className="glow-page relative">
          <p className="subheading"><span className="dot-gold" /> Activity</p>
          <h1 className="heading mt-2 text-[var(--text-primary)]">Your Recent Actions</h1>
          <p className="body mt-3 max-w-md">A live feed of everything you do across Lumora, newest first.</p>
        </div>
      </motion.div>

      {items.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="bento-card relative overflow-hidden px-8 py-16 text-center">
          <div className="pointer-events-none absolute -inset-20 opacity-40" style={{ background: 'radial-gradient(circle at 50% 0%, var(--gold-glow-strong), transparent 60%)' }} />
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--gold-glow)]"><Activity className="h-7 w-7 text-[var(--gold)]" /></div>
          <p className="heading-sm">No activity yet</p>
          <p className="body mt-2 mx-auto max-w-sm">Explore the markets, save an analysis, or update your profile to get started.</p>
        </motion.div>
       ) : (
        <div className="relative pl-6">
          <span className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-[var(--gold)] via-[var(--gold)]/40 to-transparent" />
          <ul className="space-y-4">
            {items.map((item, i) => {
              const Icon = ICONS[item.type] ?? Activity
              const body = (
                <div className="glass-card group flex items-center gap-4 px-5 py-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--gold-glow)] text-[var(--gold)]"><Icon className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
                    <p className="meta mt-0.5">
                      {item.ticker ? <span className="text-[var(--gold)]">{item.ticker} · </span> : null}
                      {timeAgo(item.timestamp)}
                    </p>
                  </div>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--line-strong)]" />
                </div>
              )
              return (
                <motion.li key={item.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.06, 0.5), duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="relative">
                  <span className="absolute -left-[22px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[var(--gold)] shadow-[0_0_0_4px_var(--gold-glow)]" />
                  {item.href ? <Link href={item.href} className="block">{body}</Link> : body}
                </motion.li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
