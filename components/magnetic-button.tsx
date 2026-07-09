"use client"

import { useRef, type ReactNode } from "react"
import { motion, useMotionValue, useSpring } from "motion/react"
import Link from "next/link"

type Props = {
  children: ReactNode
  href?: string
  onClick?: () => void
  variant?: "primary" | "ghost" | "steel"
  className?: string
  type?: "button" | "submit"
}

export function MagneticButton({
  children,
  href,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 16 })
  const sy = useSpring(y, { stiffness: 220, damping: 16 })

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const mx = e.clientX - (rect.left + rect.width / 2)
    const my = e.clientY - (rect.top + rect.height / 2)
    x.set(mx * 0.3)
    y.set(my * 0.3)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  const base =
    "sweep sweep-hover relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium tracking-tight transition-[color,box-shadow,border-color] duration-300 will-change-transform"

  const styles = {
    // Brushed-metal light surface — reads as polished steel on the dark canvas.
    primary:
      "text-primary-foreground shadow-[0_1px_0_0_oklch(1_0_0/0.4)_inset,0_18px_40px_-16px_oklch(0.6_0.12_245/0.6)] [background:linear-gradient(150deg,oklch(0.95_0.02_228),oklch(0.78_0.05_240)_55%,oklch(0.88_0.045_226))] hover:shadow-[0_1px_0_0_oklch(1_0_0/0.55)_inset,0_22px_54px_-14px_oklch(0.62_0.14_245/0.75)]",
    // Deep steel — a darker premium fill for secondary emphasis.
    steel:
      "text-foreground shadow-[0_1px_0_0_oklch(1_0_0/0.12)_inset,0_16px_40px_-20px_oklch(0.5_0.1_250/0.7)] [background:linear-gradient(150deg,oklch(0.4_0.05_252),oklch(0.28_0.04_258))] ring-1 ring-inset ring-white/10 hover:ring-white/20",
    ghost:
      "glass text-foreground ring-1 ring-inset ring-white/10 hover:ring-primary/40 hover:text-foreground",
  }[variant]

  const inner = (
    <motion.span
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      className="inline-flex"
    >
      <span className={`${base} ${styles} ${className}`}>
        <span className="relative z-10 inline-flex items-center gap-2">
          {children}
        </span>
      </span>
    </motion.span>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {inner}
      </Link>
    )
  }
  return (
    <button type={type} onClick={onClick} className="inline-flex">
      {inner}
    </button>
  )
}
