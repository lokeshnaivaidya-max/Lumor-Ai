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
      const p = Math.min((now - start) / 1800, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setCount(Math.round(eased * 100))
      if (p < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        sessionStorage.setItem("lumora-loaded", "1")
        setTimeout(() => setDone(true), 420)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{ opacity: 0, filter: "blur(14px)", scale: 1.03 }}
          transition={{ duration: 0.75, ease }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-background"
        >
          {/* single soft wash — restrained, premium */}
          <div
            className="animate-pulse-glow pointer-events-none absolute h-[55vh] w-[55vh] rounded-full blur-[120px]"
            style={{
              background:
                "radial-gradient(circle, oklch(0.55 0.14 245 / 0.4), transparent 70%)",
            }}
          />

          {/* Mark with a travelling metallic reflection */}
          <motion.div
            initial={{ scale: 0.82, opacity: 0, rotateY: -18 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ duration: 1.1, ease }}
            className="sweep sweep-auto relative rounded-xl"
          >
            <LumoraMark className="h-20 w-20" />
          </motion.div>

          {/* inscriptional wordmark reveal */}
          <div className="mt-8 flex overflow-hidden">
            {letters.map((l, i) => (
              <motion.span
                key={i}
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease, delay: 0.3 + i * 0.07 }}
                className="wordmark text-lg text-foreground/90"
              >
                {l}
              </motion.span>
            ))}
          </div>

          <div className="relative mt-8 h-px w-56 overflow-hidden bg-white/10">
            <div
              className="h-full transition-[width] duration-100"
              style={{
                width: `${count}%`,
                background:
                  "linear-gradient(90deg, oklch(0.7 0.1 245), oklch(0.85 0.07 225), oklch(0.88 0.05 88))",
              }}
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
