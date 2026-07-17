"use client"

import { useEffect, useRef } from "react"

export function AmbientBackground() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let mouseX = 0.5
    let mouseY = 0.5
    let raf = 0

    const onMouse = (e: MouseEvent) => {
      mouseX = e.clientX / window.innerWidth
      mouseY = e.clientY / window.innerHeight
    }
    window.addEventListener("mousemove", onMouse, { passive: true })

    const layers = el.querySelectorAll<HTMLDivElement>("[data-layer]")
    const fogLayers = el.querySelectorAll<HTMLDivElement>("[data-fog]")

    const tick = () => {
      const t = Date.now() * 0.0001
      for (let i = 0; i < layers.length; i++) {
        const l = layers[i]
        const depth = i + 1
        const dx = (mouseX - 0.5) * depth * 8
        const dy = (mouseY - 0.5) * depth * 6
        const drift = Math.sin(t * (0.5 + i * 0.2) + i) * depth * 4
        l.style.transform = `translate(${dx + drift}px, ${dy}px)`
      }
      for (let i = 0; i < fogLayers.length; i++) {
        const f = fogLayers[i]
        const driftX = Math.sin(t * (0.3 + i * 0.15) + i * 2) * 10
        const driftY = Math.cos(t * (0.2 + i * 0.1) + i * 1.5) * 6
        f.style.transform = `translate(${driftX}px, ${driftY}px)`
      }
      if (!reduce) raf = requestAnimationFrame(tick)
    }
    if (!reduce) raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("mousemove", onMouse)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={ref} className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.62_0.2_255/0.08),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,oklch(0.65_0.16_168/0.04),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_20%_60%,oklch(0.55_0.18_280/0.03),transparent)]" />
      <div
        data-fog="1"
        className="absolute -inset-[10%] opacity-30"
        style={{
          background: `radial-gradient(ellipse 70% 40% at 30% 20%, oklch(0.62 0.2 255 / 0.04), transparent 60%)`,
          filter: "blur(80px)",
        }}
      />
      <div
        data-fog="2"
        className="absolute -inset-[10%] opacity-20"
        style={{
          background: `radial-gradient(ellipse 50% 50% at 70% 50%, oklch(0.65 0.16 168 / 0.03), transparent 60%)`,
          filter: "blur(120px)",
        }}
      />
      <div
        data-fog="3"
        className="absolute -inset-[10%] opacity-15"
        style={{
          background: `radial-gradient(ellipse 60% 30% at 50% 80%, oklch(0.55 0.18 280 / 0.03), transparent 60%)`,
          filter: "blur(100px)",
        }}
      />
      <div
        data-layer="1"
        className="absolute left-[15%] top-[10%] h-[300px] w-[300px] rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, oklch(0.62 0.2 255 / 0.08), transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        data-layer="2"
        className="absolute right-[10%] top-[40%] h-[250px] w-[400px] rounded-full opacity-8"
        style={{
          background: "radial-gradient(circle, oklch(0.65 0.16 168 / 0.06), transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        data-layer="3"
        className="absolute bottom-[15%] left-[30%] h-[200px] w-[350px] rounded-full opacity-6"
        style={{
          background: "radial-gradient(circle, oklch(0.55 0.18 280 / 0.05), transparent 70%)",
          filter: "blur(100px)",
        }}
      />
    </div>
  )
}
