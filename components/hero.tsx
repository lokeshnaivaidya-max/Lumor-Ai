"use client"

import { motion, useScroll, useTransform } from "motion/react"
import Link from "next/link"
import { ArrowRight, TrendingUp, BarChart3, Globe2, Sparkles } from "lucide-react"

const words = ["Every", "Market.", "Every", "Move.", "One", "Intelligence."]

const stats = [
  { icon: Globe2, label: "Global Exchanges", value: "60+", accent: "border-blue/30 bg-blue/[0.08]" },
  { icon: TrendingUp, label: "AI Accuracy", value: "94.2%", accent: "border-emerald/30 bg-emerald/[0.08]" },
  { icon: BarChart3, label: "Instruments", value: "12K+", accent: "border-violet/30 bg-violet/[0.08]" },
]

export function Hero() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 120])
  const opacity = useTransform(scrollY, [0, 400], [1, 0.3])
  const scale = useTransform(scrollY, [0, 400], [1, 0.95])

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-28 pb-20">
      {/* Hero orb */}
      <motion.div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ y, opacity }}
      >
        <div className="relative h-[75vh] w-[75vh] min-h-[500px] min-w-[500px]">
          <div className="absolute inset-0 rounded-full bg-gradient-radial from-blue/20 via-emerald/10 to-transparent blur-[100px] animate-breathe" />
          <div className="absolute inset-[10%] rounded-full bg-gradient-radial from-violet/15 via-blue/10 to-transparent blur-[80px] animate-aurora" />
          <div className="absolute inset-[25%] rounded-full bg-gradient-radial from-cyan/10 via-transparent to-transparent blur-[60px] animate-aurora-reverse" />
        </div>
      </motion.div>

      {/* Floating stat cards */}
      <motion.div
        className="pointer-events-none absolute right-[5%] top-[20%] hidden lg:block"
        style={{ opacity }}
      >
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="glass-blue rounded-2xl px-4 py-3 shadow-2xl"
        >
          <p className="text-xs text-blue font-medium">S&P 500</p>
          <p className="text-lg font-semibold tabular-nums text-white">5,612.80</p>
          <p className="text-xs text-emerald">+1.24% today</p>
        </motion.div>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute left-[5%] top-[35%] hidden lg:block"
        style={{ opacity }}
      >
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="glass-emerald rounded-2xl px-4 py-3 shadow-2xl"
        >
          <p className="text-xs text-emerald font-medium">NASDAQ</p>
          <p className="text-lg font-semibold tabular-nums text-white">18,423.45</p>
          <p className="text-xs text-emerald">+0.87% today</p>
        </motion.div>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute right-[8%] bottom-[25%] hidden lg:block"
        style={{ opacity }}
      >
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="glass-gold rounded-2xl px-4 py-3 shadow-2xl"
        >
          <p className="text-xs text-gold font-medium">BTC/USD</p>
          <p className="text-lg font-semibold tabular-nums text-white">67,842.10</p>
          <p className="text-xs text-gold">+3.42% today</p>
        </motion.div>
      </motion.div>

      <motion.div style={{ y, scale }} className="relative z-10 w-full max-w-5xl">
        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="mx-auto mb-10 flex w-fit items-center gap-2 rounded-full glass-blue px-4 py-1.5 text-xs tracking-wide"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
          </span>
          Live across 60+ global exchanges
        </motion.div>

        {/* Animated headline */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-heading text-center text-[3rem] font-semibold leading-[0.9] tracking-[-0.03em] text-balance sm:text-6xl lg:text-[7rem]"
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 40, rotateX: -20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.7, delay: 0.5 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={`inline-block mr-[0.08em] ${
                i % 2 === 1 ? "text-gradient-aurora" : "text-white"
              }`}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-8 max-w-2xl text-center text-lg leading-relaxed text-white/60 sm:text-xl"
        >
          AI-powered global stock intelligence. Real-time data, deep analysis, and
          cinematic clarity across every major exchange.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/markets"
            className="premium-btn premium-btn-primary group px-8 py-3.5 text-sm"
          >
            <Sparkles className="h-4 w-4" />
            Launch Terminal
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/sign-up"
            className="premium-btn premium-btn-ghost px-8 py-3.5 text-sm"
          >
            Get Started Free
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 flex flex-wrap items-center justify-center gap-4"
        >
          {stats.map((s) => (
            <div key={s.label} className={`flex items-center gap-3 rounded-2xl border px-5 py-3 ${s.accent}`}>
              <s.icon className="h-5 w-5 text-white/70" />
              <div>
                <p className="text-xs text-white/50">{s.label}</p>
                <p className="text-lg font-semibold tabular-nums text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
