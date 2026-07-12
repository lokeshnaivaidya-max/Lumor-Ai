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
    let W: number, H: number

    const resize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const blobs = [
      { x: 0.15, y: 0.1, r: 0.4, h: 255, s: 0.15, delay: 0 },
      { x: 0.82, y: 0.05, r: 0.35, h: 195, s: 0.12, delay: -7 },
      { x: 0.5, y: 0.35, r: 0.45, h: 280, s: 0.1, delay: -14 },
      { x: 0.1, y: 0.7, r: 0.3, h: 168, s: 0.1, delay: -5 },
      { x: 0.75, y: 0.65, r: 0.35, h: 255, s: 0.08, delay: -10 },
      { x: 0.3, y: 0.88, r: 0.25, h: 85, s: 0.08, delay: -3 },
    ]

    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.5 + 0.5, a: Math.random() * 0.3 + 0.1,
    }))

    let t = 0
    let raf = 0

    const render = () => {
      t += 0.004
      ctx.clearRect(0, 0, W, H)

      // Soft colored blobs
      ctx.globalCompositeOperation = "lighter"
      for (const b of blobs) {
        const cx = W * b.x + Math.sin(t * 0.3 + b.delay) * W * 0.05
        const cy = H * b.y + Math.cos(t * 0.25 + b.delay * 0.7) * H * 0.04
        const r = Math.min(W, H) * b.r
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        grad.addColorStop(0, `oklch(0.55 ${b.s} ${b.h} / 0.2)`)
        grad.addColorStop(0.4, `oklch(0.5 ${b.s} ${b.h} / 0.08)`)
        grad.addColorStop(1, `oklch(0 0 0 / 0)`)
        ctx.fillStyle = grad
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
      }

      // Particles
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        p.vx *= 0.99; p.vy *= 0.99
        if (p.x < -10) p.x = W + 10
        if (p.x > W + 10) p.x = -10
        if (p.y < -10) p.y = H + 10
        if (p.y > H + 10) p.y = -10
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r + 6)
        grad.addColorStop(0, `oklch(0.55 0.15 255 / ${p.a})`)
        grad.addColorStop(1, `oklch(0 0 0 / 0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r + 6, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = "source-over"
      raf = requestAnimationFrame(render)
    }

    if (!reduce) render()

    window.addEventListener("resize", resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize) }
  }, [])

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
}
