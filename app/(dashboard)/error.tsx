"use client"

import { useEffect } from "react"
import { motion } from "motion/react"
import { AlertTriangle } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[DashboardError]", error)
  }, [error])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="bento-card relative mx-auto mt-12 max-w-md overflow-hidden px-8 py-16 text-center"
    >
      <div className="pointer-events-none absolute -inset-20 opacity-30" style={{ background: 'radial-gradient(circle at 50% 0%, var(--neg-glow), transparent 60%)' }} />
      <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--neg-glow)' }}>
        <AlertTriangle className="h-7 w-7" style={{ color: 'var(--neg)' }} />
      </div>
      <p className="meta">Something went wrong</p>
      <h1 className="heading mt-4">Dashboard error</h1>
      <p className="body mt-2 max-w-md mx-auto">
        An unexpected error occurred while loading this page.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={reset} className="btn btn--gold">
          Try again
        </button>
        <a href="/dashboard" className="btn">
          Back to dashboard
        </a>
      </div>
    </motion.div>
  )
}
