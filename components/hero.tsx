"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import { ArrowUpRight, Sparkles, TrendingUp } from "lucide-react"
import { MagneticButton } from "./magnetic-button"
import { HeroOrb } from "./hero-orb"

const ease = [0.16, 1, 0.3, 1] as const

function Word({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="inline-block overflow-hidden align-bottom">
      <motion.span
        initial={{ y: "110%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1, ease, delay }}
        className="inline-block"
      >
        {children}
      </motion.span>
    </span>
  )
}

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], [0, 160])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-32 pb-16"
    >
      <motion.div style={{ y, opacity }} className="relative z-10 w-full max-w-6xl">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.1 }}
          className="mx-auto mb-8 flex w-fit items-center gap-2 rounded-full glass px-4 py-1.5 text-xs tracking-wide text-muted-foreground"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          Live across 60+ global exchanges
        </motion.div>

        {/* Headline */}
        <h1 className="text-center text-5xl font-semibold leading-[0.95] tracking-tight text-balance sm:text-7xl lg:text-[6.5rem]">
          <span className="block">
            <Word delay={0.15}>The market,</Word>
          </span>
          <span className="block">
            <Word delay={0.28}>
              <span className="text-gradient">illuminated</span>
            </Word>{" "}
            <Word delay={0.34}>
              <span className="font-serif italic font-normal">by AI.</span>
            </Word>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.55 }}
          className="mx-auto mt-8 max-w-xl text-center text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg"
        >
          Lumora turns real-time global market data into cinematic, AI-authored
          intelligence — bull cases, bear cases, technicals, and price targets
          in seconds.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.7 }}
          className="mt-11 flex flex-wrap items-center justify-center gap-3"
        >
          <MagneticButton href="/markets">
            Launch the terminal
            <ArrowUpRight className="h-4 w-4" />
          </MagneticButton>
          <MagneticButton href="#intelligence" variant="ghost">
            <Sparkles className="h-4 w-4 text-accent" />
            See the AI in action
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* Floating orb + insight card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease, delay: 0.5 }}
        className="relative z-0 mt-16 w-full max-w-5xl"
      >
        <HeroOrb />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 1 }}
          className="animate-float absolute -left-2 top-4 hidden w-64 rounded-2xl glass-strong p-4 sm:block"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-accent" />
            AI Recommendation
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold tracking-tight">NVDA</span>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
              Buy · 87%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[87%] rounded-full bg-accent" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 1.2 }}
          className="animate-float absolute -right-2 bottom-8 hidden w-60 rounded-2xl glass-strong p-4 md:block"
          style={{ animationDelay: "-3s" }}
        >
          <div className="text-xs text-muted-foreground">Confidence signal</div>
          <div className="mt-2 flex items-end gap-1">
            {[38, 52, 46, 68, 60, 82, 74, 91].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${h * 0.4}px`,
                  background: `linear-gradient(to top, oklch(0.68 0.17 245 / 0.35), oklch(0.8 0.14 165))`,
                }}
              />
            ))}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Momentum <span className="text-foreground">Strong</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="mt-14 flex flex-col items-center gap-2 text-xs tracking-widest text-muted-foreground uppercase"
      >
        <span>Scroll to explore</span>
        <span className="h-10 w-px bg-gradient-to-b from-muted-foreground to-transparent" />
      </motion.div>
    </section>
  )
}
