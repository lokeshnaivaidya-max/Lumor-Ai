"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Bell, TrendingUp, Brain, Briefcase, ArrowRight, CheckCheck, Clock, Filter } from "lucide-react"

const MOCK_NOTIFICATIONS = [
  { type: "price" as const, title: "NVDA up 3.8%", description: "NVIDIA is trading at $892.50, up 3.8% today. Strong momentum.", time: "12m ago", read: false, date: "Today" },
  { type: "price" as const, title: "TSLA down 2.1%", description: "Tesla dropped to $238.40. Support at $235 may be tested.", time: "45m ago", read: false, date: "Today" },
  { type: "ai" as const, title: "Portfolio rebalancing suggestion", description: "Tech allocation at 68%. Consider diversifying into healthcare.", time: "2h ago", read: false, date: "Today" },
  { type: "portfolio" as const, title: "Portfolio up 2.4% today", description: "Your portfolio gained $2,840 today, led by NVDA and MSFT.", time: "3h ago", read: true, date: "Today" },
  { type: "ai" as const, title: "AAPL earnings next week", description: "Apple reports Q3 earnings on Jul 25. Market expects EPS of $1.52.", time: "5h ago", read: true, date: "Yesterday" },
  { type: "price" as const, title: "BTC breaks $68K", description: "Bitcoin surged past $68,000, up 2.15% in the last 24 hours.", time: "8h ago", read: true, date: "Yesterday" },
]

type FilterType = "all" | "price" | "ai" | "portfolio"

const FILTERS: { key: FilterType; label: string; icon: typeof Bell }[] = [
  { key: "all", label: "All", icon: Bell },
  { key: "price", label: "Alerts", icon: TrendingUp },
  { key: "ai", label: "Insights", icon: Brain },
  { key: "portfolio", label: "Portfolio", icon: Briefcase },
]

export function NotificationsClient() {
  const [filter, setFilter] = useState<FilterType>("all")
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter)
  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

  const markRead = (idx: number) => {
    setNotifications((prev) => prev.map((n, i) => i === idx ? { ...n, read: true } : n))
  }

  const grouped = filtered.reduce((acc, n) => {
    const date = n.date || "Other"
    if (!acc[date]) acc[date] = []
    acc[date].push(n)
    return acc
  }, {} as Record<string, typeof MOCK_NOTIFICATIONS>)

  const iconMap = { price: TrendingUp, ai: Brain, portfolio: Briefcase }
  const colorMap = { price: "text-blue", ai: "text-violet", portfolio: "text-emerald" }
  const bgMap = { price: "bg-blue/10", ai: "bg-violet/10", portfolio: "bg-emerald/10" }

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Stay informed about your portfolio and market moves.</p>
        </div>
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              onClick={markAllRead}
              className="glass-card flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" />Mark all read
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.06 }}
        className="mb-6 flex gap-2"
      >
        {FILTERS.map((f) => {
          const Icon = f.icon
          const isActive = filter === f.key
          const count = f.key === "all" ? unreadCount : notifications.filter((n) => n.type === f.key && !n.read).length
          return (
            <motion.button key={f.key} onClick={() => setFilter(f.key)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className={`relative flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm transition-colors ${
                isActive ? "bg-primary/10 text-primary font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
              } ${isActive ? "" : "glass-card"}`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "opacity-100" : "opacity-60"}`} />
              {f.label}
              {count > 0 && (
                <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  isActive ? "bg-primary/20 text-primary" : "bg-white/10 text-muted-foreground"
                }`}>
                  {count}
                </span>
              )}
            </motion.button>
          )
        })}
      </motion.div>

      <AnimatePresence mode="wait">
        {filtered.length > 0 ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <div className="mb-4 flex items-center gap-3">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/40" />
                  <span className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider">{date}</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-border/40 to-transparent" />
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {items.map((n, i) => {
                      const Icon = iconMap[n.type]
                      const globalIdx = notifications.findIndex(
                        (on) => on.title === n.title && on.time === n.time && on.description === n.description
                      )
                      return (
                        <motion.div key={`${n.title}-${n.time}`}
                          layout
                          initial={{ opacity: 0, x: -20, height: 0 }}
                          animate={{ opacity: 1, x: 0, height: "auto" }}
                          exit={{ opacity: 0, x: 20, height: 0 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          onClick={() => { if (!n.read) markRead(globalIdx) }}
                          className={`relative cursor-pointer overflow-hidden rounded-2xl transition-all ${
                            !n.read
                              ? "bg-gradient-to-r from-primary/[0.05] to-transparent border border-primary/15 shadow-sm shadow-primary/5"
                              : "glass-card border border-transparent hover:border-border/30"
                          }`}
                        >
                          <div className="flex gap-4 p-5">
                            <div className={`rounded-xl ${bgMap[n.type]} p-3 ${colorMap[n.type]} shrink-0`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <h3 className={`text-sm ${!n.read ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                                  {n.title}
                                </h3>
                                <div className="flex shrink-0 items-center gap-2">
                                  <span className="text-xs text-muted-foreground/50">{n.time}</span>
                                  {!n.read && (
                                    <motion.span
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="h-2 w-2 rounded-full bg-primary shadow-sm shadow-primary/40"
                                    />
                                  )}
                                </div>
                              </div>
                              <p className={`mt-1 text-sm ${!n.read ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
                                {n.description}
                              </p>
                              <motion.button whileHover={{ x: 3 }}
                                className="mt-2 flex items-center gap-1 text-xs text-primary/70 transition-colors hover:text-primary"
                              >
                                View details <ArrowRight className="h-3 w-3" />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="mb-5 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5 ring-1 ring-border/30 shadow-xl">
              <Bell className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="font-heading text-base font-medium">All caught up!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === "all" ? "No notifications yet" : `No ${FILTERS.find(f => f.key === filter)?.label.toLowerCase()} notifications`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
