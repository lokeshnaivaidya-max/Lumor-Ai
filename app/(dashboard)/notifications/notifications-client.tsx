"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Bell, TrendingUp, Brain, Wallet, Check, CheckCheck, Trash2, Loader2 } from "lucide-react"
import { markNotificationRead, markAllNotificationsRead, deleteNotification } from "@/app/actions/notifications"
import { useRouter } from "next/navigation"

type Notif = { id: number; type: string; title: string; body: string | null; read: boolean; createdAt: string }

const ICONS: Record<string, React.ElementType> = {
  price: TrendingUp,
  ai: Brain,
  portfolio: Wallet,
  general: Bell,
}

export function NotificationsClient({ notifications: initial }: { notifications: Notif[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => { setItems(initial) }, [initial])

  async function markRead(id: number) {
    setBusy(id)
    try {
      await markNotificationRead(id)
      setItems((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)))
      router.refresh()
    } catch (e: any) { setError(e?.message || "Failed") } finally { setBusy(null) }
  }

  async function markAll() {
    setBusy(-1)
    try {
      await markAllNotificationsRead()
      setItems((p) => p.map((n) => ({ ...n, read: true })))
      router.refresh()
    } catch (e: any) { setError(e?.message || "Failed") } finally { setBusy(null) }
  }

  async function remove(id: number) {
    setDeleting(id)
    try {
      await deleteNotification(id)
      setItems((p) => p.filter((n) => n.id !== id))
    } catch (e: any) { setError(e?.message || "Failed") } finally { setDeleting(null) }
  }

  const unread = items.filter((n) => !n.read).length

  return (
    <div className="p-6 lg:p-8">
      <hr className="dm-rule dm-rule--gold dm-animate" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="dm-heading dm-animate">Notifications</h1>
          <p className="dm-body dm-animate dm-animate--delay-1">
            {items.length > 0
              ? unread > 0
                ? `${unread} unread ${unread === 1 ? "notification" : "notifications"}`
                : "You're all caught up"
              : "No notifications yet"}
          </p>
        </div>
        <AnimatePresence>
          {unread > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={markAll} disabled={busy === -1}
              className="lm-btn flex items-center gap-2 px-4 py-2.5 text-xs disabled:opacity-50"
            >
              {busy === -1 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
              Mark all read
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="mb-4 rounded-xl border border-neg/20 bg-neg/[0.06] px-4 py-2.5 text-xs text-neg"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <p className="dm-body">You're all caught up</p>
          <p className="dm-body dm-animate dm-animate--delay-1 mt-1 max-w-sm">New price alerts and AI insights will appear here as they happen.</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {items.map((n, i) => {
            const Icon = ICONS[n.type] || Bell
            return (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, x: -16, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 16, scale: 0.97, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: deleting === n.id ? 0 : 0.03 * i }}
                className={`dm-card dm-card--inset dm-animate flex items-start gap-3.5 p-4 transition-all ${
                  deleting === n.id
                    ? "pointer-events-none scale-95 opacity-0 blur-sm"
                    : n.read
                      ? ""
                      : "border-l-2 border-l-gold"
                }`}
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  n.read ? "bg-muted/40 text-muted-foreground" : "bg-gold/10 text-gold"
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="dm-body font-medium">{n.title}</p>
                  {n.body && <p className="dm-body mt-0.5">{n.body}</p>}
                  <p className="dm-meta mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {!n.read && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => markRead(n.id)} disabled={busy === n.id} title="Mark read"
                      className="rounded-lg p-2 text-muted-foreground/50 transition-colors hover:bg-emerald/10 hover:text-emerald"
                    >
                      {busy === n.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => remove(n.id)} disabled={deleting === n.id} title="Delete"
                    className="rounded-lg p-2 text-muted-foreground/50 transition-colors hover:bg-neg/10 hover:text-neg"
                  >
                    {deleting === n.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      )}
    </div>
  )
}
