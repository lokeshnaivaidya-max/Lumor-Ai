"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Bell, TrendingUp, Brain, Briefcase, ArrowRight, CheckCheck } from "lucide-react"

const MOCK_NOTIFICATIONS = [
  { type: "price" as const, title: "NVDA up 3.8%", description: "NVIDIA is trading at $892.50, up 3.8% today. Strong momentum.", time: "12m ago", read: false },
  { type: "price" as const, title: "TSLA down 2.1%", description: "Tesla dropped to $238.40. Support at $235 may be tested.", time: "45m ago", read: false },
  { type: "ai" as const, title: "Portfolio rebalancing suggestion", description: "Tech allocation at 68%. Consider diversifying into healthcare.", time: "2h ago", read: false },
  { type: "portfolio" as const, title: "Portfolio up 2.4% today", description: "Your portfolio gained $2,840 today, led by NVDA and MSFT.", time: "3h ago", read: true },
  { type: "ai" as const, title: "AAPL earnings next week", description: "Apple reports Q3 earnings on Jul 25. Market expects EPS of $1.52.", time: "5h ago", read: true },
  { type: "price" as const, title: "BTC breaks $68K", description: "Bitcoin surged past $68,000, up 2.15% in the last 24 hours.", time: "8h ago", read: true },
]

export function NotificationsClient() {
  const [filter, setFilter] = useState<"all" | "price" | "ai" | "portfolio">("all")
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter)
  const unreadCount = notifications.filter((n) => !n.read).length
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

  const iconMap = { price: TrendingUp, ai: Brain, portfolio: Briefcase }
  const colorMap = { price: "text-blue", ai: "text-violet", portfolio: "text-emerald" }

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Stay informed about your portfolio and market moves.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="glass flex items-center gap-1.5 rounded-full px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <CheckCheck className="h-3.5 w-3.5" />Mark all read
          </button>
        )}
      </motion.div>

      <div className="mb-6 flex gap-2">
        {(["all", "price", "ai", "portfolio"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`relative rounded-full px-4 py-2 text-sm capitalize transition-colors ${filter === f ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            {f === "all" ? "All" : f === "price" ? "Price Alerts" : f === "ai" ? "AI Alerts" : "Portfolio"}
            {f === "all" && unreadCount > 0 && <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px]">{unreadCount}</span>}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        {filtered.map((n, i) => {
          const Icon = iconMap[n.type]
          return (
            <div key={i} className={`glass-card edge-light relative rounded-2xl p-5 transition-all hover:bg-white/[0.02] ${!n.read ? "border-primary/20" : ""}`}>
              {!n.read && <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary animate-pulse-glow" />}
              <div className="flex gap-4">
                <div className={`rounded-xl bg-white/5 p-2.5 ${colorMap[n.type]}`}><Icon className="h-4 w-4" /></div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-medium">{n.title}</h3>
                    <span className="text-xs text-muted-foreground">{n.time}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.description}</p>
                  <button className="mt-2 flex items-center gap-1 text-xs text-primary transition-colors hover:text-primary/80">
                    View details <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
