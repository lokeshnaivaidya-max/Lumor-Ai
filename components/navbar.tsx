"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "motion/react"
import { LumoraMark } from "./lumora-mark"
import { AccountMenu } from "./auth/account-menu"
import { Menu, X, Moon, Sun } from "lucide-react"

const links = [
  { label: "Intelligence", href: "#intelligence" },
  { label: "Coverage", href: "#coverage" },
  { label: "Markets", href: "/markets" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(false)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 300, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 300, damping: 20 })
  const logoX = useTransform(springX, [-1, 1], [-10, 10])
  const logoY = useTransform(springY, [-1, 1], [-10, 10])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

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
        className={`relative flex w-full max-w-5xl items-center justify-between rounded-full px-4 py-2.5 transition-all duration-500 ${
          scrolled ? "glass-strong" : "border border-white/50 bg-white/40 backdrop-blur-xl"
        }`}
      >
        <Link
          href="/"
          className="group relative flex items-center gap-2.5 pl-2"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            mouseX.set(((e.clientX - rect.left) / rect.width) * 2 - 1)
            mouseY.set(((e.clientY - rect.top) / rect.height) * 2 - 1)
          }}
          onMouseLeave={() => { mouseX.set(0); mouseY.set(0) }}
        >
          <motion.span style={{ x: logoX, y: logoY }} className="transform-gpu">
            <LumoraMark className="h-7 w-7" />
          </motion.span>
          <span className="font-heading text-[15px] font-semibold tracking-tight">Lumora</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => handleNavClick(l.href)}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={() => setDark((d) => !d)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <AccountMenu />
          <Link href="/sign-up" className="premium-btn premium-btn-primary px-5 py-2.5 text-xs">
            Get Started
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground md:hidden"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="glass-strong absolute left-0 right-0 top-full mt-3 overflow-hidden rounded-2xl p-3 shadow-2xl"
            >
              <div className="flex flex-col gap-1">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => handleNavClick(l.href)}
                    className="rounded-xl px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="my-2 h-px bg-border/50" />
                <div className="flex items-center gap-2 px-4 py-2">
                  <button
                    onClick={() => setDark((d) => !d)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/5"
                    aria-label="Toggle theme"
                  >
                    {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </button>
                  <AccountMenu />
                  <Link
                    href="/sign-up"
                    className="premium-btn premium-btn-primary flex-1 px-4 py-2.5 text-center text-xs"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  )
}
