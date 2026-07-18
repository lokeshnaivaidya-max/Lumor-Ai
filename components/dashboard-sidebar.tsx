"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { LumoraMark } from "./lumora-mark"
import { AccountMenu } from "./auth/account-menu"
import { ThemeToggle } from "./theme-toggle"
import { ChevronDown, LayoutDashboard, Briefcase, Star, BarChart3, TrendingUp, MessageSquare, FileText, Bell } from "lucide-react"

const PRIMARY_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Markets", href: "/markets", icon: BarChart3 },
  { label: "Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "Watchlist", href: "/watchlist", icon: Star },
  { label: "Compare", href: "/compare", icon: BarChart3 },
]

const MORE_LINKS = [
  { label: "Trade Planner", href: "/trade-planner", icon: TrendingUp },
  { label: "AI Chat", href: "/chat", icon: MessageSquare },
  { label: "Saved Analysis", href: "/saved-analysis", icon: FileText },
  { label: "Notifications", href: "/notifications", icon: Bell },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === href
    return pathname.startsWith(href + "/") || pathname === href
  }

  return (
    <header className="dm-nav">
      <div className="dm-nav__section">
        <Link href="/" className="mr-3 flex items-center gap-2">
          <LumoraMark className="h-5 w-5" />
          <span className="font-heading text-sm font-semibold tracking-tight text-[oklch(0.91_0.01_75)]">Lumora</span>
        </Link>
        {PRIMARY_LINKS.map((link) => {
          const active = isActive(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`dm-nav__link ${active ? "dm-nav__link--active" : ""}`}
            >
              {link.label}
            </Link>
          )
        })}
        <div className="relative" ref={moreRef}>
          <button
            onClick={() => setMoreOpen((o) => !o)}
            className="dm-nav__link inline-flex items-center gap-1"
          >
            More <ChevronDown className="h-3 w-3" />
          </button>
          <AnimatePresence>
            {moreOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-[oklch(0.91_0.01_75_/_0.08)] bg-[oklch(0.073_0.008_75_/_0.95)] p-1.5 shadow-2xl backdrop-blur-2xl"
              >
                {MORE_LINKS.map((link) => {
                  const active = isActive(link.href)
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-[oklch(0.75_0.1_85_/_0.1)] text-[oklch(0.91_0.01_75)]"
                          : "text-[oklch(0.53_0.015_75)] hover:bg-[oklch(0.91_0.01_75_/_0.04)] hover:text-[oklch(0.91_0.01_75)]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="dm-nav__section">
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  )
}
