import type { ReactNode } from "react"

type Tone = "blue" | "violet" | "emerald" | "gold"

const TONES: Record<Tone, { ring: string; iconWrap: string; icon: string; blob: string }> = {
  blue: {
    ring: "ring-blue/20",
    iconWrap: "bg-blue/10",
    icon: "text-blue",
    blob: "bg-blue/10",
  },
  violet: {
    ring: "ring-violet/20",
    iconWrap: "bg-violet/10",
    icon: "text-violet",
    blob: "bg-violet/10",
  },
  emerald: {
    ring: "ring-emerald/20",
    iconWrap: "bg-emerald/10",
    icon: "text-emerald",
    blob: "bg-emerald/10",
  },
  gold: {
    ring: "ring-gold/20",
    iconWrap: "bg-gold/10",
    icon: "text-gold",
    blob: "bg-gold/10",
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
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-border/50 bg-card/40 text-center ${
        compact ? "px-5 py-10" : "px-6 py-16"
      }`}
    >
      <div className={`pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full ${t.blob} blur-3xl`} />
      <div className="relative mb-5">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${t.iconWrap} ring-1 ${t.ring}`}>
          <Icon className={`h-7 w-7 ${t.icon}`} />
        </div>
      </div>
      <p className="font-heading text-lg font-semibold tracking-tight">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
