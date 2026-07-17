import type { ReactNode } from "react"
import { motion } from "motion/react"

type Tone = "blue" | "violet" | "emerald" | "gold"

const TONES: Record<Tone, { border: string; iconWrap: string; icon: string; fog: string }> = {
  blue: {
    border: "border-blue/15",
    iconWrap: "bg-blue/10",
    icon: "text-blue",
    fog: "bg-blue/[0.04]",
  },
  violet: {
    border: "border-violet/15",
    iconWrap: "bg-violet/10",
    icon: "text-violet",
    fog: "bg-violet/[0.04]",
  },
  emerald: {
    border: "border-emerald/15",
    iconWrap: "bg-emerald/10",
    icon: "text-emerald",
    fog: "bg-emerald/[0.04]",
  },
  gold: {
    border: "border-gold/15",
    iconWrap: "bg-gold/10",
    icon: "text-gold",
    fog: "bg-gold/[0.04]",
  },
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "blue",
  compact = false,
}: {
  icon: React.ElementType
  title: string
  description?: string
  action?: ReactNode
  tone?: Tone
  compact?: boolean
}) {
  const t = TONES[tone]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed ${t.border} text-center ${
        compact ? "px-5 py-10" : "px-6 py-16"
      }`}
    >
      <div className={`pointer-events-none absolute inset-0 ${t.fog} blur-3xl`} />
      <div className="relative mb-5">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${t.iconWrap} ring-1 ring-inset ring-white/10 shadow-lg shadow-black/5`}>
          <Icon className={`h-7 w-7 ${t.icon}`} />
        </div>
      </div>
      <p className="font-heading text-lg font-semibold tracking-tight">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  )
}
