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
      return
    }

    // Subtle parallax lighting — pointer moves the mesh layers for depth.
    let raf = 0
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--mx", x.toFixed(3))
        el.style.setProperty("--my", y.toFixed(3))
      })
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={ref} className="ambient" aria-hidden>
      {/* Animated mesh gradient — layered, blurred radial beams */}
      <div
        data-motion
        className="ambient-mesh animate-mesh-a"
        style={{
          top: "-30%", left: "-18%", height: "85vh", width: "85vh",
          background:
            "radial-gradient(closest-side at 50% 50%, var(--beam-1), transparent 70%)",
        }}
      />
      <div
        data-motion
        className="ambient-mesh animate-mesh-b"
        style={{
          bottom: "-34%", right: "-16%", height: "80vh", width: "80vh",
          background:
            "radial-gradient(closest-side at 50% 50%, var(--beam-2), transparent 72%)",
        }}
      />
      <div
        data-motion
        className="ambient-mesh animate-mesh-c"
        style={{
          top: "12%", right: "20%", height: "55vh", width: "55vh",
          background:
            "radial-gradient(closest-side at 50% 50%, var(--beam-3), transparent 74%)",
        }}
      />

      {/* Cinematic aurora ribbon — slow sweeping conic light */}
      <div className="ambient-aurora" />

      {/* Volumetric light beams — soft diagonal sweeps */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div data-motion className="animate-streak" style={{
          position: "absolute", top: "22%", left: 0, height: "2px", width: "42%",
          background: "linear-gradient(90deg, transparent, var(--gold-line), transparent)",
          filter: "blur(1px)", opacity: 0.45,
        }} />
        <div data-motion className="animate-streak-slow" style={{
          position: "absolute", top: "64%", left: 0, height: "1px", width: "36%",
          background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--info) 60%, transparent), transparent)",
          filter: "blur(1px)", opacity: 0.35,
        }} />
      </div>

      {/* Depth fog — gradient veil for layered depth */}
      <div className="ambient-fog" />

      {/* Glass reflection sheen — faint moving highlight */}
      <div className="ambient-sheen" />

      {/* Animated grid */}
      <div
        className="bg-grid"
        style={{
          animation: "gridPan 24s linear infinite",
          maskImage: "radial-gradient(130% 90% at 50% -10%, black 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(130% 90% at 50% -10%, black 0%, transparent 75%)",
        }}
      />

      {/* Film grain */}
      <div className="grain" />
    </div>
  )
}
