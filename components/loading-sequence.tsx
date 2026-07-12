"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { LumoraMark } from "./lumora-mark"

export function LoadingSequence() {
  const [done, setDone] = useState(false)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      if (sessionStorage.getItem("lumora-loaded")) { setDone(true); setVisible(false); return }
    } catch { /* noop */ }
    const start = performance.now()
    const dur = 1900
    let raf: number
    const tick = () => {
      const elapsed = performance.now() - start
      const p = Math.min(elapsed / dur, 1)
      const eased = 1 - Math.pow(1 - p, 2.5)
      setProgress(eased)
      if (p >= 1) {
        try { sessionStorage.setItem("lumora-loaded", "true") } catch { /* noop */ }
        setTimeout(() => { setVisible(false); setTimeout(() => setDone(true), 400) }, 200)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (done) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
        >
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <LumoraMark className="h-12 w-12 text-primary animate-breathe" />
          </motion.div>
          <div className="mt-6 overflow-hidden">
            <motion.p
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs font-medium tracking-[0.35em] text-muted-foreground uppercase"
            >
              {progress < 0.5 ? "Initializing" : progress < 0.8 ? "Calibrating markets" : "Ready"}
            </motion.p>
          </div>
          <div className="mt-8 h-[2px] w-32 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-blue via-primary to-emerald" style={{ width: `${Math.max(2, progress * 100)}%` }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
