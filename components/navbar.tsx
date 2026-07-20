"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { AccountMenu } from "./auth/account-menu"
import { ThemeToggle } from "./theme-toggle"
import { useSession } from "@/lib/auth-client"

const GUEST_LINKS = [
  { label: "Markets", href: "/markets" },
  { label: "Intelligence", href: "#intelligence" },
  { label: "Reach", href: "#reach" },
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

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        className={`glass-nav flex w-full max-w-5xl items-center justify-between rounded-full px-3 py-2 transition-shadow duration-500 ${
          scrolled ? "shadow-xl" : "shadow-lg"
        }`}
      >
        <Link href="/" className="flex items-center gap-2 pl-2 group">
          <span className="font-serif text-sm italic transition-colors duration-300 group-hover:text-[var(--gold)]" style={{ color: "var(--text-primary)" }}>
            Lumora
          </span>
        </Link>

        <div className="hidden items-center gap-0.5 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link group relative">
              {l.label}
              <span className="absolute inset-x-2 bottom-0 h-px origin-right scale-x-0 bg-[var(--gold)] transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100" />
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <div className="hidden md:block">
            <AccountMenu />
          </div>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="btn btn--icon pressable md:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h12M2 8h12M2 12h12"/></svg>
            )}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="glass-dialog absolute left-0 right-0 top-full mt-3 overflow-hidden p-2"
              style={{ borderRadius: "1rem" }}
            >
              <div className="flex flex-col gap-0.5">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="nav-link rounded-lg px-3.5 py-2.5 text-sm transition-all duration-200 hover:translate-x-1"
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="divider my-1.5" />
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
