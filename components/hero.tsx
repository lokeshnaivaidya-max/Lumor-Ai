"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import { ArrowUpRight, Sparkles, TrendingUp } from "lucide-react"
import { MagneticButton } from "./magnetic-button"
import { HeroOrb } from "./hero-orb"

const ease = [0.16, 1, 0.3, 1] as const

function Word({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="inline-block overflow-hidden pb-[0.06em] align-bottom">
      <motion.span
        initial={{ y: "115%" }}
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
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 160])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const orbY = useTransform(scrollYProgress, [0, 1], [0, 80])

  return (
    <section ref={ref} className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-32 pb-16">
      <motion.div style={{ y, opacity }} className="relative z-10 w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.15 }}
          className="mx-auto mb-10 flex w-fit items-center gap-2 rounded-full glass-card px-4 py-1.5 text-xs tracking-wide text-muted-foreground"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
          </span>
          Live across 60+ global exchanges
        </motion.div>

        <h1 className="font-heading text-center text-[3rem] font-semibold leading-[0.9] tracking-[-0.03em] text-balance sm:text-6xl lg:text-[7rem]">
          <span className="block">
            <Word delay={0.12}>The market,</Word>
          </span>
          <span className="mt-1 block">
            <Word delay={0.24}>
              <span className="text-gradient-aurora">illuminated</span>
            </Word>{" "}
            <Word delay={0.32}>
              <span className="font-serif text-[0.9em] italic font-normal text-foreground/85">by AI.</span>
            </Word>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.55 }}
          className="mx-auto mt-8 max-w-2xl text-center text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg"
        >
          Lumora turns real-time global market data into cinematic, AI-authored
          intelligence — bull cases, bear cases, technicals, and price targets
          in seconds.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.65 }}
          className="mt-11 flex flex-wrap items-center justify-center gap-3"
        >
          <MagneticButton href="/markets">
            Launch the terminal
            <ArrowUpRight className="h-4 w-4" />
          </MagneticButton>
          <MagneticButton href="#intelligence" variant="ghost">
            <Sparkles className="h-4 w-4 text-emerald" />
            See the AI in action
          </MagneticButton>
        </motion.div>
      </motion.div>

      <motion.div
        style={{ y: orbY }}
        initial={{ opacity: 0, scale: 0.92, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease, delay: 0.5 }}
        className="relative z-0 mt-16 w-full max-w-5xl"
      >
        <HeroOrb />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 1 }}
          className="animate-float absolute -left-3 top-6 hidden w-60 rounded-2xl glass-card p-4 sm:block"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-emerald" />
            AI Recommendation
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-heading text-2xl font-semibold tracking-tight">NVDA</span>
            <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-xs font-medium text-emerald">Buy · 87%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-emerald"
              initial={{ width: 0 }}
              animate={{ width: "87%" }}
              transition={{ duration: 1.2, delay: 1.3, ease }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 1.2 }}
          className="animate-float absolute -right-3 bottom-10 hidden w-56 rounded-2xl glass-card p-4 md:block"
          style={{ animationDelay: "-3.5s" }}
        >
          <div className="text-xs text-muted-foreground">Confidence signal</div>
          <div className="mt-2 flex items-end gap-1">
            {[38, 52, 46, 68, 60, 82, 74, 91].map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-sm"
                initial={{ height: 4 }}
                animate={{ height: h * 0.35 }}
                transition={{ duration: 0.8, delay: 1.4 + i * 0.04, ease }}
                style={{ background: "linear-gradient(to top, oklch(0.65 0.2 255 / 0.35), oklch(0.72 0.16 168))" }}
              />
            ))}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Momentum <span className="text-foreground">Strong</span>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="mt-16 flex flex-col items-center gap-2 text-[11px] tracking-[0.3em] text-muted-foreground uppercase"
      >
        <span>Scroll to explore</span>
        <motion.span
          animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="h-10 w-px origin-top bg-gradient-to-b from-foreground/60 to-transparent"
        />
      </motion.div>
    </section>
  )
}
