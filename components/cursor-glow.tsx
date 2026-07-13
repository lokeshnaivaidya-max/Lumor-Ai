"use client"

import { useEffect, useRef } from "react"

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return
    const el = ref.current
    if (!el) return

    const raf = (cb: () => void) => {
      let id: number | undefined
      const loop = () => { id = requestAnimationFrame(loop); cb() }
      id = requestAnimationFrame(loop)
      return () => cancelAnimationFrame(id!)
    }

    let mx = -500
    let my = -500
    const update = () => {
      el!.style.transform = `translate(${mx}px, ${my}px)`
    }
    const cleanup = raf(update)
    const move = (e: MouseEvent) => { mx = e.clientX - 250; my = e.clientY - 250 }
    window.addEventListener("mousemove", move, { passive: true })
    return () => {
      window.removeEventListener("mousemove", move)
      cleanup()
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-20 h-[500px] w-[500px] will-change-transform"
      style={{
        background: "radial-gradient(circle at center, oklch(0.65 0.2 255 / 0.1), oklch(0.6 0.18 275 / 0.04) 40%, transparent 60%)",
      }}
    />
  )
}
