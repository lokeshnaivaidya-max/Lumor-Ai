"use client"

import { useRef, type ReactNode } from "react"
import Link from "next/link"
import { motion } from "motion/react"

type Props = {
  href?: string
  onClick?: () => void
  children: ReactNode
  className?: string
  variant?: "primary" | "ghost"
}

export function MagneticButton({ href, onClick, children, className = "", variant = "primary" }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    ref.current.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`
  }

  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = "translate(0, 0)"
  }

  const base = `inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 ${
    variant === "primary"
      ? "bg-gradient-to-r from-primary to-violet text-white shadow-lg shadow-primary/25 hover:shadow-primary/40"
      : "glass text-foreground hover:bg-white/10"
  } cursor-pointer`

  const content = (
    <div ref={ref} onMouseMove={handleMouse} onMouseLeave={handleLeave}
      className={`${base} ${className}`} style={{ transition: "transform 0.15s ease-out" }}
    >
      {children}
    </div>
  )

  if (href) return <Link href={href}>{content}</Link>
  return <button onClick={onClick} type="button">{content}</button>
}
