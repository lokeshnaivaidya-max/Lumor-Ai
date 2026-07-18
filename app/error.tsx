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
        <div className="scene">
          <div className="relative z-10 flex flex-col items-center text-center" style={{ maxWidth: 480 }}>
            <p className="meta mb-5">Something went wrong</p>
            <h1 className="heading mb-5">Unexpected error</h1>
            <p className="body mb-8 text-center">
              Lumora encountered an unexpected issue. Our team has been notified. Please try again.
            </p>
            <button onClick={reset} className="btn btn--gold">
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
