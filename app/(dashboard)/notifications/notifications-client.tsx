"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { Bell, TrendingUp, Brain, Wallet, Check, CheckCheck, Trash2 } from "lucide-react"
import { markNotificationRead, markAllNotificationsRead, deleteNotification } from "@/app/actions/notifications"
import { EmptyState } from "@/components/ui/empty-state"

type Notif = { id: number; type: string; title: string; body: string | null; read: boolean; createdAt: string }

const ICONS: Record<string, React.ElementType> = {
  price: TrendingUp,
  ai: Brain,
  portfolio: Wallet,
  general: Bell,
}

export function NotificationsClient({ notifications: initial }: { notifications: Notif[] }) {
  const [items, setItems] = useState(initial)
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setItems(initial) }, [initial])

  async function markRead(id: number) {
    setBusy(id)
    try {
      await markNotificationRead(id)
      setItems((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch (e: any) { setError(e?.message || "Failed") } finally { setBusy(null) }
  }

  async function markAll() {
    setBusy(-1)
    try {
      await markAllNotificationsRead()
      setItems((p) => p.map((n) => ({ ...n, read: true })))
    } catch (e: any) { setError(e?.message || "Failed") } finally { setBusy(null) }
  }

  async function remove(id: number) {
    setBusy(id)
    try {
      await deleteNotification(id)
      setItems((p) => p.filter((n) => n.id !== id))
    } catch (e: any) { setError(e?.message || "Failed") } finally { setBusy(null) }
  }

  const unread = items.filter((n) => !n.read).length

  return (
    <div className="relative p-6 lg:p-8">
      <div className="relative z-10 mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "You're all caught up"}
            </p>
          </div>
          {unread > 0 && (
            <button onClick={markAll} disabled={busy === -1} className="premium-btn px-4 py-2.5 text-xs">
              <CheckCheck className="h-3.5 w-3.5" />Mark all read
            </button>
          )}
        </motion.div>

        {error && <p className="mb-4 text-xs text-neg">{error}</p>}

        {items.length === 0 ? (
          <EmptyState
            icon={Bell}
            tone="blue"
            title="You're all caught up"
            description="New price alerts and AI insights will appear here as they happen."
          />
        ) : (
          <div className="space-y-3">
            {items.map((n, i) => {
              const Icon = ICONS[n.type] || Bell
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={`group flex items-start gap-3.5 rounded-2xl border p-4 transition-colors ${n.read ? "border-border/20 bg-background/20" : "border-border/40 bg-primary/[0.05]"}`}
                >
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${n.read ? "bg-muted/40 text-muted-foreground" : "bg-violet/10 text-violet"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-[11px] text-muted-foreground/60">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {!n.read && (
                      <button onClick={() => markRead(n.id)} disabled={busy === n.id} title="Mark read" className="rounded-lg p-2 text-muted-foreground/50 hover:bg-emerald/10 hover:text-emerald">
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => remove(n.id)} disabled={busy === n.id} title="Delete" className="rounded-lg p-2 text-muted-foreground/50 hover:bg-neg/10 hover:text-neg">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
