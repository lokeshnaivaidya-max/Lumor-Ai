"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring } from "motion/react"

export function CursorGlow() {
  const x = useMotionValue(-500)
  const y = useMotionValue(-500)
  const sx = useSpring(x, { stiffness: 120, damping: 20, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 120, damping: 20, mass: 0.4 })
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    // Only enable on fine pointers (desktop)
    if (!window.matchMedia("(pointer: fine)").matches) return
    setEnabled(true)
    const move = (e: MouseEvent) => {
      x.set(e.clientX - 250)
      y.set(e.clientY - 250)
    }
    window.addEventListener("mousemove", move)
    return () => window.removeEventListener("mousemove", move)
  }, [x, y])

  if (!enabled) return null

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed z-30 h-[500px] w-[500px] rounded-full"
      style={{
        x: sx,
        y: sy,
        background:
          "radial-gradient(circle, oklch(0.68 0.17 245 / 0.1), transparent 60%)",
        mixBlendMode: "screen",
      }}
    />
  )
}
