"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { usePathname } from "next/navigation"
import { LumoraMark } from "./lumora-mark"
import { AccountMenu } from "./auth/account-menu"

const links = [
  { label: "Terminal", href: "/markets" },
  { label: "Intelligence", href: "#intelligence" },
  { label: "Coverage", href: "#coverage" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4"
    >
      <nav className={`edge-light relative flex w-full max-w-5xl items-center justify-between rounded-full px-4 py-2.5 transition-all duration-500 ${
        scrolled ? "glass-blue shadow-2xl shadow-blue/20" : "bg-white/[0.04] backdrop-blur-xl border border-white/10"
      }`}>
        <Link href="/" className="group flex items-center gap-2.5 pl-2">
          <motion.span whileHover={{ rotate: 90, scale: 1.05 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}>
            <LumoraMark className="h-7 w-7" />
          </motion.span>
          <span className="font-heading text-[15px] font-semibold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Lumora</span>
        </Link>

        <div className="relative hidden items-center md:flex" onMouseLeave={() => setHovered(null)}>
          {links.map((l) => {
            const isActive = pathname === l.href || (l.href.startsWith("#") && pathname === "/")
            return (
              <Link key={l.href} href={l.href} onMouseEnter={() => setHovered(l.href)}
                className="relative rounded-full px-4 py-2 text-sm transition-colors"
              >
                {hovered === l.href && (
                  <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-white/10"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                {isActive && !hovered && (
                  <motion.span layoutId="nav-active" className="absolute inset-0 -z-10 rounded-full bg-blue/15 border border-blue/25"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className={isActive ? "text-blue font-medium" : "text-muted-foreground hover:text-foreground"}>
                  {l.label}
                </span>
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <AccountMenu />
          <Link
            href="/markets"
            className="premium-btn premium-btn-primary px-5 py-2.5 text-xs"
          >
            Launch Terminal
          </Link>
        </div>
      </nav>
    </motion.header>
  )
}
