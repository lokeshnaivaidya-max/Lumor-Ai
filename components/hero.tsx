"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import { MagneticButton } from "./magnetic-button"
import { HeroOrb } from "./hero-orb"
import { IconArrowUpRight, IconSpark } from "./lumora-icons"

const ease = [0.16, 1, 0.3, 1] as const

function Word({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="inline-block overflow-hidden pb-[0.06em] align-bottom">
      <motion.span
        initial={{ y: "115%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1.05, ease, delay }}
        className="inline-block"
      >
        {children}
      </motion.span>
    </span>
  )
}

const metrics = [
  { v: "60+", l: "Exchanges" },
  { v: "40k+", l: "Symbols" },
  { v: "<2s", l: "AI latency" },
]

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], [0, 140])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const orbY = useTransform(scrollYProgress, [0, 1], [0, 80])

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen items-center px-6 pt-32 pb-20"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-12 lg:gap-8">
        {/* Editorial copy — offset left */}
        <motion.div
          style={{ y, opacity }}
          className="relative z-10 text-center lg:col-span-6 lg:text-left"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
            className="mx-auto flex w-fit items-center gap-2.5 rounded-full glass px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground lg:mx-0"
          >
            <IconSpark className="h-3 w-3 text-accent" />
            Global Stock Intelligence
          </motion.div>

          <h1 className="mt-8 text-[3rem] font-semibold leading-[0.94] tracking-[-0.03em] text-balance sm:text-6xl lg:text-[5.2rem]">
            <span className="block">
              <Word delay={0.12}>The market,</Word>
            </span>
            <span className="my-1.5 block">
              <Word delay={0.24}>
                <span className="font-serif text-metallic text-[0.62em] tracking-[0.14em]">
                  ILLUMINATED
                </span>
              </Word>
            </span>
            <span className="block text-foreground/90">
              <Word delay={0.38}>by intelligence.</Word>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease, delay: 0.6 }}
            className="mx-auto mt-7 max-w-md text-base leading-relaxed text-muted-foreground text-pretty lg:mx-0"
          >
            Lumora turns real-time global market data into cinematic, AI-authored
            intelligence — bull cases, bear cases, technicals and price targets,
            in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease, delay: 0.72 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
          >
            <MagneticButton href="/markets">
              Launch the terminal
              <IconArrowUpRight className="h-4 w-4" />
            </MagneticButton>
            <MagneticButton href="#intelligence" variant="ghost">
              <IconSpark className="h-3.5 w-3.5 text-accent" />
              See the AI in action
            </MagneticButton>
          </motion.div>

          {/* Inline metrics with star separators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease, delay: 0.9 }}
            className="mt-12 flex items-center justify-center gap-5 lg:justify-start"
          >
            {metrics.map((m, i) => (
              <div key={m.l} className="flex items-center gap-5">
                {i > 0 && <IconSpark className="h-2.5 w-2.5 text-border" />}
                <div>
                  <div className="text-xl font-semibold tracking-tight text-gradient tabular-nums">
                    {m.v}
                  </div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {m.l}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Intelligence visualization — offset right */}
        <motion.div
          style={{ y: orbY }}
          initial={{ opacity: 0, scale: 0.94, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.4, ease, delay: 0.5 }}
          className="relative z-0 lg:col-span-6"
        >
          <HeroOrb />
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.7, duration: 1 }}
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
      >
        <span>Scroll</span>
        <motion.span
          animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="h-9 w-px origin-top bg-gradient-to-b from-foreground/60 to-transparent"
        />
      </motion.div>
    </section>
  )
}
