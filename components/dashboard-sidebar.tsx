"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import {
  Home, LayoutDashboard, LineChart, Briefcase, Eye, BarChart3,
  MessageSquare, Bell, User, LogOut, ChevronLeft,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { LumoraMark } from "@/components/lumora-mark"

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

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await authClient.signOut()
    router.push("/")
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="fixed left-5 top-5 z-40 flex h-[calc(100vh-2.5rem)] flex-col rounded-3xl glass-sidebar"
      style={{ width: open ? 232 : 76, transition: "width 0.4s var(--ease-out)" }}
    >
      <div className="flex h-full w-full flex-col py-5">
        <div className={`flex items-center gap-3 px-4 ${open ? "" : "justify-center"}`}>
          <Link href="/" className="flex items-center gap-2" aria-label="Lumora home">
            <LumoraMark className="h-8 w-8 shrink-0" />
            <AnimatePresence>
              {open && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  className="font-serif text-lg tracking-tight"
                >
                  Lumora
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          {open && (
            <button
              onClick={() => setOpen(false)}
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--panel-2)] hover:text-[var(--text-primary)]"
              aria-label="Collapse"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-300 ${
                  isActive
                    ? "bg-[var(--gold-glow)] text-[var(--gold)]"
                    : "text-[var(--text-tertiary)] hover:bg-[var(--panel-2)] hover:text-[var(--text-primary)]"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="rail-active"
                    className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full"
                    style={{ background: "var(--gold)" }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
                <item.icon className="h-[18px] w-[18px] shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <AnimatePresence>
                  {open && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>

        <button
          onClick={handleLogout}
          title="Sign out"
          className={`mt-2 mx-3 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[var(--text-tertiary)] transition-all duration-300 hover:bg-[var(--neg-glow)] hover:text-[var(--neg)] ${open ? "" : "justify-center"}`}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {open && <span className="text-sm font-medium whitespace-nowrap">Sign out</span>}
        </button>
      </div>
    </motion.aside>
  )
}
