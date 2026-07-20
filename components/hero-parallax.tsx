"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Globe, Database, Shield, TrendingUp, ArrowRight, Sparkles } from "lucide-react"

const FEATURES = [
  { icon: Globe, label: "60+ Global Exchanges", desc: "One unified real-time feed", color: "var(--info)" },
  { icon: Database, label: "12K+ Instruments", desc: "Stocks, ETFs, indices, crypto", color: "var(--gold)" },
  { icon: Shield, label: "Portfolio Tracking", desc: "Live holdings & risk metrics", color: "var(--pos)" },
  { icon: TrendingUp, label: "AI Trade Planning", desc: "Risk/reward with confidence", color: "var(--gold)" },
]

export function HeroParallax() {
  return (
    <section className="hero-section relative z-10 min-h-screen w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[820px] -translate-x-1/2" style={{ background: "radial-gradient(circle, var(--gold-glow-strong), transparent 60%)", filter: "blur(40px)", opacity: 0.5 }} />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1320px] flex-col justify-center px-6 py-28 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12">
          {/* Left — editorial wordmark */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6 flex items-center gap-3"
            >
              <span className="dot-gold" />
              <span className="subheading">AI-Powered Market Intelligence</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
              className="display hero-title leading-[0.85]"
            >
              The market,
              <br />
              <span className="text-gradient">in focus.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="body mt-6 max-w-md"
            >
              Lumora turns global market noise into a single, calm signal. Real-time data and AI analysis, composed for clarity.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-9 flex flex-wrap gap-3"
            >
              <Link href="/sign-up" className="btn btn--gold btn--lg">Get started free <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/markets" className="btn btn--lg">Explore markets</Link>
            </motion.div>
          </div>

          {/* Right — feature rail */}
          <div className="lg:col-span-5">
            <div className="flex flex-col gap-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="bento-card flex items-center gap-4 px-5 py-4"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--bg-alt)", border: "1px solid var(--line)" }}>
                    <f.icon className="h-5 w-5" style={{ color: f.color }} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{f.label}</p>
                    <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mt-1 flex items-center justify-between rounded-2xl border border-[var(--gold-line)] bg-[var(--gold-glow)] px-5 py-4"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-[var(--gold-light)]">
                  <Sparkles className="h-4 w-4" /> Ask the AI anything
                </span>
                <Link href="/chat" className="link-premium font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--gold)]">Open chat <ArrowRight className="inline h-3 w-3" /></Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
