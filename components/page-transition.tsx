"use client"

import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import type { ReactNode } from "react"

const DURATION = 0.5
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const variants = {
  initial: { opacity: 0, y: 12, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(4px)" },
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: DURATION, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
