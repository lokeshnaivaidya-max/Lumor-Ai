"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "motion/react"

const LINKS = [
  { label: "Markets", href: "/markets" },
  { label: "Intelligence", href: "#offerings" },
  { label: "Coverage", href: "#reach" },
]

export function LandingNav() {
  const [visible, setVisible] = useState(true)
  const [atTop, setAtTop] = useState(true)
  const lastY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true
        requestAnimationFrame(() => {
          const y = window.scrollY
          setAtTop(y < 20)
          if (y > lastY.current && y > 100) setVisible(false)
          else setVisible(true)
          lastY.current = y
          ticking.current = false
        })
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{
        y: visible ? 0 : -120,
        opacity: atTop ? 0 : 1,
      }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ pointerEvents: atTop ? "none" as const : "auto" as const }}
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
        <Link href="/sign-up" className="btn btn--gold btn--sm">
          Get started
        </Link>
      </nav>
    </motion.header>
  )
}
