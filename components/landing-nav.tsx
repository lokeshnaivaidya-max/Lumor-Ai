"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown, ExternalLink, Mail } from "lucide-react"

const LINKS = [
  { label: "Markets", href: "/markets" },
  { label: "Intelligence", href: "#offerings" },
  { label: "Coverage", href: "#reach" },
]

export function LandingNav() {
  const [infoOpen, setInfoOpen] = useState(false)
  const infoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setInfoOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-1/2 top-4 z-50 -translate-x-1/2"
    >
      <nav className="glass-nav flex items-center gap-6 rounded-full px-2 py-1.5 shadow-2xl">
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

        <div className="relative" ref={infoRef}>
          <button
            onClick={() => setInfoOpen(!infoOpen)}
            className="btn btn--ghost btn--sm"
          >
            <span className="text-xs">Info</span>
            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${infoOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {infoOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border p-4 shadow-2xl"
                style={{ background: "var(--depth-overlay)", borderColor: "var(--glass-border)" }}
              >
                <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Designed &amp; developed by Lokesh</p>
                <a
                  href="mailto:lumora.verify@gmail.com"
                  className="mt-2 flex items-center gap-1.5 text-xs transition-colors"
                  style={{ color: "var(--gold)" }}
                >
                  <Mail className="h-3 w-3" />
                  lumora.verify@gmail.com
                </a>
                <p className="mt-2 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  AI-powered global stock intelligence platform.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link href="/sign-up" className="btn btn--gold btn--sm">
          Get started
        </Link>
      </nav>
    </motion.header>
  )
}
