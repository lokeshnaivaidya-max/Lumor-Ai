"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { LumoraMark } from "./lumora-mark"
import { AccountMenu } from "./auth/account-menu"
import { ThemeToggle } from "./theme-toggle"
import { useSession } from "@/lib/auth-client"

const GUEST_LINKS = [
  { label: "Markets", href: "/markets" },
  { label: "Intelligence", href: "#intelligence" },
  { label: "Coverage", href: "#coverage" },
]

const AUTH_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Markets", href: "/markets" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Watchlist", href: "/watchlist" },
]

export function Navbar() {
  const { data: session } = useSession()
  const authenticated = !!session?.user
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = authenticated ? AUTH_LINKS : GUEST_LINKS

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  const handleNavClick = (href: string) => {
    setMobileOpen(false)
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <motion.header
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        className={`relative flex w-full max-w-5xl items-center justify-between rounded-full px-3 py-2 transition-all duration-500 ${
          scrolled
            ? "bg-white/70 shadow-xs shadow-black/[0.03] backdrop-blur-md dark:bg-white/[0.04]"
            : "border border-white/40 bg-white/30 backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.02]"
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5 pl-1.5">
          <LumoraMark className="h-6 w-6" />
          <span className="font-heading text-sm font-semibold tracking-tight">Lumora</span>
        </Link>

        <div className="hidden items-center gap-0.5 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => handleNavClick(l.href)}
              className="rounded-full px-3.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <div className="hidden md:block">
            <AccountMenu />
          </div>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground md:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h12M2 8h12M2 12h12"/></svg>
            )}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 right-0 top-full mt-3 overflow-hidden rounded-2xl border border-border/40 bg-white/80 backdrop-blur-xl p-2 shadow-lg dark:bg-black/80"
            >
              <div className="flex flex-col gap-0.5">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => handleNavClick(l.href)}
                    className="rounded-xl px-3.5 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="my-1.5 h-px bg-border/50" />
                <div className="px-2 py-1">
                  <AccountMenu />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  )
}
