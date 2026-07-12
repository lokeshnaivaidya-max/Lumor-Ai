"use client"

import { motion, useScroll, useTransform } from "motion/react"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { HeroGlobe } from "./hero-globe"

const tickerItems = [
  { sym: "AAPL", price: "237.45", ch: "+1.23%", up: true },
  { sym: "GOOGL", price: "172.80", ch: "+0.87%", up: true },
  { sym: "MSFT", price: "418.32", ch: "-0.42%", up: false },
  { sym: "AMZN", price: "198.15", ch: "+2.14%", up: true },
  { sym: "NVDA", price: "892.50", ch: "+4.56%", up: true },
  { sym: "TSLA", price: "248.90", ch: "-1.78%", up: false },
  { sym: "META", price: "512.60", ch: "+1.05%", up: true },
  { sym: "JPM", price: "198.30", ch: "+0.62%", up: true },
  { sym: "V", price: "275.40", ch: "+0.33%", up: true },
  { sym: "JNJ", price: "156.20", ch: "-0.18%", up: false },
  { sym: "WMT", price: "175.80", ch: "+1.42%", up: true },
  { sym: "XOM", price: "118.25", ch: "+0.55%", up: true },
  { sym: "AAPL", price: "237.45", ch: "+1.23%", up: true },
  { sym: "GOOGL", price: "172.80", ch: "+0.87%", up: true },
  { sym: "MSFT", price: "418.32", ch: "-0.42%", up: false },
]

const words = ["Every", "Market.", "Every", "Move.", "One", "Intelligence."]

export function Hero() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 100])
  const opacity = useTransform(scrollY, [0, 400], [1, 0.4])
  const scale = useTransform(scrollY, [0, 400], [1, 0.95])

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Canvas globe background */}
      <HeroGlobe />

      {/* Aurora blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-aurora absolute -top-[20%] -left-[10%] h-[60vh] w-[60vh] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.18 255 / 0.15), transparent 70%)" }} />
        <div className="animate-aurora-reverse absolute -top-[5%] -right-[10%] h-[50vh] w-[50vh] rounded-full blur-[130px]"
          style={{ background: "radial-gradient(circle, oklch(0.6 0.15 195 / 0.1), transparent 70%)" }} />
        <div className="animate-aurora-slow absolute bottom-[10%] left-[15%] h-[45vh] w-[45vh] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, oklch(0.48 0.16 280 / 0.08), transparent 70%)" }} />
      </div>

      {/* Live ticker */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="absolute top-24 left-0 right-0 overflow-hidden border-y border-black/[0.04] bg-white/30 backdrop-blur-xl"
      >
        <div className="flex animate-marquee gap-8 py-2.5">
          {tickerItems.map((item, i) => (
            <span key={i} className="flex items-center gap-2 text-sm whitespace-nowrap">
              <span className="font-semibold text-foreground">{item.sym}</span>
              <span className="font-mono tabular-nums text-muted-foreground">{item.price}</span>
              <span className={`font-mono text-xs ${item.up ? "text-emerald" : "text-neg"}`}>{item.ch}</span>
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div style={{ y, scale }} className="relative z-10 flex flex-col items-center pt-24">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue/20 bg-blue/[0.06] px-4 py-1.5 text-xs font-medium text-blue"
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
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-heading text-center text-[2.8rem] font-semibold leading-[0.9] tracking-[-0.04em] text-balance sm:text-6xl lg:text-[6.5rem]"
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 40, rotateX: -15 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.7, delay: 0.6 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={`inline-block mr-[0.05em] ${i % 2 === 1 ? "text-gradient" : ""}`}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-8 max-w-xl text-center text-lg leading-relaxed text-muted-foreground"
        >
          AI-powered global stock intelligence. Real-time data, deep analysis, and cinematic clarity.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
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
      </motion.div>
    </section>
  )
}
