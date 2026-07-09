"use client"

import { useEffect, useRef } from "react"

/**
 * Cinematic ambient background:
 * - Layered aurora blobs (CSS animated) for soft lighting
 * - A lightweight canvas particle field ("floating light") that reacts to the cursor
 * Designed to stay well above 60fps by capping particle count and using rAF.
 */
export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const count = width < 768 ? 34 : 70
    const mouse = { x: width / 2, y: height / 2 }

    type P = { x: number; y: number; vx: number; vy: number; r: number; hue: number; a: number }
    const particles: P[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.8 + 0.5,
      hue: Math.random() > 0.5 ? 245 : 165,
      a: Math.random() * 0.5 + 0.2,
    }))

    let raf = 0
    const render = () => {
      ctx.clearRect(0, 0, width, height)
      for (const p of particles) {
        // gentle drift + subtle cursor attraction
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.hypot(dx, dy)
        if (dist < 200) {
          p.vx += (dx / dist) * 0.006
          p.vy += (dy / dist) * 0.006
        }
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.99
        p.vy *= 0.99

        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `oklch(0.8 0.15 ${p.hue} / ${p.a})`
        ctx.shadowBlur = 8
        ctx.shadowColor = `oklch(0.75 0.16 ${p.hue} / 0.6)`
        ctx.fill()
      }
      raf = requestAnimationFrame(render)
    }

    if (!reduce) render()

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    const onResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("resize", onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-background" />

      {/* Aurora blobs */}
      <div
        className="animate-aurora absolute -top-1/3 left-1/4 h-[70vh] w-[70vh] rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.2 250 / 0.55), transparent 70%)" }}
      />
      <div
        className="animate-aurora absolute top-1/4 -right-20 h-[60vh] w-[60vh] rounded-full blur-[130px]"
        style={{ background: "radial-gradient(circle, oklch(0.6 0.16 165 / 0.4), transparent 70%)", animationDelay: "-6s" }}
      />
      <div
        className="animate-aurora absolute bottom-0 left-0 h-[55vh] w-[55vh] rounded-full blur-[140px]"
        style={{ background: "radial-gradient(circle, oklch(0.5 0.2 295 / 0.35), transparent 70%)", animationDelay: "-12s" }}
      />

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-70" />

      {/* Grid + vignette */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.99 0 0 / 0.02) 1px, transparent 1px), linear-gradient(90deg, oklch(0.99 0 0 / 0.02) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent 90%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 100% 70% at 50% 0%, transparent 40%, oklch(0.13 0.006 265 / 0.9))" }}
      />
    </div>
  )
}
