"use client"

import { useEffect } from "react"
import { AmbientBackground } from "@/components/ambient-background"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[ErrorPage]", error)
  }, [error])

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-[var(--bg-space,#030712)] text-[var(--text-primary,#ffffff)]">
      <AmbientBackground />
      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        <p className="text-xs font-mono uppercase tracking-widest text-[#38bdf8] mb-3">Something went wrong</p>
        <h1 className="text-2xl font-serif font-bold mb-4">Unexpected error</h1>
        <p className="text-sm text-[var(--text-secondary,#94a3b8)] mb-6 text-center">
          Lumora encountered an unexpected issue. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#34d399] text-black font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

