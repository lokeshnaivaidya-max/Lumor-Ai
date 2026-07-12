"use client"

import { motion, useScroll, useTransform } from "motion/react"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { HeroGlobe } from "./hero-globe"
import type { Quote } from "@/lib/market"

const words = ["Every", "Market.", "Every", "Move.", "One", "Intelligence."]

export function Hero({ quotes = [] }: { quotes?: Quote[] }) {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 100])
  const scale = useTransform(scrollY, [0, 400], [1, 0.95])

  const tickerItems = quotes.length > 0
    ? quotes.slice(0, 12).map((q) => ({
        sym: q.symbol,
        price: q.price.toFixed(2),
        ch: `${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%`,
        up: q.changePercent >= 0,
      }))
    : [
        { sym: "AAPL", price: "—", ch: "—", up: true },
        { sym: "GOOGL", price: "—", ch: "—", up: true },
        { sym: "MSFT", price: "—", ch: "—", up: true },
      ]

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      <HeroGlobe />

      <div className="pointer-events-none absolute inset-0 aurora-gradient opacity-40" style={{ zIndex: -1 }} />

      <div className="pointer-events-none absolute inset-0" style={{ zIndex: -1, background: "radial-gradient(ellipse 80% 60% at 50% 40%, transparent 40%, var(--background) 100%)" }} />

      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-0 right-0 top-16 z-10 overflow-hidden border-b border-black/[0.03]"
        style={{
          background: "linear-gradient(180deg, oklch(0.99 0 0 / 0.5), oklch(0.99 0 0 / 0.08))",
          backdropFilter: "blur(24px) saturate(160%)",
        }}
      >
        <div className="flex animate-marquee gap-14 py-2.5">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-3 whitespace-nowrap text-xs">
              <span className="font-semibold tracking-tight text-foreground/80">{item.sym}</span>
              <span className="font-mono tabular-nums text-[11px] tracking-tight text-muted-foreground/60">
                {item.price}
              </span>
              <span
                className={`font-mono text-[10px] font-medium tracking-tight ${item.up ? "text-emerald" : "text-neg"}`}
              >
                {item.ch}
              </span>
              <span className="text-muted-foreground/15">|</span>
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div style={{ y, scale }} className="relative z-20 flex flex-col items-center pt-24">
        <motion.div
          initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 inline-flex items-center gap-2.5 rounded-full border border-blue/15 bg-white/40 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.15em] text-blue/80"
          style={{ backdropFilter: "blur(16px)" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
          </span>
          Live across 60+ global exchanges
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="font-heading text-balance text-center text-[2.5rem] font-semibold leading-[0.85] tracking-[-0.06em] sm:text-7xl lg:text-[7rem] xl:text-[8rem]"
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 70, rotateX: -25, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
              transition={{
                duration: 1,
                delay: 0.7 + i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`mr-[0.04em] inline-block ${i % 2 === 1 ? "text-gradient" : ""}`}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24, filter: "blur(2px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 1.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-8 max-w-xl text-center text-base leading-relaxed text-muted-foreground/80 sm:text-lg"
        >
          AI-powered market intelligence for the modern investor
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.9, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex flex-wrap items-center justify-center gap-4"
        >
          <Link href="/markets" className="premium-btn premium-btn-primary group px-9 py-4 text-sm">
            <Sparkles className="h-4 w-4" />
            Launch Terminal
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link href="/sign-up" className="premium-btn premium-btn-ghost px-9 py-4 text-sm">
            Get Started
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2.8 }}
        className="absolute bottom-10 z-20 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="scroll-indicator"
        />
        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50">
          Scroll
        </span>
      </motion.div>
    </section>
  )
}
