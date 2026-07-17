"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import type { ReactNode } from "react"

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [isReady, setIsReady] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setIsReady(true)
    const t = setTimeout(() => setLoaded(true), 100)
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener("change", onChange)
    return () => {
      clearTimeout(t)
      mq.removeEventListener("change", onChange)
    }
  }, [])

  if (reducedMotion) return <>{children}</>

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
          }}
          exit={{
            opacity: 0,
            scale: 0.98,
            transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
