"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { LumoraMark } from "./lumora-mark"

export function LoadingSequence() {
  const [done, setDone] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (sessionStorage.getItem("lumora-loaded")) {
      setDone(true)
      return
    }
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min((now - start) / 1600, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setCount(Math.round(eased * 100))
      if (p < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        sessionStorage.setItem("lumora-loaded", "1")
        setTimeout(() => setDone(true), 350)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{ opacity: 0, filter: "blur(12px)" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        >
          <motion.div
            animate={{ scale: [0.96, 1, 0.96], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <LumoraMark className="h-16 w-16" />
          </motion.div>
          <div className="mt-8 h-px w-48 overflow-hidden bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-[width] duration-100"
              style={{ width: `${count}%` }}
            />
          </div>
          <div className="mt-4 font-mono text-xs tracking-widest text-muted-foreground">
            LUMORA · {count.toString().padStart(3, "0")}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
