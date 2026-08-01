"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
import { authClient, useSession } from "@/lib/auth-client"
import { LayoutDashboard, Briefcase, Star, User as UserIcon, LogOut, Loader2 } from "lucide-react"

const MENU_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "Watchlist", href: "/watchlist", icon: Star },
  { label: "Profile", href: "/profile", icon: UserIcon },
]

function initials(name?: string | null, email?: string | null) {
  const base = (name || email || "?").trim()
  const parts = base.split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return base.slice(0, 2).toUpperCase()
}

export function AccountMenu() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // Compute the dropdown position from the button's viewport rect. Because the
  // menu is portaled to <body> with position:fixed, these viewport coords are
  // exact and unaffected by any ancestor overflow/transform/stacking context.
  // We anchor the menu's right edge to the avatar's right edge so it always
  // sits directly below the avatar and never overflows the viewport on small
  // screens (we also clamp it in render).
  const position = useCallback(() => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setCoords({ top: r.bottom + 8, right: window.innerWidth - r.right })
  }, [])

  const toggle = () => {
    if (!open) position()
    setOpen((o) => !o)
  }

  useEffect(() => {
    if (!open) return
    window.addEventListener("resize", position)
    window.addEventListener("scroll", position, true)
    return () => {
      window.removeEventListener("resize", position)
      window.removeEventListener("scroll", position, true)
    }
  }, [open, position])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    await authClient.signOut()
    setOpen(false)
    router.push("/")
    router.refresh()
  }

  if (isPending) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-white/5" />
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/sign-in" className="glass-btn-ghost glass-btn rounded-full px-4 py-2 text-sm">
          Sign in
        </Link>
        <Link href="/sign-up" className="glass-btn glass-btn-primary rounded-full px-4 py-2 text-sm">
          Sign Up
        </Link>
      </div>
    )
  }

  const user = session.user

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="glass-card flex items-center gap-2 rounded-full p-0.5 pr-2.5 transition-all duration-300 hover:border-white/20 pressable"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {user.image ? (
          <img src={user.image || "/placeholder.svg"} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-xs font-semibold text-foreground">
            {initials(user.name, user.email)}
          </span>
        )}
        <span className="hidden max-w-24 truncate text-sm font-medium sm:block">
          {user.name || user.email}
        </span>
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && coords && (
              // Fixed, full-viewport, pointer-events-none layer rendered directly
              // on <body> with the maximum z-index. Being a direct child of body
              // (no transformed/overflow-clipped ancestor) guarantees the menu
              // always paints above every hero/section regardless of their
              // stacking contexts.
              <div
                style={{ position: "fixed", inset: 0, zIndex: 2147483647, pointerEvents: "none" }}
              >
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: "fixed",
                    top: coords.top,
                    // Clamp the right offset so the menu stays fully on-screen
                    // even when the avatar hugs the viewport edge.
                    right: Math.max(coords.right, 12),
                    pointerEvents: "auto",
                  }}
                  className="glass-dialog w-64 overflow-hidden rounded-2xl p-2 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.55)]"
                >
                  <div className="px-3 pb-3 pt-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.name || "Lumora member"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="h-px bg-white/[0.06]" />
                  <div className="py-1">
                    {MENU_LINKS.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                      >
                        <l.icon className="h-4 w-4 shrink-0" />
                        {l.label}
                      </Link>
                    ))}
                  </div>
                  <div className="h-px bg-white/[0.06]" />
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-neg transition-colors hover:bg-neg/10 disabled:opacity-60"
                  >
                    {signingOut ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4 shrink-0" />
                    )}
                    Sign out
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  )
}
