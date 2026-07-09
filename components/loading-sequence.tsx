"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { LumoraMark } from "./lumora-mark"

const ease = [0.16, 1, 0.3, 1] as const
const letters = "LUMORA".split("")

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
      const p = Math.min((now - start) / 1900, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setCount(Math.round(eased * 100))
      if (p < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        sessionStorage.setItem("lumora-loaded", "1")
        setTimeout(() => setDone(true), 450)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{ opacity: 0, filter: "blur(16px)", scale: 1.04 }}
          transition={{ duration: 0.8, ease }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-background"
        >
          {/* soft aurora wash */}
          <div
            className="animate-pulse-glow pointer-events-none absolute h-[60vh] w-[60vh] rounded-full blur-[130px]"
            style={{ background: "radial-gradient(circle, oklch(0.55 0.2 255 / 0.4), transparent 70%)" }}
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 1.1, ease }}
            className="relative"
          >
            <motion.div
              animate={{ scale: [0.97, 1.03, 0.97], opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <LumoraMark className="h-16 w-16" />
            </motion.div>
          </motion.div>

          {/* animated wordmark */}
          <div className="mt-7 flex overflow-hidden">
            {letters.map((l, i) => (
              <motion.span
                key={i}
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease, delay: 0.3 + i * 0.06 }}
                className="text-lg font-semibold tracking-[0.4em] text-foreground/90"
              >
                {l}
              </motion.span>
            ))}
          </div>

          <div className="relative mt-8 h-px w-56 overflow-hidden bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-primary via-purple to-accent transition-[width] duration-100"
              style={{ width: `${count}%` }}
            />
          </div>
          <div className="mt-4 font-mono text-[11px] tracking-[0.35em] text-muted-foreground">
            CALIBRATING MARKETS · {count.toString().padStart(3, "0")}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
