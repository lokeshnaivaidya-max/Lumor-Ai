"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "motion/react"
import {
  LayoutDashboard,
  Briefcase,
  Eye,
  BarChart3,
  MessageSquare,
  Bell,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  ScrollText,
} from "lucide-react"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/watchlist", label: "Watchlist", icon: Eye },
  { href: "/compare", label: "Compare", icon: BarChart3 },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/notifications", label: "Activity", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  async function handleLogout() {
    await authClient.signOut()
    router.push("/")
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed left-0 top-0 z-40 flex h-full flex-col ${
        collapsed ? "w-16" : "w-56"
      }`}
      style={{ transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <div className="flex h-full flex-col border-r" style={{ background: "var(--bg-surface)", borderColor: "var(--glass-border)" }}>
        <div className="flex items-center gap-2 border-b border-[var(--glass-border)] px-4 py-3.5">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-serif text-sm italic text-[var(--text-primary)]"
            >
              Lumora
            </motion.span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn btn--icon ml-auto"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? "sidebar-link--active" : ""}`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-[var(--glass-border)] p-2">
          <button onClick={handleLogout} className="sidebar-link w-full">
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
