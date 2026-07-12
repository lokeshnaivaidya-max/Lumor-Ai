"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import { LumoraMark } from "./lumora-mark"
import { AccountMenu } from "./auth/account-menu"
import { LayoutDashboard, Briefcase, Star, Bell, MessageSquare, BarChart3, FileText, Settings, TrendingUp, ChevronLeft, Sparkles } from "lucide-react"

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "Watchlist", href: "/watchlist", icon: Star },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "AI Chat", href: "/chat", icon: MessageSquare },
  { label: "Trade Planner", href: "/trade-planner", icon: TrendingUp },
  { label: "Compare", href: "/compare", icon: BarChart3 },
  { label: "Saved Analysis", href: "/saved-analysis", icon: FileText },
  { label: "Settings", href: "/profile", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.aside
      layout
      className={`relative z-30 flex h-screen flex-col border-r border-white/[0.06] bg-gradient-to-b from-background via-blue/[0.015] to-violet/[0.015] backdrop-blur-2xl transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      <div className="flex items-center gap-3 border-b border-border/20 px-4 py-4">
        <Link href="/" className="shrink-0">
          <LumoraMark className="h-7 w-7" />
        </Link>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-heading text-sm font-semibold tracking-tight"
          >
            Lumora
          </motion.span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
          const Icon = link.icon
          return (
            <Link key={link.href} href={link.href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                isActive ? "text-foreground font-medium" : "text-muted-foreground/70 hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue/[0.12] to-violet/[0.08] border border-blue/15 shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex h-4 w-4 items-center justify-center">
                <Icon className="h-4 w-4" />
              </span>
              {!collapsed && (
                <span className="relative z-10 truncate">{link.label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border/20 p-3">
        <div className={collapsed ? "flex justify-center" : ""}>
          <AccountMenu />
        </div>
      </div>

      <button onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-1/2 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft className={`h-3 w-3 transition-transform ${collapsed ? "rotate-180" : ""}`} />
      </button>
    </motion.aside>
  )
}
