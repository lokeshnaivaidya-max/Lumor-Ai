"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import type { ReactNode } from "react"

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [reducedMotion, setReducedMotion] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  if (reducedMotion) return <>{children}</>

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
    >
      {children}
    </motion.div>
  )
}
