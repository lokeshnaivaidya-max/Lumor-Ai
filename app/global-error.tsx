"use client"

import { useEffect } from "react"

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
    <html lang="en" className="dark">
      <body className="bg-[#030712] text-white min-h-screen flex items-center justify-center p-6 antialiased">
        <div className="flex flex-col items-center text-center max-w-md">
          <p className="text-xs font-mono uppercase tracking-widest text-[#38bdf8] mb-3">System Error</p>
          <h1 className="text-2xl font-serif font-bold mb-4">Something went wrong</h1>
          <p className="text-sm text-slate-400 mb-6">
            A global error occurred. Please refresh or try again.
          </p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#34d399] text-black font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
