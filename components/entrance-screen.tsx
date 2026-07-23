"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import Image from "next/image"

export function EntranceScreen() {
  const [show, setShow] = useState(true)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState("Initializing Lumora AI Engine…")

  useEffect(() => {
    const seen = sessionStorage.getItem("lumora-entrance")
    if (seen) {
      setShow(false)
      return
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setShow(false)
            sessionStorage.setItem("lumora-entrance", "1")
          }, 300)
          return 100
        }
        const next = prev + Math.floor(Math.random() * 18) + 12
        if (next > 30 && next < 70) {
          setStatusText("Connecting Global Market Feeds…")
        } else if (next >= 70) {
          setStatusText("Calibrating Institutional Analytics…")
        }
        return next > 100 ? 100 : next
      })
    }, 180)

    return () => clearInterval(interval)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[var(--bg)] px-6 backdrop-blur-2xl"
        >
          {/* Subtle Ambient Light Orb */}
          <div className="pointer-events-none absolute h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-[#38bdf8]/10 via-[#34d399]/10 to-[#fb7185]/10 blur-3xl opacity-60" />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center text-center max-w-sm"
          >
            {/* Logo Glass Emblem */}
            <div className="relative flex h-28 w-28 md:h-32 md:w-32 items-center justify-center overflow-hidden rounded-2xl border border-white/20 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 p-3 shadow-2xl backdrop-blur-xl">
              <motion.div
                animate={{ scale: [0.98, 1.02, 0.98] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative h-full w-full"
              >
                <Image
                  src="/lumora-logo.png"
                  alt="Lumora AI Logo"
                  fill
                  className="object-contain p-1 drop-shadow-md"
                  priority
                />
              </motion.div>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="font-serif text-3xl font-bold tracking-tight text-[var(--text-primary)] mt-6 md:text-4xl"
            >
              LUMOR<span className="bg-gradient-to-r from-[#38bdf8] via-[#34d399] to-[#fb7185] bg-clip-text text-transparent">A</span> <span className="text-[#3b82f6]">AI</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)] mt-2"
            >
              Global Market Intelligence &amp; AI Workspace
            </motion.p>

            {/* Progress Container */}
            <div className="mt-8 w-full max-w-xs space-y-2">
              <div className="flex justify-between items-center text-[11px] font-mono font-medium text-[var(--text-tertiary)] px-0.5">
                <span>{statusText}</span>
                <span className="text-[#38bdf8] font-bold">{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)] p-0.5 backdrop-blur-md">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#38bdf8] via-[#34d399] to-[#fb7185]"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.2 }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


