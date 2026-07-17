"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"

export function HeroParallax() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0

    const onMouse = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 16
        const y = (e.clientY / window.innerHeight - 0.5) * 12
        el!.style.transform = `translate(${x}px, ${y}px)`
      })
    }

    window.addEventListener("mousemove", onMouse, { passive: true })
    return () => {
      window.removeEventListener("mousemove", onMouse)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="lm-container" style={{ perspective: "800px" }}>
      <div className="lm-animate" style={{ maxWidth: 800, marginLeft: "auto", marginRight: "auto" }}>
        <hr className="lm-rule lm-rule--gold lm-animate lm-animate--delay-1" style={{ marginBottom: "2.5rem" }} />
        <div ref={ref} className="lm-parallax" style={{ textAlign: "center" }}>
          <h1 className="lm-display" style={{ marginBottom: "2rem" }}>
            Lumora
          </h1>
        </div>
        <p className="lm-body lm-body--large lm-animate lm-animate--delay-2" style={{ textAlign: "center", maxWidth: 420, margin: "0 auto" }}>
          Market Intelligence.
          <br />
          <span style={{ color: "#b8914b" }}>Without the Noise.</span>
        </p>
        <div className="lm-animate lm-animate--delay-3" style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2.5rem" }}>
          <Link href="/sign-up" className="lm-btn lm-btn--gold">
            Get started
          </Link>
          <Link href="/markets" className="lm-btn">
            Explore markets
          </Link>
        </div>
      </div>
    </div>
  )
}
