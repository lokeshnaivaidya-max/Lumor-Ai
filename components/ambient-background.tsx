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
      const t = (Date.now() - t0) * 0.00008
      for (let i = 0; i < orbs.length; i++) {
        const orb = orbs[i]
        const xOff = Math.sin(t * (0.6 + i * 0.15) + i * 1.2) * 12
        const yOff = Math.cos(t * (0.4 + i * 0.1) + i * 0.8) * 8
        orb.style.transform = `translate(${xOff}px, ${yOff}px)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div ref={ref} className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.6_0.15_255/0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_85%,oklch(0.62_0.12_168/0.04),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_15%_65%,oklch(0.55_0.12_280/0.025),transparent_50%)]" />
      <div
        data-orb="1"
        className="absolute -top-[15%] left-[5%] h-[500px] w-[500px] opacity-60"
        style={{
          background: "radial-gradient(circle, oklch(0.6 0.15 255 / 0.05), transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        data-orb="2"
        className="absolute -bottom-[20%] right-[8%] h-[450px] w-[450px] opacity-50"
        style={{
          background: "radial-gradient(circle, oklch(0.62 0.12 168 / 0.035), transparent 70%)",
          filter: "blur(100px)",
        }}
      />
      <div
        data-orb="3"
        className="absolute top-[35%] left-[60%] h-[350px] w-[350px] opacity-30"
        style={{
          background: "radial-gradient(circle, oklch(0.55 0.12 280 / 0.025), transparent 70%)",
          filter: "blur(90px)",
        }}
      />
    </div>
  )
}
