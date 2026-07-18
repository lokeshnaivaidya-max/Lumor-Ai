"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { TrendingUp, BarChart3, Globe, Sparkles } from "lucide-react"

const FEATURES = [
  { icon: Globe, label: "60+ Global Exchanges", desc: "Real-time data across 40+ countries" },
  { icon: BarChart3, label: "Portfolio Tracking", desc: "Live holdings, watchlists, and risk metrics" },
  { icon: Sparkles, label: "AI Analysis", desc: "Transparent insights with clear reasoning" },
  { icon: TrendingUp, label: "Trade Planning", desc: "Risk/reward analysis with confidence scoring" },
]

export function HeroParallax() {
  return (
    <div className="relative z-10 flex flex-col items-center">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="subheading mb-6"
      >
        AI-Powered Market Intelligence
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="display"
        style={{ textShadow: "0 0 80px rgba(212,168,83,0.08)" }}
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
        className="mt-10 grid grid-cols-2 gap-3"
      >
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card rounded-xl px-4 py-3"
            style={{ minWidth: 180 }}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "rgba(212,168,83,0.1)" }}>
                <f.icon className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{f.label}</span>
            </div>
            <p className="mt-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mt-10 flex gap-3"
      >
        <Link href="/sign-up" className="btn btn--gold btn--lg">
          Get started free
        </Link>
        <Link href="/markets" className="btn btn--lg">
          Explore dashboard
        </Link>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="h-6 w-px"
          style={{ background: "linear-gradient(180deg, transparent, var(--text-tertiary), transparent)" }}
        />
      </motion.div>
    </div>
  )
}
