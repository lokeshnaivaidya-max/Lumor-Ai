"use client"

import { motion, AnimatePresence } from "motion/react"
import { useTheme } from "./theme-provider"
import { Moon, Sun, Monitor } from "lucide-react"

const icons = { dark: Moon, light: Sun, system: Monitor }
const labels = { dark: "Dark", light: "Light", system: "System" }

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme()
  const Icon = icons[theme]

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/50 transition-all duration-300 hover:bg-white/5 hover:text-foreground"
      aria-label={`Theme: ${labels[theme]}. Click to switch.`}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <Icon className="h-4 w-4" />
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
