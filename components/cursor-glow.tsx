"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring } from "motion/react"

export function CursorGlow() {
  const x = useMotionValue(-500)
  const y = useMotionValue(-500)
  // large soft halo
  const gx = useSpring(x, { stiffness: 120, damping: 20, mass: 0.4 })
  const gy = useSpring(y, { stiffness: 120, damping: 20, mass: 0.4 })
  // precise ring, snappier
  const rx = useSpring(x, { stiffness: 500, damping: 32, mass: 0.3 })
  const ry = useSpring(y, { stiffness: 500, damping: 32, mass: 0.3 })
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return
    setEnabled(true)
    const move = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    window.addEventListener("mousemove", move, { passive: true })
    return () => window.removeEventListener("mousemove", move)
  }, [x, y])

  if (!enabled) return null

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-30 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          x: gx,
          y: gy,
          background:
            "radial-gradient(circle, oklch(0.68 0.17 250 / 0.12), oklch(0.62 0.18 300 / 0.06) 40%, transparent 62%)",
          willChange: "transform",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-30 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25"
        style={{ x: rx, y: ry, willChange: "transform" }}
      />
    </>
  )
}
