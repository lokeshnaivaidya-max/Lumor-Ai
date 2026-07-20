"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"

export function EntranceScreen() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const seen = sessionStorage.getItem("lumora-entrance")
    if (seen) {
      setShow(false)
      return
    }
    const timer = setTimeout(() => {
      setShow(false)
      sessionStorage.setItem("lumora-entrance", "1")
    }, 2400)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="entrance-screen"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <span
              className="font-serif text-6xl italic md:text-8xl"
              style={{
                background: "linear-gradient(135deg, var(--gold), var(--gold-light), #e8d5c0, var(--gold))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 60px var(--gold-glow-strong))",
              }}
            >
              Lumora
            </span>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 h-px origin-left"
              style={{ width: 120, background: "linear-gradient(90deg, transparent, var(--gold), transparent)", opacity: 0.5 }}
            />
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="meta mt-4"
              style={{ color: "var(--text-tertiary)" }}
            >
              AI · Global Markets · Clarity
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
