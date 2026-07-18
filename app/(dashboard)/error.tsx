"use client"

import { useEffect } from "react"

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
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <p className="dm-meta">Something went wrong</p>
      <h1 className="dm-heading mt-4">Dashboard error</h1>
      <p className="dm-body mt-2 max-w-md">
        An unexpected error occurred while loading this page.
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="lm-btn lm-btn--gold">
          Try again
        </button>
        <a href="/dashboard" className="lm-btn">
          Back to dashboard
        </a>
      </div>
    </div>
  )
}
