"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { LumoraMark } from "./lumora-mark"
import { MagneticButton } from "./magnetic-button"
import { AccountMenu } from "./auth/account-menu"

const links = [
  { label: "Markets", href: "/markets" },
  { label: "Intelligence", href: "#intelligence" },
  { label: "Coverage", href: "#coverage" },
  { label: "Pricing", href: "#pricing" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

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
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4"
    >
      <nav
        className={`flex w-full max-w-5xl items-center justify-between rounded-full px-3 py-2.5 transition-all duration-500 ${
          scrolled
            ? "glass-strong shadow-2xl shadow-black/40"
            : "glass border-transparent"
        }`}
      >
        <Link href="/" className="group flex items-center gap-2.5 pl-2">
          <motion.span
            whileHover={{ rotate: 90, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            <LumoraMark className="h-7 w-7" />
          </motion.span>
          <span className="text-[15px] font-semibold tracking-tight">Lumora</span>
        </Link>

        <div
          className="relative hidden items-center md:flex"
          onMouseLeave={() => setHovered(null)}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onMouseEnter={() => setHovered(l.href)}
              className="relative rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {hovered === l.href && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-white/8"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <AccountMenu />
          <MagneticButton href="/markets" className="px-5 py-2.5">
            Launch Terminal
          </MagneticButton>
        </div>
      </nav>
    </motion.header>
  )
}
