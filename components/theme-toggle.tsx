"use client"

import { motion, AnimatePresence } from "motion/react"
import { useTheme } from "./theme-provider"
import { Moon, Sun } from "lucide-react"

const icons = { dark: Moon, light: Sun, system: Sun }
const labels = { dark: "Dark", light: "Light", system: "System" }

export function ThemeToggle() {
  const { resolved, cycleTheme } = useTheme()
  const Icon = resolved === "dark" ? Moon : Sun

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="btn btn--icon"
      aria-label={`Theme: ${resolved === "dark" ? "Dark" : "Light"}. Click to switch.`}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={resolved}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <Icon className="h-3.5 w-3.5" />
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
