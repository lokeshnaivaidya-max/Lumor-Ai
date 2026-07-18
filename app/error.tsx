"use client"

import { useEffect } from "react"
import { AmbientBackground } from "@/components/ambient-background"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[GlobalError]", error)
  }, [error])

  return (
    <html lang="en" className="dark-root dark">
      <body className="antialiased">
        <AmbientBackground />
        <div className="lm-scene">
          <div className="lm-light" />
          <div className="relative z-10 flex flex-col items-center text-center max-w-md">
            <p className="dm-meta mb-4">Something went wrong</p>
            <h1 className="dm-heading mb-4">Unexpected error</h1>
            <p className="dm-body mb-8 text-center">
              Lumora encountered an unexpected issue. Our team has been notified.
              Please try again.
            </p>
            <button onClick={reset} className="lm-btn lm-btn--gold">
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
