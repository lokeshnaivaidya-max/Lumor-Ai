"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { motion } from "motion/react"

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
        <h1 className="display" style={{ marginBottom: "1.5rem" }}>
          Lumora
        </h1>
      </div>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="body text-center"
        style={{ maxWidth: 400, margin: "0 auto" }}
      >
        Market Intelligence.
        <br />
        <span style={{ color: "var(--gold)" }}>Without the Noise.</span>
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 flex gap-3"
      >
        <Link href="/sign-up" className="btn btn--gold">Get started</Link>
        <Link href="/markets" className="btn">Explore markets</Link>
      </motion.div>
    </div>
  )
}
