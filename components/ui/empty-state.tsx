import type { ReactNode } from "react"
import { motion } from "motion/react"

export function EmptyState({
  title,
  description,
  action,
}: {
  icon?: never
  title: string
  description?: string
  action?: ReactNode
  tone?: never
  compact?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
    >
      <p className="font-heading text-lg font-semibold tracking-tight">{title}</p>
      {description && <p className="dm-body mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  )
}
