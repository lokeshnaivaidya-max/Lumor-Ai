"use client"

import { useEffect, useRef } from "react"

export function AmbientBackground() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return

    let raf = 0
    const orbs = el.querySelectorAll<HTMLDivElement>("[data-orb]")
    const t0 = Date.now()

    const tick = () => {
      const t = (Date.now() - t0) * 0.00006
      for (let i = 0; i < orbs.length; i++) {
        const orb = orbs[i]
        const xOff = Math.sin(t * (0.5 + i * 0.12) + i * 1.5) * 18
        const yOff = Math.cos(t * (0.3 + i * 0.08) + i * 1.0) * 12
        const scale = 1 + Math.sin(t * (0.2 + i * 0.05) + i * 0.7) * 0.04
        orb.style.transform = `translate(${xOff}px, ${yOff}px) scale(${scale})`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div ref={ref} className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Layer 1: Soft gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.6_0.15_255/0.06),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_85%,oklch(0.62_0.12_168/0.03),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_15%_65%,oklch(0.55_0.12_280/0.02),transparent_50%)]" />

      {/* Layer 2: Gold ambient gradient — signature Lumora glow */}
      <div className="absolute left-1/4 top-0 h-[600px] w-[600px] opacity-40"
        style={{
          background: "radial-gradient(circle, var(--gold-glow-strong), transparent 50%)",
          filter: "blur(80px)",
        }}
      />
      <div className="absolute right-0 top-1/3 h-[400px] w-[400px] opacity-30"
        style={{
          background: "radial-gradient(circle, var(--gold-glow), transparent 50%)",
          filter: "blur(100px)",
        }}
      />

      {/* Layer 3: Floating color clouds */}
      <div
        data-orb="1"
        className="absolute -top-[10%] left-[5%] h-[500px] w-[500px] opacity-50"
        style={{
          background: "radial-gradient(circle, oklch(0.6 0.15 255 / 0.04), transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        data-orb="2"
        className="absolute -bottom-[15%] right-[8%] h-[450px] w-[450px] opacity-40"
        style={{
          background: "radial-gradient(circle, oklch(0.62 0.12 168 / 0.03), transparent 70%)",
          filter: "blur(100px)",
        }}
      />
      <div
        data-orb="3"
        className="absolute top-[30%] left-[60%] h-[350px] w-[350px] opacity-25"
        style={{
          background: "radial-gradient(circle, oklch(0.55 0.12 280 / 0.02), transparent 70%)",
          filter: "blur(90px)",
        }}
      />
      <div
        data-orb="4"
        className="absolute top-[60%] left-[10%] h-[300px] w-[300px] opacity-30"
        style={{
          background: "radial-gradient(circle, var(--gold-glow), transparent 70%)",
          filter: "blur(80px)",
        }}
      />
    </div>
  )
}
