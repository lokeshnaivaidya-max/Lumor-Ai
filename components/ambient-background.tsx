"use client"

import { useEffect, useRef } from "react"

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = window.innerWidth
    let height = window.innerHeight

    const setSize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    setSize()

    const blobs = [
      { x: 0.15, y: 0.1, r: 0.45, hue: 255, saturation: 0.25, delay: 0 },
      { x: 0.8, y: 0.05, r: 0.38, hue: 195, saturation: 0.22, delay: -7 },
      { x: 0.5, y: 0.4, r: 0.52, hue: 275, saturation: 0.2, delay: -14 },
      { x: 0.1, y: 0.75, r: 0.35, hue: 168, saturation: 0.2, delay: -5 },
      { x: 0.75, y: 0.7, r: 0.4, hue: 255, saturation: 0.18, delay: -10 },
      { x: 0.35, y: 0.9, r: 0.3, hue: 85, saturation: 0.15, delay: -3 },
    ]

    const fieldCount = width < 768 ? 30 : 60
    const hues = [255, 275, 195, 168, 85]
    const field = Array.from({ length: fieldCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2.5 + 0.5,
      hue: hues[Math.floor(Math.random() * hues.length)],
      a: Math.random() * 0.5 + 0.2,
    }))

    let t = 0
    let raf = 0

    const render = () => {
      t += 0.005
      ctx.clearRect(0, 0, width, height)

      // Draw large colorful blobs
      ctx.globalCompositeOperation = "lighter"
      for (const blob of blobs) {
        const cx = width * blob.x + Math.sin(t * 0.3 + blob.delay) * width * 0.06
        const cy = height * blob.y + Math.cos(t * 0.25 + blob.delay * 0.7) * height * 0.05
        const r = Math.min(width, height) * blob.r
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        grad.addColorStop(0, `oklch(0.7 ${blob.saturation} ${blob.hue} / 0.35)`)
        grad.addColorStop(0.3, `oklch(0.6 ${blob.saturation} ${blob.hue} / 0.2)`)
        grad.addColorStop(0.6, `oklch(0.5 ${blob.saturation} ${blob.hue} / 0.08)`)
        grad.addColorStop(1, `oklch(0.5 ${blob.saturation} ${blob.hue} / 0)`)
        ctx.fillStyle = grad
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
      }

      // Draw particles
      for (const p of field) {
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.99
        p.vy *= 0.99
        if (p.x < -20) p.x = width + 20
        if (p.x > width + 20) p.x = -20
        if (p.y < -20) p.y = height + 20
        if (p.y > height + 20) p.y = -20
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r + 10)
        grad.addColorStop(0, `oklch(0.8 0.2 ${p.hue} / ${p.a})`)
        grad.addColorStop(0.5, `oklch(0.7 0.15 ${p.hue} / ${p.a * 0.3})`)
        grad.addColorStop(1, `oklch(0.7 0.15 ${p.hue} / 0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r + 10, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = "source-over"
      raf = requestAnimationFrame(render)
    }

    if (!reduce) render()

    const onResize = () => setSize()
    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (!reduce && !document.hidden) raf = requestAnimationFrame(render)
    }
    window.addEventListener("resize", onResize)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundColor: "oklch(0.105 0.025 265)" }} />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "linear-gradient(oklch(0.99 0 0 / 0.02) 1px, transparent 1px), linear-gradient(90deg, oklch(0.99 0 0 / 0.02) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent 75%)",
        }}
      />
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 100% 60% at 50% 0%, transparent 30%, oklch(0.08 0.02 270 / 0.85))",
      }} />
    </div>
  )
}
