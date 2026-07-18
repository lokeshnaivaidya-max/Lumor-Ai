"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { TrendingUp, BarChart3, Globe, Sparkles, ChevronDown } from "lucide-react"

const FEATURES = [
  { icon: Globe, label: "60+ Global Exchanges", desc: "Real-time data across 40+ countries" },
  { icon: BarChart3, label: "Portfolio Tracking", desc: "Live holdings, watchlists, and risk metrics" },
  { icon: Sparkles, label: "AI Analysis", desc: "Transparent insights with clear reasoning" },
  { icon: TrendingUp, label: "Trade Planning", desc: "Risk/reward analysis with confidence scoring" },
]

export function HeroParallax() {
  return (
    <div className="hero-section relative z-10 flex min-h-screen w-full flex-col items-center justify-center">
      {/* Floating background orbs */}
      <div className="hero-orb hero-orb--1" />
      <div className="hero-orb hero-orb--2" />
      <div className="hero-orb hero-orb--3" />

      <div className="relative z-10 flex flex-col items-center px-4">
        {/* Gold accent line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 0.4 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="scene-line mb-8 origin-left"
        />

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="subheading mb-6"
        >
          AI-Powered Market Intelligence
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="display hero-title"
        >
          Lumora
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="body mt-5 text-center"
          style={{ maxWidth: 480 }}
        >
          Your intelligent window into global markets — powered by real-time data and AI-driven analysis.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 grid grid-cols-2 gap-3"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card rounded-xl px-4 py-3.5"
              style={{ minWidth: 180 }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "rgba(212,168,83,0.1)" }}>
                  <f.icon className="h-4 w-4" style={{ color: "var(--gold)" }} />
                </div>
                <div>
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{f.label}</span>
                  <p className="text-[10px] leading-tight" style={{ color: "var(--text-tertiary)", marginTop: 1 }}>{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex gap-3"
        >
          <Link href="/sign-up" className="btn btn--gold btn--lg">
            Get started free
          </Link>
          <Link href="/markets" className="btn btn--lg">
            Explore dashboard
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <motion.p
          className="meta"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          Scroll
        </motion.p>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--text-tertiary)" }} />
        </motion.div>
      </motion.div>
    </div>
  )
}
