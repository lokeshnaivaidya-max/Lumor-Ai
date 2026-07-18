"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { TrendingUp, BarChart3, Globe, Sparkles } from "lucide-react"

const FEATURES = [
  { icon: Globe, label: "60+ Global Exchanges" },
  { icon: BarChart3, label: "Real-time Portfolio" },
  { icon: Sparkles, label: "AI-Powered Analysis" },
  { icon: TrendingUp, label: "Smart Trade Planning" },
]

export function HeroParallax() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const onMouse = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 8
        const y = (e.clientY / window.innerHeight - 0.5) * 6
        el!.style.transform = `translate(${x}px, ${y}px)`
      })
    }
    window.addEventListener("mousemove", onMouse, { passive: true })
    return () => {
      window.removeEventListener("mousemove", onMouse)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="flex flex-col items-center" style={{ perspective: "800px" }}>
      <div ref={ref} className="text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="subheading mb-4"
        >
          AI-Powered Market Intelligence
        </motion.p>
        <h1 className="display" style={{ marginBottom: "1.5rem" }}>
          Lumora
        </h1>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="body text-center"
        style={{ maxWidth: 480, margin: "0 auto" }}
      >
        Your intelligent window into global markets — powered by real-time data and AI-driven analysis.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-10 flex flex-wrap justify-center gap-3"
      >
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.6 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card flex items-center gap-2 rounded-xl px-3.5 py-2"
          >
            <f.icon className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{f.label}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="mt-10 flex gap-3"
      >
        <Link href="/sign-up" className="btn btn--gold">Get started</Link>
        <Link href="/markets" className="btn">Explore markets</Link>
      </motion.div>
    </div>
  )
}
