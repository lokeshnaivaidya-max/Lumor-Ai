"use client"

import { motion } from "motion/react"
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react"

export function FadeUp({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function FadeScale({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function SlideLeft({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function SlideRight({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function CardReveal({ children, delay = 0, index = 0 }: { children: ReactNode; delay?: number; index?: number }) {
  const dir = index % 2 === 0 ? -20 : 20
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, x: dir }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card rounded-2xl p-6"
    >
      {children}
    </motion.div>
  )
}

export function Magnetic({ children, strength = 0.3 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - (r.left + r.width / 2)) * strength
    const y = (e.clientY - (r.top + r.height / 2)) * strength
    el.style.transform = `translate(${x}px, ${y}px)`
  }
  function onLeave() {
    if (ref.current) ref.current.style.transform = "translate(0,0)"
  }
  return (
    <div ref={ref} className="magnetic inline-flex" onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  )
}

export function TextReveal({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={`line-mask ${className}`} style={{ animationDelay: `${delay}s` }}>
      <span className="animate-text-reveal">{text}</span>
    </span>
  )
}

export function Counter({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1.4,
  className = "",
  delay = 0,
}: {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      el.textContent = `${prefix}${value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / (duration * 1000))
      const eased = 1 - Math.pow(1 - p, 3)
      const v = value * eased
      el.textContent = `${prefix}${v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    const t = setTimeout(() => { raf = requestAnimationFrame(tick) }, delay * 1000)
    return () => { clearTimeout(t); cancelAnimationFrame(raf) }
  }, [value, decimals, prefix, suffix, duration, delay])
  return <span ref={ref} className={className}>{prefix}0{suffix}</span>
}

export function Stagger({ children, className = "", stagger = 0.06, baseDelay = 0 }: { children: ReactNode; className?: string; stagger?: number; baseDelay?: number }) {
  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: baseDelay + i * stagger, ease: [0.16, 1, 0.3, 1] }}
            >
              {child}
            </motion.div>
          ))
        : children}
    </div>
  )
}
