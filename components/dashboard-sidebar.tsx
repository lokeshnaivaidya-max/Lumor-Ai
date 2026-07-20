"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "motion/react"
import {
  Home,
  LayoutDashboard,
  Briefcase,
  Eye,
  BarChart3,
  LineChart,
  MessageSquare,
  Bell,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/markets", label: "Markets", icon: LineChart },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/watchlist", label: "Watchlist", icon: Eye },
  { href: "/compare", label: "Compare", icon: BarChart3 },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/activity", label: "Activity", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 } as any,
  },
}

const itemAnim = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0 },
}

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
      className={`fixed left-4 top-4 z-40 flex h-[calc(100vh-2rem)] flex-col rounded-2xl float-subtle-delayed ${
        collapsed ? "w-16" : "w-56"
      }`}
      style={{ transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <div className="glass-sidebar flex h-full flex-col rounded-2xl">
        <div className="flex items-center gap-2 border-b px-4 py-3.5" style={{ borderColor: "var(--glass-border)" }}>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-serif text-sm italic"
              style={{ color: "var(--text-primary)" }}
            >
              Lumora
            </motion.span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn btn--icon ml-auto pressable"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <motion.nav
          variants={container}
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.04, delayChildren: 0.1 }}
          className="flex-1 space-y-0.5 overflow-y-auto p-2"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <motion.div key={item.href} variants={itemAnim} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                <Link
                  href={item.href}
                  className={`sidebar-link group ${isActive ? "sidebar-link--active" : ""}`}
                >
                  <item.icon className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                  {!collapsed && <span className="transition-colors duration-300">{item.label}</span>}
                  {isActive && (
                    <motion.span
                      layoutId="active-indicator"
                      className="absolute right-2 h-1.5 w-1.5 rounded-full"
                      style={{ background: "var(--gold)" }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                </Link>
              </motion.div>
            )
          })}
        </motion.nav>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border-t p-2"
          style={{ borderColor: "var(--glass-border)" }}
        >
          <button
            onClick={handleLogout}
            className="sidebar-link group w-full transition-colors duration-300 hover:bg-[rgba(201,122,122,0.06)] hover:text-[var(--rose)]"
          >
            <LogOut className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </motion.div>
      </div>
    </motion.aside>
  )
}
