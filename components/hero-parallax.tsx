"use client"

import Link from "next/link"
import { motion, useMotionValue, useSpring, useTransform } from "motion/react"
import { Globe, Database, Shield, TrendingUp, ArrowRight } from "lucide-react"

const FEATURES = [
  { icon: Globe, label: "60+ Global Exchanges", desc: "One unified real-time feed", color: "var(--info)" },
  { icon: Database, label: "12K+ Instruments", desc: "Stocks, ETFs, indices, crypto", color: "var(--gold)" },
  { icon: Shield, label: "Portfolio Tracking", desc: "Live holdings & risk metrics", color: "var(--pos)" },
  { icon: TrendingUp, label: "AI Trade Planning", desc: "Risk/reward with confidence", color: "var(--gold)" },
]

function HeroChart() {
  const pts = [40, 46, 44, 52, 49, 58, 56, 64, 62, 72, 70, 78]
  const w = 320, h = 120
  const max = Math.max(...pts), min = Math.min(...pts)
  const path = pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * w
    const y = h - ((p - min) / (max - min)) * h
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-28 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${w},${h} L0,${h} Z`} fill="url(#heroFill)" />
      <motion.path
        d={path}
        fill="none"
        stroke="var(--gold)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  )
}

export function HeroParallax() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 })

  const bgX = useTransform(smoothX, [-0.5, 0.5], [-20, 20])
  const bgY = useTransform(smoothY, [-0.5, 0.5], [-20, 20])
  const cardRotateX = useTransform(smoothY, [-0.5, 0.5], [6, -6])
  const cardRotateY = useTransform(smoothX, [-0.5, 0.5], [-6, 6])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window
    mouseX.set((clientX / innerWidth) - 0.5)
    mouseY.set((clientY / innerHeight) - 0.5)
  }

  return (
    <section
      onMouseMove={handleMouseMove}
      className="scene relative z-10 min-h-screen w-full overflow-hidden"
    >
      {/* Parallax Background Mesh */}
      <motion.div
        style={{ x: bgX, y: bgY }}
        className="pointer-events-none absolute -inset-20 z-0 opacity-40 blur-3xl"
      >
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-gradient-to-tr from-[#38bdf8]/30 via-[#34d399]/20 to-transparent" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-[#fb7185]/20 via-[#38bdf8]/20 to-transparent" />
      </motion.div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1320px] flex-col justify-center px-6 py-28 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12">
          {/* Left — editorial wordmark */}
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6"
            >
              <span className="subheading">AI-Powered Market Intelligence</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
              className="display leading-[0.85]"
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

          {/* Right — interactive visual with subtle 3D tilt */}
          <div className="lg:col-span-6">
            <motion.div
              style={{ rotateX: cardRotateX, rotateY: cardRotateY, transformStyle: "preserve-3d" }}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              className="relative"
            >
              <div className="glass float-card rounded-[28px] p-6 shadow-2xl backdrop-blur-xl border border-white/20 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs font-semibold" style={{ color: "var(--text-primary)" }}>AAPL</p>
                    <p className="meta mt-0.5">Apple Inc.</p>
                  </div>
                  <span className="chip chip-pos">+1.84%</span>
                </div>
                <div className="mt-4"><HeroChart /></div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 rounded-xl bg-[var(--panel-2)] px-3 py-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--gold-glow)] text-[var(--gold)]"><TrendingUp className="h-3.5 w-3.5" /></span>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Confidence</p>
                      <p className="text-sm font-semibold" style={{ color: "var(--pos)" }}>78%</p>
                    </div>
                  </div>
                  <Link href="/chat?symbol=AAPL" className="link-premium font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--gold)" }}>Ask AI <ArrowRight className="inline h-3 w-3" /></Link>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {FEATURES.slice(0, 2).map((f, i) => (
                  <motion.div key={f.label} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.5 + i * 0.08, ease: [0.16, 1, 0.3, 1] }} className="bento-card flex items-center gap-3 px-4 py-3.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--bg-alt)", border: "1px solid var(--line)" }}>
                      <f.icon className="h-4 w-4" style={{ color: f.color }} />
                    </span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{f.label}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
