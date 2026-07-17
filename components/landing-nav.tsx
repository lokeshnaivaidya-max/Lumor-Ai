"use client"

import { useEffect, useRef, useState } from "react"

const LINKS = [
  { label: "Markets", href: "/markets" },
  { label: "Intelligence", href: "#offerings" },
  { label: "Coverage", href: "#reach" },
]

export function LandingNav() {
  const [visible, setVisible] = useState(true)
  const [atTop, setAtTop] = useState(true)
  const lastY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true
        requestAnimationFrame(() => {
          const y = window.scrollY
          setAtTop(y < 20)
          if (y > lastY.current && y > 100) setVisible(false)
          else setVisible(true)
          lastY.current = y
          ticking.current = false
        })
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className="lm-nav"
      style={{
        transform: visible ? "translateY(0)" : "translateY(-120%)",
        opacity: atTop ? 0 : 1,
        pointerEvents: atTop ? "none" : "auto",
      }}
    >
      <nav className="lm-nav__inner">
        <a href="/" className="lm-nav__logo" aria-label="Lumora home">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <rect x="2" y="2" width="28" height="28" rx="6" stroke="#b8914b" strokeWidth="1.5" fill="none" />
            <path d="M10 22V12L16 20L22 12V22" stroke="#b8914b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </a>
        <div className="lm-nav__links">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="lm-nav__link">
              {link.label}
            </a>
          ))}
        </div>
        <a href="/sign-up" className="lm-nav__cta">Get started</a>
      </nav>
    </header>
  )
}
