"use client"

import { useRef } from "react"
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react"
import {
  IconPrism,
  IconGlobe,
  IconChart,
  IconNews,
  IconPulse,
  IconShield,
} from "./lumora-icons"
import { Reveal } from "./reveal"
import { StarDivider } from "./brand"

const cards = [
  {
    icon: IconPrism,
    title: "AI research desk",
    body: "Bull case, bear case, technicals, fundamentals, and a price target — authored on demand for any ticker.",
    className: "md:col-span-3 md:row-span-2",
    feature: true,
    hue: 245,
  },
  {
    icon: IconGlobe,
    title: "60+ exchanges",
    body: "NYSE, Nasdaq, LSE, TSE, HKEX, NSE and more. Auto-detected currency, timezone and session.",
    className: "md:col-span-3",
    hue: 205,
  },
  {
    icon: IconChart,
    title: "Deep technicals",
    body: "RSI, MACD, EMA, VWAP, ATR, ADX, Bollinger, Ichimoku, Fibonacci — computed live.",
    className: "md:col-span-2",
    hue: 168,
  },
  {
    icon: IconNews,
    title: "News, summarized",
    body: "Real headlines distilled with sentiment scoring.",
    className: "md:col-span-2",
    hue: 245,
  },
  {
    icon: IconPulse,
    title: "Market status",
    body: "Open, pre-market, after-hours, or holiday — with a live countdown.",
    className: "md:col-span-2",
    hue: 205,
  },
  {
    icon: IconShield,
    title: "Risk lens",
    body: "Volatility, drawdown and exposure signals surfaced before you act.",
    className: "md:col-span-6",
    hue: 88,
  },
]

function TiltCard({ card, index }: { card: (typeof cards)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const glowX = useMotionValue(50)
  const glowY = useMotionValue(50)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 150, damping: 20 })
  const sry = useSpring(ry, { stiffness: 150, damping: 20 })

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    glowX.set(px * 100)
    glowY.set(py * 100)
    rx.set((0.5 - py) * 6)
    ry.set((px - 0.5) * 6)
  }
  const reset = () => {
    rx.set(0)
    ry.set(0)
    glowX.set(50)
    glowY.set(50)
  }

  const Icon = card.icon
  const glow = useMotionTemplate`radial-gradient(340px circle at ${glowX}% ${glowY}%, oklch(0.8 0.1 ${card.hue} / 0.14), transparent 60%)`

  return (
    <Reveal delay={index * 0.06} className={card.className}>
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={reset}
        style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" }}
        className="group relative flex h-full flex-col overflow-hidden facet-panel p-6 transition-colors duration-500 hover:border-white/15"
      >
        {/* cursor-follow glow */}
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: glow }}
        />
        <div
          className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]"
          style={{ transform: "translateZ(30px)" }}
        >
          <Icon className="h-5 w-5" style={{ color: `oklch(0.84 0.1 ${card.hue})` }} />
        </div>
        <h3 className="relative mt-5 text-lg font-medium tracking-tight" style={{ transform: "translateZ(20px)" }}>
          {card.title}
        </h3>
        <p className="relative mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {card.body}
        </p>

        {card.feature && (
          <div className="relative mt-auto pt-6" style={{ transform: "translateZ(15px)" }}>
            <div className="rounded-2xl border border-white/8 bg-[oklch(0.16_0.014_258)] p-4 font-mono text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                lumora · analyze AAPL
              </div>
              <p className="mt-3 leading-relaxed text-foreground/80">
                <span className="text-accent">Recommendation:</span> Buy · confidence 84%
                <br />
                <span className="text-muted-foreground">
                  Momentum constructive above the 50-day EMA; RSI 61 leaves room
                  before overbought…
                </span>
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </Reveal>
  )
}

export function Features() {
  return (
    <section id="intelligence" className="relative px-6 py-28 sm:py-36" style={{ perspective: 1200 }}>
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="flex items-center gap-3 font-mono text-xs tracking-[0.3em] text-accent uppercase">
            <StarDivider className="w-10" />
            The intelligence layer
          </div>
          <h2 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Everything a desk of analysts does,{" "}
            <span className="font-serif italic font-normal text-metallic">
              in one breath.
            </span>
          </h2>
        </Reveal>

        <div className="mt-14 grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 md:grid-cols-6">
          {cards.map((c, i) => (
            <TiltCard key={c.title} card={c} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
