"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ThemeToggle } from "./theme-toggle"

const LINKS = [
  { label: "Markets", href: "/markets" },
  { label: "Intelligence", href: "#offerings" },
  { label: "Coverage", href: "#reach" },
]

export function LandingNav() {
  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-1/2 top-4 z-50 -translate-x-1/2"
    >
      <nav className="glass-nav flex items-center gap-4 rounded-full px-2 py-1.5">
        <Link href="/" className="flex items-center gap-2 px-3 py-1" aria-label="Lumora home">
          <span className="font-serif text-sm italic" style={{ color: "var(--text-primary)" }}>Lumora</span>
        </Link>
        <div className="flex items-center gap-0.5">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link href="/sign-up" className="btn btn--gold btn--sm">
            Get started
          </Link>
        </div>
      </nav>
    </motion.header>
  )
}
