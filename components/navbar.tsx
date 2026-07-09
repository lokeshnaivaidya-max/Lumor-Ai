"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { LumoraMark } from "./lumora-mark"
import { MagneticButton } from "./magnetic-button"

const links = [
  { label: "Markets", href: "/markets" },
  { label: "Intelligence", href: "#intelligence" },
  { label: "Coverage", href: "#coverage" },
  { label: "Pricing", href: "#pricing" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4"
    >
      <nav
        className={`flex w-full max-w-6xl items-center justify-between rounded-full px-4 py-2.5 transition-all duration-500 ${
          scrolled ? "glass-strong shadow-2xl shadow-black/40" : "border border-transparent"
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5 pl-2">
          <LumoraMark className="h-7 w-7" />
          <span className="text-lg font-semibold tracking-tight">Lumora</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/markets"
            className="hidden rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Sign in
          </Link>
          <MagneticButton href="/markets" className="px-5 py-2.5">
            Launch Terminal
          </MagneticButton>
        </div>
      </nav>
    </motion.header>
  )
}
