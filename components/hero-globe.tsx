"use client"

import { useEffect, useRef } from "react"

export function HeroGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let W = typeof window !== "undefined" ? window.innerWidth : 1200
    let H = typeof window !== "undefined" ? window.innerHeight : 800

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

    // ── Globe dots ──
    const globeR = Math.min(W, H) * 0.18
    const cx = W * 0.5
    const cy = H * 0.42
    const dots: { theta: number; phi: number; r: number; bright: number }[] = []
    for (let i = 0; i < 280; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      dots.push({ theta, phi, r: 1.5 + Math.random() * 2, bright: 0.3 + Math.random() * 0.7 })
    }

    // ── Orbital rings ──
    const rings = [
      { tilt: 0.2, speed: 0.3, count: 60, r: globeR * 1.1, hue: 255 },
      { tilt: -0.4, speed: -0.2, count: 50, r: globeR * 1.25, hue: 195 },
      { tilt: 0.6, speed: 0.15, count: 40, r: globeR * 1.4, hue: 280 },
    ]

    // ── Floating particles ──
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
      a: Math.random() * 0.4 + 0.1,
    }))

    let t = 0
    let raf = 0

    const render = () => {
      t += 0.006
      ctx.clearRect(0, 0, W, H)

      // ── Orbital rings ──
      ctx.globalCompositeOperation = "lighter"
      for (const ring of rings) {
        const angle = t * ring.speed
        ctx.strokeStyle = `oklch(0.55 0.18 ${ring.hue} / 0.12)`
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let i = 0; i <= ring.count; i++) {
          const p = (i / ring.count) * Math.PI * 2
          const rx = ring.r * Math.cos(p + angle)
          const ry = ring.r * Math.sin(p + angle) * Math.cos(ring.tilt)
          const sx = cx + rx
          const sy = cy + ry * 0.4
          if (ry > 0) {
            ctx.globalAlpha = 0.15
          } else {
            ctx.globalAlpha = 0.06
          }
          i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy)
        }
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      // ── Globe dots ──
      const pulse = 1 + Math.sin(t * 0.5) * 0.015
      for (const d of dots) {
        const theta = d.theta + t * 0.08
        const phi = d.phi + Math.sin(t * 0.3 + d.theta) * 0.02
        const x = globeR * pulse * Math.sin(phi) * Math.cos(theta)
        const y = globeR * pulse * Math.cos(phi)
        const z = globeR * pulse * Math.sin(phi) * Math.sin(theta)
        const sx = cx + x * 0.4
        const sy = cy + y * 0.4
        const size = (0.4 + (z + globeR) / (globeR * 2) * 0.6) * d.r * 1.8
        const alpha = (0.3 + (z + globeR) / (globeR * 2) * 0.7) * d.bright
        ctx.beginPath()
        ctx.arc(sx, sy, size, 0, Math.PI * 2)
        ctx.fillStyle = `oklch(0.55 0.18 255 / ${alpha * 0.6})`
        ctx.fill()
        ctx.beginPath()
        ctx.arc(sx, sy, size * 1.6, 0, Math.PI * 2)
        ctx.fillStyle = `oklch(0.55 0.18 255 / ${alpha * 0.15})`
        ctx.fill()
      }

      // ── Particles ──
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.99
        p.vy *= 0.99
        if (p.x < -10) p.x = W + 10
        if (p.x > W + 10) p.x = -10
        if (p.y < -10) p.y = H + 10
        if (p.y > H + 10) p.y = -10
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r + 8)
        grad.addColorStop(0, `oklch(0.55 0.18 255 / ${p.a})`)
        grad.addColorStop(0.5, `oklch(0.6 0.16 168 / ${p.a * 0.3})`)
        grad.addColorStop(1, `oklch(0 0 0 / 0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r + 8, 0, Math.PI * 2)
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

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
}
