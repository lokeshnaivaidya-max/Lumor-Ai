"use client"

import { useEffect, useRef } from "react"

/**
 * Cinematic ambient background.
 * - Layered aurora blobs (CSS) for volumetric lighting.
 * - A canvas that renders two symmetric "light wings" made of flowing
 *   particles, plus a soft drifting particle field. The wings gently
 *   undulate and shimmer; both layers respond to the cursor with parallax.
 * Capped particle counts + a single rAF loop keep this comfortably 60fps.
 */
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

    // ---- Drifting light field ----
    type P = { x: number; y: number; vx: number; vy: number; r: number; hue: number; a: number }
    const fieldCount = width < 768 ? 26 : 54
    const field: P[] = Array.from({ length: fieldCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.7 + 0.4,
      hue: [250, 300, 168][Math.floor(Math.random() * 3)],
      a: Math.random() * 0.5 + 0.2,
    }))

    // ---- Wing feathers ----
    // Each feather is a curved streamline; particles ride along it.
    type Feather = { spread: number; length: number; lift: number; count: number; hue: number }
    const featherDefs: Feather[] = [
      { spread: 0.16, length: 0.9, lift: 0.05, count: 14, hue: 250 },
      { spread: 0.3, length: 1.0, lift: 0.12, count: 16, hue: 250 },
      { spread: 0.46, length: 1.05, lift: 0.22, count: 18, hue: 264 },
      { spread: 0.62, length: 1.02, lift: 0.34, count: 18, hue: 285 },
      { spread: 0.78, length: 0.92, lift: 0.47, count: 16, hue: 300 },
      { spread: 0.92, length: 0.78, lift: 0.6, count: 13, hue: 168 },
    ]

    const mouse = { x: width / 2, y: height / 2, tx: width / 2, ty: height / 2 }
    let t = 0
    let raf = 0

    const drawWing = (cx: number, cy: number, dir: 1 | -1, baseW: number, baseH: number) => {
      for (const f of featherDefs) {
        // gentle per-feather undulation
        const sway = Math.sin(t * 0.6 + f.spread * 5) * 0.06
        const angle = dir * (f.spread * 1.15 + sway) // fan angle from center
        const len = baseW * f.length
        const lift = -baseH * f.lift

        // control + end points for a curved feather
        const ex = cx + dir * Math.cos(angle) * len
        const ey = cy + lift - Math.sin(f.spread * 1.6) * baseH * 0.5
        const c1x = cx + dir * Math.cos(angle) * len * 0.4
        const c1y = cy + lift * 0.35 + Math.sin(t * 0.8 + f.spread * 4) * 10

        for (let i = 0; i < f.count; i++) {
          const seg = i / (f.count - 1)
          // quadratic bezier point
          const mt = 1 - seg
          const x = mt * mt * cx + 2 * mt * seg * c1x + seg * seg * ex
          const y = mt * mt * cy + 2 * mt * seg * c1y + seg * seg * ey
          // travelling shimmer along the feather
          const tw = 0.5 + 0.5 * Math.sin(t * 1.4 - seg * 6 + f.spread * 3)
          const fade = Math.pow(seg, 0.6) // brighter toward tips
          const a = (0.05 + tw * 0.28) * (0.35 + fade * 0.65)
          const r = 1.1 + tw * 1.6 + fade * 0.8
          ctx.beginPath()
          ctx.arc(x, y, r, 0, Math.PI * 2)
          ctx.fillStyle = `oklch(0.82 0.16 ${f.hue} / ${a.toFixed(3)})`
          ctx.shadowBlur = 14
          ctx.shadowColor = `oklch(0.78 0.17 ${f.hue} / 0.55)`
          ctx.fill()
        }
      }
    }

    const render = () => {
      t += 0.01
      ctx.clearRect(0, 0, width, height)

      // ease cursor
      mouse.x += (mouse.tx - mouse.x) * 0.06
      mouse.y += (mouse.ty - mouse.y) * 0.06
      const px = (mouse.x / width - 0.5) * 40
      const py = (mouse.y / height - 0.5) * 26

      // Wings anchored behind the hero, breathing scale + cursor parallax
      const cx = width / 2 + px
      const cy = height * 0.42 + py
      const breathe = 1 + Math.sin(t * 0.5) * 0.03
      const baseW = Math.min(width * 0.42, 560) * breathe
      const baseH = Math.min(height * 0.5, 480) * breathe

      ctx.globalCompositeOperation = "lighter"
      drawWing(cx, cy, 1, baseW, baseH)
      drawWing(cx, cy, -1, baseW, baseH)

      // Drifting field with subtle cursor attraction
      for (const p of field) {
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.hypot(dx, dy)
        if (dist < 220) {
          p.vx += (dx / dist) * 0.005
          p.vy += (dy / dist) * 0.005
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
        ctx.fillStyle = `oklch(0.83 0.15 ${p.hue} / ${p.a})`
        ctx.shadowBlur = 8
        ctx.shadowColor = `oklch(0.78 0.16 ${p.hue} / 0.6)`
        ctx.fill()
      }

      ctx.globalCompositeOperation = "source-over"
      ctx.shadowBlur = 0
      raf = requestAnimationFrame(render)
    }

    if (!reduce) {
      render()
    } else {
      // static single frame
      ctx.globalCompositeOperation = "lighter"
      drawWing(width / 2, height * 0.42, 1, width * 0.4, height * 0.45)
      drawWing(width / 2, height * 0.42, -1, width * 0.4, height * 0.45)
      ctx.globalCompositeOperation = "source-over"
    }

    const onMove = (e: MouseEvent) => {
      mouse.tx = e.clientX
      mouse.ty = e.clientY
    }
    const onResize = () => setSize()
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
      <div className="absolute inset-0 bg-background" />

      {/* Aurora blobs — volumetric lighting */}
      <div
        className="animate-aurora absolute -top-1/3 left-1/4 h-[70vh] w-[70vh] rounded-full blur-[130px]"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.21 255 / 0.5), transparent 70%)" }}
      />
      <div
        className="animate-aurora-slow absolute top-1/4 -right-24 h-[62vh] w-[62vh] rounded-full blur-[140px]"
        style={{ background: "radial-gradient(circle, oklch(0.62 0.16 168 / 0.36), transparent 70%)" }}
      />
      <div
        className="animate-aurora absolute bottom-0 left-0 h-[56vh] w-[56vh] rounded-full blur-[150px]"
        style={{ background: "radial-gradient(circle, oklch(0.5 0.21 300 / 0.34), transparent 70%)", animationDelay: "-12s" }}
      />

      {/* Light wings + particle field */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-80" />

      {/* Fine grid, masked */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.99 0 0 / 0.02) 1px, transparent 1px), linear-gradient(90deg, oklch(0.99 0 0 / 0.02) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent 90%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent 90%)",
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 100% 70% at 50% 0%, transparent 42%, oklch(0.115 0.008 274 / 0.92))" }}
      />
    </div>
  )
}
