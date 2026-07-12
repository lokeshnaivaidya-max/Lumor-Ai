"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { authClient, useSession } from "@/lib/auth-client"
import {
  LayoutDashboard,
  Briefcase,
  Star,
  User as UserIcon,
  LogOut,
  Loader2,
} from "lucide-react"

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
  const ref = useRef<HTMLDivElement>(null)

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
    return <div className="h-9 w-9 animate-pulse rounded-full bg-bg/60" />
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/sign-in"
          className="premium-btn premium-btn-ghost hidden rounded-full px-4 py-2 text-sm sm:block"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="premium-btn premium-btn-primary rounded-full px-4 py-2 text-sm font-medium"
        >
          Get started
        </Link>
      </div>
    )
  }

  const user = session.user

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="glass-card flex items-center gap-2 rounded-full p-0.5 pr-2.5 transition-colors hover:border-foreground/30"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image || "/placeholder.svg"}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
            {initials(user.name, user.email)}
          </span>
        )}
        <span className="hidden max-w-24 truncate text-sm font-medium sm:block">
          {user.name || user.email}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl p-1.5 shadow-2xl shadow-black/40"
          >
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-medium text-foreground">
                {user.name || "Lumora member"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-border" />
            {MENU_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-bg/60 hover:text-foreground"
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            ))}
            <div className="my-1 h-px bg-border" />
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-neg transition-colors hover:bg-neg/10 disabled:opacity-60"
            >
              {signingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
