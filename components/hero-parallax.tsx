"use client"

import { useRef, useEffect } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { Globe, Database, Shield, TrendingUp, ChevronDown } from "lucide-react"

const FEATURES = [
  { icon: Globe, label: "60+ Global Exchanges", desc: "Real-time data, one unified feed", color: "#7a9ec4" },
  { icon: Database, label: "12K+ Instruments", desc: "Stocks, ETFs, indices, crypto", color: "#c4956a" },
  { icon: Shield, label: "Portfolio Tracking", desc: "Live holdings & risk metrics", color: "#4a9e7a" },
  { icon: TrendingUp, label: "AI Trade Planning", desc: "Risk/reward with confidence scoring", color: "#c97a7a" },
]

function TiltCard({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      el.style.setProperty("--mx", `${x * 100}%`)
      el.style.setProperty("--my", `${y * 100}%`)
      const tiltY = (x - 0.5) * 6
      const tiltX = (y - 0.5) * -6
      el.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`
    }
    const onLeave = () => {
      el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)"
    }
    el.addEventListener("mousemove", onMove, { passive: true })
    el.addEventListener("mouseleave", onLeave, { passive: true })
    return () => {
      el.removeEventListener("mousemove", onMove)
      el.removeEventListener("mouseleave", onLeave)
    }
  }, [])

  return (
    <div ref={ref} className={`tilt-card ${className}`} style={style}>
      <div className="tilt-card-glow" />
      <div className="tilt-card-content">{children}</div>
    </div>
  )
}

export function HeroParallax() {
  return (
    <div className="hero-section relative z-10 flex min-h-screen w-full flex-col items-center justify-center">
      <div className="hero-orb hero-orb--1" />
      <div className="hero-orb hero-orb--2" />
      <div className="hero-orb hero-orb--3" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />

      <div className="relative z-10 flex flex-col items-center px-4">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="scene-line mb-8 origin-left"
        />

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="subheading mb-5"
        >
          AI-Powered Market Intelligence
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="display hero-title"
        >
          Lumora
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="body mt-5 text-center"
          style={{ maxWidth: 440 }}
        >
          Your window into global markets — real-time data, AI-driven clarity.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 grid grid-cols-2 gap-2.5"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <TiltCard className="glass-card rounded-xl px-4 py-3" style={{ minWidth: 170 }}>
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: `${f.color}12` }}
                  >
                    <f.icon className="h-4 w-4" style={{ color: f.color }} />
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{f.label}</span>
                    <p className="mt-0.5 text-[10px] leading-tight" style={{ color: "var(--text-tertiary)" }}>{f.desc}</p>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex gap-3"
        >
          <Link href="/sign-up" className="btn btn--gold btn--lg">
            Get started free
          </Link>
          <Link href="/markets" className="btn btn--lg">
            Explore dashboard
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <motion.p
          className="meta"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          Scroll
        </motion.p>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--text-tertiary)" }} />
        </motion.div>
      </motion.div>
    </div>
  )
}
