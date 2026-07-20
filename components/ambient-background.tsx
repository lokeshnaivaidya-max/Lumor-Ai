"use client"

import { useEffect, useRef } from "react"

export function AmbientBackground() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      el.querySelectorAll<HTMLElement>("[data-motion]").forEach((b) => (b.style.animation = "none"))
    }
  }, [])

  return (
    <div ref={ref} className="ambient" aria-hidden>
      {/* Aurora mesh gradients */}
      <div
        data-motion
        className="ambient-beam animate-aurora"
        style={{
          top: "-25%", left: "-15%", height: "70vh", width: "70vh",
          background: "radial-gradient(circle, var(--beam-1), transparent 60%)",
        }}
      />
      <div
        data-motion
        className="ambient-beam animate-aurora"
        style={{
          bottom: "-30%", right: "-12%", height: "65vh", width: "65vh",
          background: "radial-gradient(circle, var(--beam-2), transparent 62%)",
          animationDelay: "-7s", animationDuration: "28s",
        }}
      />
      <div
        data-motion
        className="ambient-beam animate-aurora"
        style={{
          top: "15%", right: "18%", height: "45vh", width: "45vh",
          background: "radial-gradient(circle, var(--beam-3), transparent 64%)",
          animationDelay: "-13s", animationDuration: "34s",
        }}
      />

      {/* Volumetric light streak */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          data-motion
          className="animate-streak"
          style={{
            position: "absolute", top: "30%", left: 0, height: "2px", width: "40%",
            background: "linear-gradient(90deg, transparent, var(--gold-line), transparent)",
            filter: "blur(1px)", opacity: 0.4,
          }}
        />
      </div>

      {/* Animated grid */}
      <div
        className="bg-grid"
        style={{ animation: "gridPan 24s linear infinite", maskImage: "radial-gradient(130% 90% at 50% -10%, black 0%, transparent 75%)", WebkitMaskImage: "radial-gradient(130% 90% at 50% -10%, black 0%, transparent 75%)" }}
      />

      {/* Film grain */}
      <div className="grain" />
    </div>
  )
}
