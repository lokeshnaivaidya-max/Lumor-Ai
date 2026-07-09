"use client"

import { useRef, type ReactNode } from "react"
import { motion, useMotionValue, useSpring } from "motion/react"
import Link from "next/link"

type Props = {
  children: ReactNode
  href?: string
  onClick?: () => void
  variant?: "primary" | "ghost"
  className?: string
}

export function MagneticButton({
  children,
  href,
  onClick,
  variant = "primary",
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 15 })
  const sy = useSpring(y, { stiffness: 200, damping: 15 })

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const mx = e.clientX - (rect.left + rect.width / 2)
    const my = e.clientY - (rect.top + rect.height / 2)
    x.set(mx * 0.35)
    y.set(my * 0.35)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium tracking-tight transition-colors duration-300 will-change-transform"
  const styles =
    variant === "primary"
      ? "bg-foreground text-background hover:bg-foreground/90"
      : "glass text-foreground hover:border-primary/40"

  const inner = (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      className="inline-block"
    >
      <span className={`${base} ${styles} ${className}`}>
        {variant === "primary" && (
          <span
            className="animate-shimmer pointer-events-none absolute inset-0 rounded-full opacity-40"
            style={{
              background:
                "linear-gradient(110deg, transparent 30%, oklch(0.99 0 0 / 0.4) 50%, transparent 70%)",
              backgroundSize: "200% 100%",
            }}
          />
        )}
        <span className="relative z-10 inline-flex items-center gap-2">
          {children}
        </span>
      </span>
    </motion.div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {inner}
      </Link>
    )
  }
  return (
    <button onClick={onClick} className="inline-block">
      {inner}
    </button>
  )
}
