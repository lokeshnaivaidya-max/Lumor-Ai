"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "motion/react"
import {
  Home, LayoutDashboard, LineChart, Briefcase, Eye, BarChart3,
  MessageSquare, Bell, User, LogOut,
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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.035, delayChildren: 0.15 } as any },
}
const itemAnim = { hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await authClient.signOut()
    router.push("/")
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-5 top-5 z-40 flex h-[calc(100vh-2.5rem)] w-[76px] flex-col items-center rounded-3xl glass-sidebar"
    >
      <div className="flex h-full w-full flex-col items-center py-5">
        <Link href="/" className="mb-8 flex flex-col items-center gap-1" aria-label="Lumora home">
          <LumoraMark className="h-8 w-8" />
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-[var(--gold)]">L</span>
        </Link>

        <motion.nav
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-1 flex-col items-center gap-1.5"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <motion.div key={item.href} variants={itemAnim} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="relative w-full flex justify-center">
                {isActive && (
                  <motion.span
                    layoutId="rail-active"
                    className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full"
                    style={{ background: "var(--gold)", boxShadow: "0 0 12px 2px var(--gold-glow-strong)" }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
                <Link
                  href={item.href}
                  title={item.label}
                  className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300 ${
                    isActive
                      ? "bg-[var(--gold-glow)] text-[var(--gold)]"
                      : "text-[var(--text-tertiary)] hover:bg-[var(--panel-2)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <item.icon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110" />
                </Link>
              </motion.div>
            )
          })}
        </motion.nav>

        <button
          onClick={handleLogout}
          title="Sign out"
          className="mt-2 flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--text-tertiary)] transition-all duration-300 hover:bg-[var(--neg-glow)] hover:text-[var(--neg)]"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    </motion.aside>
  )
}
