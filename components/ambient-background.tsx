"use client"

import { useEffect, useRef } from "react"

export function AmbientBackground() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      el.querySelectorAll<HTMLElement>("[data-beam]").forEach((b) => (b.style.animation = "none"))
      return
    }
  }, [])

  return (
    <div ref={ref} className="ambient" aria-hidden>
      {/* Cinematic light beams */}
      <div
        data-beam
        className="ambient-beam"
        style={{
          top: "-20%",
          left: "-10%",
          height: "60vh",
          width: "60vh",
          background:
            "radial-gradient(circle, var(--beam-1), transparent 60%)",
          animation: "beamDrift 26s var(--ease-inout) infinite",
        }}
      />
      <div
        data-beam
        className="ambient-beam"
        style={{
          bottom: "-25%",
          right: "-8%",
          height: "55vh",
          width: "55vh",
          background:
            "radial-gradient(circle, var(--beam-2), transparent 60%)",
          animation: "beamDrift2 32s var(--ease-inout) infinite",
        }}
      />
      <div
        data-beam
        className="ambient-beam"
        style={{
          top: "20%",
          right: "20%",
          height: "38vh",
          width: "38vh",
          background:
            "radial-gradient(circle, var(--gold-glow), transparent 62%)",
          animation: "beamDrift 38s var(--ease-inout) infinite",
        }}
      />

      {/* Fine grid wash */}
      <div className="bg-grid" />

      {/* Film grain */}
      <div className="grain" />
    </div>
  )
}
