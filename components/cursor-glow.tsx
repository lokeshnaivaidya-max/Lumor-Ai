"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring } from "motion/react"

export function CursorGlow() {
  const x = useMotionValue(-500)
  const y = useMotionValue(-500)
  const gx = useSpring(x, { stiffness: 100, damping: 18, mass: 0.5 })
  const gy = useSpring(y, { stiffness: 100, damping: 18, mass: 0.5 })
  const rx = useSpring(x, { stiffness: 450, damping: 28, mass: 0.25 })
  const ry = useSpring(y, { stiffness: 450, damping: 28, mass: 0.25 })
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return
    setEnabled(true)
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY) }
    window.addEventListener("mousemove", move, { passive: true })
    return () => window.removeEventListener("mousemove", move)
  }, [x, y])

  if (!enabled) return null

  return (
    <>
      <motion.div aria-hidden className="pointer-events-none fixed left-0 top-0 z-20 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ x: gx, y: gy, background: "radial-gradient(circle, oklch(0.65 0.2 255 / 0.1), oklch(0.6 0.18 275 / 0.05) 40%, transparent 60%)", willChange: "transform" }}
      />
      <motion.div aria-hidden className="pointer-events-none fixed left-0 top-0 z-20 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ x: rx, y: ry, willChange: "transform", background: "oklch(0.99 0 0 / 0.04)", border: "1px solid oklch(0.99 0 0 / 0.2)", boxShadow: "0 0 20px oklch(0.65 0.2 255 / 0.15), inset 0 0 20px oklch(0.99 0 0 / 0.05)" }}
      />
    </>
  )
}
