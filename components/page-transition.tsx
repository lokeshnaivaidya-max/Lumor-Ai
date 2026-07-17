"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import type { ReactNode } from "react"

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [isReady, setIsReady] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setIsReady(true)
    const t = setTimeout(() => setLoaded(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, filter: "blur(8px)", scale: 0.98 }}
          animate={{
            opacity: 1,
            filter: "blur(0px)",
            scale: 1,
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
          }}
          exit={{
            opacity: 0,
            filter: "blur(4px)",
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
