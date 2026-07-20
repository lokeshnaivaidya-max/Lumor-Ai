"use client"

import { useEffect, useState, useRef, type MouseEvent } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { usePathname } from "next/navigation"
import { AccountMenu } from "./auth/account-menu"
import { ThemeToggle } from "./theme-toggle"
import { useSession } from "@/lib/auth-client"
import { LumoraMark } from "./lumora-mark"

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

function MagneticLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  const ref = useRef<HTMLAnchorElement | null>(null)
  function onMove(e: MouseEvent<HTMLAnchorElement>) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * 0.25}px, ${(e.clientY - (r.top + r.height / 2)) * 0.35}px)`
  }
  function onLeave() {
    if (ref.current) ref.current.style.transform = "translate(0,0)"
  }
  return (
    <Link
      ref={ref}
      href={href}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="nav-link magnetic relative inline-flex items-center"
      style={{ color: active ? "var(--gold)" : undefined }}
    >
      {active && (
        <motion.span
          layoutId="nav-pill"
          className="nav-pill"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative z-10">{label}</span>
    </Link>
  )
}

export function Navbar() {
  const { data: session } = useSession()
  const authenticated = !!session?.user
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  const links = authenticated ? AUTH_LINKS : GUEST_LINKS

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => { document.body.style.overflow = mobileOpen ? "hidden" : ""; return () => { document.body.style.overflow = "" } }, [mobileOpen])

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        className={`glass-nav flex w-full max-w-6xl items-center justify-between rounded-full px-3 py-2.5 transition-shadow duration-500 ${
          scrolled ? "shadow-2xl" : "shadow-lg"
        }`}
      >
        <Link href="/" className="group flex items-center gap-2.5 pl-3">
          <LumoraMark className="h-7 w-7 transition-transform duration-500 group-hover:rotate-[-8deg]" />
          <span className="font-serif text-base tracking-tight transition-colors duration-300 group-hover:text-[var(--gold)]" style={{ color: "var(--text-primary)" }}>
            Lumora
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <MagneticLink key={l.href} href={l.href} label={l.label} active={pathname === l.href} />
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <div className="hidden md:block"><AccountMenu /></div>
          <button onClick={() => setMobileOpen((o) => !o)} className="btn btn--icon pressable md:hidden" aria-label="Menu">
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
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="glass-dialog absolute left-0 right-0 top-full mt-3 overflow-hidden p-2"
              style={{ borderRadius: "1.25rem" }}
            >
              <div className="flex flex-col gap-1">
                {links.map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="nav-link rounded-xl px-4 py-3 text-sm transition-all duration-200 hover:translate-x-1">
                    {l.label}
                  </Link>
                ))}
                <div className="divider my-2" />
                <div className="px-2 py-1"><AccountMenu /></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  )
}
