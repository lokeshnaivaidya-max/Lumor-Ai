"use client"

import { motion, useScroll, useTransform } from "motion/react"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { HeroGlobe } from "./hero-globe"

const words = ["Every", "Market.", "Every", "Move.", "One", "Intelligence."]

export function Hero() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 100])
  const scale = useTransform(scrollY, [0, 400], [1, 0.95])

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      <HeroGlobe />

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
    </section>
  )
}
