"use client"

import { useEffect, useRef } from "react"

const spriteCache = new Map<number, HTMLCanvasElement>()
function glowSprite(hue: number): HTMLCanvasElement {
  const key = Math.round(hue)
  const cached = spriteCache.get(key)
  if (cached) return cached
  const size = 80
  const c = document.createElement("canvas")
  c.width = size
  c.height = size
  const g = c.getContext("2d")!
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, `oklch(0.8 0.2 ${key} / 0.9)`)
  grad.addColorStop(0.3, `oklch(0.7 0.18 ${key} / 0.35)`)
  grad.addColorStop(1, `oklch(0.7 0.18 ${key} / 0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  spriteCache.set(key, c)
  return c
}

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

    type P = { x: number; y: number; vx: number; vy: number; r: number; hue: number; a: number }
    const fieldCount = width < 768 ? 20 : 40
    const hues = [255, 275, 195, 168]
    const field: P[] = Array.from({ length: fieldCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 2 + 0.5,
      hue: hues[Math.floor(Math.random() * hues.length)],
      a: Math.random() * 0.4 + 0.15,
    }))

    type Feather = { spread: number; length: number; lift: number; count: number; hue: number }
    const featherDefs: Feather[] = [
      { spread: 0.14, length: 0.85, lift: 0.04, count: 12, hue: 255 },
      { spread: 0.28, length: 0.95, lift: 0.1, count: 14, hue: 255 },
      { spread: 0.42, length: 1.0, lift: 0.2, count: 16, hue: 275 },
      { spread: 0.58, length: 0.98, lift: 0.32, count: 16, hue: 275 },
      { spread: 0.74, length: 0.88, lift: 0.44, count: 14, hue: 195 },
      { spread: 0.9, length: 0.72, lift: 0.56, count: 12, hue: 168 },
    ]

    const mouse = { x: width / 2, y: height / 2, tx: width / 2, ty: height / 2 }
    let t = 0
    let raf = 0

    const drawWing = (cx: number, cy: number, dir: 1 | -1, baseW: number, baseH: number) => {
      for (const f of featherDefs) {
        const sway = Math.sin(t * 0.5 + f.spread * 4) * 0.05
        const angle = dir * (f.spread * 1.1 + sway)
        const len = baseW * f.length
        const lift = -baseH * f.lift
        const ex = cx + dir * Math.cos(angle) * len
        const ey = cy + lift - Math.sin(f.spread * 1.4) * baseH * 0.5
        const c1x = cx + dir * Math.cos(angle) * len * 0.4
        const c1y = cy + lift * 0.35 + Math.sin(t * 0.7 + f.spread * 3) * 8
        for (let i = 0; i < f.count; i++) {
          const seg = i / (f.count - 1)
          const mt = 1 - seg
          const x = mt * mt * cx + 2 * mt * seg * c1x + seg * seg * ex
          const y = mt * mt * cy + 2 * mt * seg * c1y + seg * seg * ey
          const tw = 0.5 + 0.5 * Math.sin(t * 1.2 - seg * 5 + f.spread * 2.5)
          const fade = Math.pow(seg, 0.6)
          const a = (0.04 + tw * 0.24) * (0.3 + fade * 0.7)
          const r = 1 + tw * 1.4 + fade * 0.8
          const sprite = glowSprite(f.hue)
          const d = (r + 12) * 2
          ctx.globalAlpha = Math.min(1, a * 1.1)
          ctx.drawImage(sprite, x - d / 2, y - d / 2, d, d)
        }
      }
    }

    const render = () => {
      t += 0.008
      ctx.clearRect(0, 0, width, height)
      mouse.x += (mouse.tx - mouse.x) * 0.05
      mouse.y += (mouse.ty - mouse.y) * 0.05
      const px = (mouse.x / width - 0.5) * 35
      const py = (mouse.y / height - 0.5) * 22
      const cx = width / 2 + px
      const cy = height * 0.4 + py
      const breathe = 1 + Math.sin(t * 0.4) * 0.03
      const baseW = Math.min(width * 0.4, 520) * breathe
      const baseH = Math.min(height * 0.48, 440) * breathe
      ctx.globalCompositeOperation = "lighter"
      drawWing(cx, cy, 1, baseW, baseH)
      drawWing(cx, cy, -1, baseW, baseH)
      for (const p of field) {
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.hypot(dx, dy)
        if (dist < 200) {
          p.vx += (dx / dist) * 0.004
          p.vy += (dy / dist) * 0.004
        }
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.99
        p.vy *= 0.99
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0
        const sprite = glowSprite(p.hue)
        const d = (p.r + 8) * 2
        ctx.globalAlpha = p.a
        ctx.drawImage(sprite, p.x - d / 2, p.y - d / 2, d, d)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = "source-over"
      raf = requestAnimationFrame(render)
    }

    if (!reduce) render()

    const onMove = (e: MouseEvent) => { mouse.tx = e.clientX; mouse.ty = e.clientY }
    const onResize = () => setSize()
    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (!reduce && !document.hidden) raf = requestAnimationFrame(render)
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    window.addEventListener("resize", onResize)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("resize", onResize)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="mesh-bg absolute inset-0" />
      <div className="animate-aurora absolute -top-[30%] -left-[10%] h-[80vh] w-[80vh] rounded-full blur-[140px]"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.2 255 / 0.35), transparent 70%)" }}
      />
      <div className="animate-aurora-reverse absolute -top-[10%] -right-[10%] h-[70vh] w-[70vh] rounded-full blur-[150px]"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.18 195 / 0.28), transparent 70%)" }}
      />
      <div className="animate-aurora-slow absolute bottom-[5%] left-[20%] h-[60vh] w-[60vh] rounded-full blur-[160px]"
        style={{ background: "radial-gradient(circle, oklch(0.52 0.18 275 / 0.25), transparent 70%)", animationDelay: "-10s" }}
      />
      <div className="animate-aurora absolute -bottom-[10%] right-[25%] h-[50vh] w-[50vh] rounded-full blur-[130px]"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.18 168 / 0.2), transparent 70%)", animationDelay: "-6s" }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-70" />
      <div className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "linear-gradient(oklch(0.99 0 0 / 0.015) 1px, transparent 1px), linear-gradient(90deg, oklch(0.99 0 0 / 0.015) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent 85%)",
        }}
      />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 100% 70% at 50% 0%, transparent 40%, oklch(0.1 0.01 274 / 0.9))" }} />
    </div>
  )
}
