"use client"

import { motion, AnimatePresence } from "motion/react"
import { useTheme } from "./theme-provider"
import { Moon, Sun, Monitor } from "lucide-react"

const ICONS = { dark: Moon, light: Sun, system: Monitor } as const

export function ThemeToggle() {
  const { theme, resolved, cycleTheme } = useTheme()
  const Icon = ICONS[theme]

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="btn btn--icon"
      aria-label={`Theme: ${theme}. Click to switch.`}
      title={`Theme: ${theme} (showing ${resolved})`}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={theme}
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
