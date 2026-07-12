"use client"

import { type ReactNode, type InputHTMLAttributes, useState, useRef } from "react"
import { motion, useInView } from "motion/react"
import type { LucideIcon } from "lucide-react"

/* ── Types ── */

type Accent = "blue" | "emerald" | "violet" | "gold" | "none"
type ColSpan = "sm" | "md" | "lg" | "full"
type RowSpan = "sm" | "md"

interface Trend {
  value: string
  up: boolean
}

interface Action {
  label: string
  onClick: () => void
}

/* ── Utility: accent → CSS class map ── */

const ACCENT_BG: Record<Accent, string> = {
  blue: "bg-blue/10",
  emerald: "bg-emerald/10",
  violet: "bg-violet/10",
  gold: "bg-gold/10",
  none: "bg-white/5",
}

const ACCENT_TEXT: Record<Accent, string> = {
  blue: "text-blue",
  emerald: "text-emerald",
  violet: "text-violet",
  gold: "text-gold",
  none: "text-muted-foreground",
}

const ACCENT_GLOW: Record<Accent, string> = {
  blue: "oklch(0.55 0.18 255 / 0.4)",
  emerald: "oklch(0.62 0.16 168 / 0.4)",
  violet: "oklch(0.48 0.16 280 / 0.4)",
  gold: "oklch(0.75 0.12 75 / 0.4)",
  none: "transparent",
}

/* ── GlowCard ── */

export function GlowCard({
  children,
  className = "",
  glow = "oklch(0.55 0.18 255 / 0.25)",
  hover = true,
}: {
  children: ReactNode
  className?: string
  glow?: string
  hover?: boolean
}) {
  return (
    <motion.div
      layout
      whileHover={hover ? { y: -4, scale: 1.005 } : undefined}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative transform-gpu ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 blur-xl transition-all duration-500 group-hover:opacity-100"
        style={{ boxShadow: `0 0 48px 8px ${glow}` }}
      />
      <div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-all duration-300 group-hover:opacity-60"
        style={{ boxShadow: `inset 0 0 20px 2px ${glow}` }}
      />
      <div className="relative glass-card rounded-2xl">{children}</div>
    </motion.div>
  )
}

/* ── BentoGrid ── */

export function BentoGrid({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`grid auto-rows-[minmax(160px,auto)] grid-cols-1 gap-4 sm:grid-cols-6 md:grid-cols-12 ${className}`}
    >
      {children}
    </div>
  )
}

/* ── BentoCard ── */

const COL_SPAN: Record<ColSpan, string> = {
  sm: "sm:col-span-2 md:col-span-3",
  md: "sm:col-span-3 md:col-span-5",
  lg: "sm:col-span-4 md:col-span-7",
  full: "sm:col-span-6 md:col-span-12",
}

const ROW_SPAN: Record<RowSpan, string> = {
  sm: "row-span-1",
  md: "row-span-2",
}

export function BentoCard({
  children,
  className = "",
  colSpan = "sm",
  rowSpan = "sm",
}: {
  children: ReactNode
  className?: string
  colSpan?: ColSpan
  rowSpan?: RowSpan
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`glass-card rounded-2xl p-5 ${COL_SPAN[colSpan]} ${ROW_SPAN[rowSpan]} ${className}`}
    >
      {children}
    </motion.div>
  )
}

/* ── PremiumStat ── */

export function PremiumStat({
  icon: Icon,
  label,
  value,
  trend,
  accent = "none",
}: {
  icon: LucideIcon
  label: string
  value: string
  trend?: Trend
  accent?: Accent
}) {
  return (
    <div className="flex items-start gap-3.5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ACCENT_BG[accent]}`}
      >
        <Icon className={`h-4.5 w-4.5 ${ACCENT_TEXT[accent]}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <div className="mt-0.5 flex items-baseline gap-2.5">
          <span className="font-heading text-xl font-semibold tracking-tight tabular-nums text-foreground">
            {value}
          </span>
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${
                trend.up ? "text-emerald" : "text-neg"
              }`}
            >
              <motion.span
                initial={{ rotate: trend.up ? -180 : 180 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block"
              >
                {trend.up ? "↑" : "↓"}
              </motion.span>
              {trend.value}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── PremiumTable ── */

export function PremiumTable({
  headers,
  children,
  className = "",
}: {
  headers: string[]
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`overflow-hidden rounded-2xl glass-card ${className}`}>
      <div className="overflow-x-auto">
        <table className="table-glass w-full">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <motion.tbody
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.035 } },
            }}
          >
            {children}
          </motion.tbody>
        </table>
      </div>
    </div>
  )
}

export function PremiumTableRow({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.tr
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.tr>
  )
}

/* ── AnimatedSection ── */

export function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        visible: { transition: { staggerChildren: 0.07, delayChildren: delay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedChild({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── EmptyState ── */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: Action
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-border/50">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
      </div>
      {action && (
        <button onClick={action.onClick} className="premium-btn premium-btn-primary mt-2">
          {action.label}
        </button>
      )}
    </motion.div>
  )
}

/* ── GlassPanel ── */

export function GlassPanel({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative rounded-2xl bg-gradient-to-b from-white/[0.55] to-white/[0.15] p-[1.5px] shadow-lg shadow-black/[0.03] backdrop-blur-2xl dark:from-white/[0.07] dark:to-white/[0.01] ${className}`}
    >
      <div className="relative h-full w-full rounded-2xl bg-gradient-to-b from-white/60 to-white/30 p-5 dark:from-white/[0.04] dark:to-white/[0.01]">
        {children}
      </div>
    </div>
  )
}

/* ── PremiumSearch ── */

export function PremiumSearch({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}: {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
}) {
  const [focused, setFocused] = useState(false)

  return (
    <motion.div
      animate={{ scale: focused ? 1.01 : 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`transform-gpu ${className}`}
    >
      <div
        className={`flex items-center gap-3 rounded-2xl glass-card px-4 py-2.5 transition-all duration-300 ${
          focused ? "ring-1 ring-blue/40 shadow-xl shadow-black/10" : ""
        }`}
      >
        <svg
          className="h-4 w-4 shrink-0 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          aria-label={placeholder}
        />
      </div>
    </motion.div>
  )
}

/* ── MetricCard ── */

export function MetricCard({
  label,
  value,
  icon: Icon,
  change,
  accent = "blue",
}: {
  label: string
  value: string
  icon?: LucideIcon
  change?: Trend
  accent?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  const isPos = change?.up ?? true

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative transform-gpu glass-card rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-${accent}/10`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1 font-heading text-2xl font-semibold tracking-tight tabular-nums text-foreground">
            {value}
          </p>
          {change && (
            <div className="mt-1.5 flex items-center gap-1">
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                  isPos ? "bg-emerald/15 text-emerald" : "bg-neg/15 text-neg"
                }`}
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={isPos ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                  />
                </svg>
              </span>
              <span
                className={`text-xs font-semibold tabular-nums ${
                  isPos ? "text-emerald" : "text-neg"
                }`}
              >
                {change.value}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              accent !== "none" ? `bg-${accent}/10` : "bg-white/5"
            }`}
          >
            <Icon
              className={`h-4.5 w-4.5 ${
                accent !== "none" ? `text-${accent}` : "text-muted-foreground"
              }`}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}
