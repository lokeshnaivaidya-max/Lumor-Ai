import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { db } from "@/lib/db"
import { desc, eq } from "drizzle-orm"
import {
  portfolioHolding,
  watchlistItem,
  notification,
  savedAnalysis,
  chatConversation,
  activityLog,
} from "@/lib/db/schema"
import { ActivityClient, type ActivityItem } from "./activity-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Activity — Lumora AI",
  description: "Your recent activity across Lumora.",
}

function toSafeIso(val: any): string {
  if (!val) return new Date().toISOString()
  if (typeof val === "string") return val
  try {
    const d = new Date(val)
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

export default async function ActivityPage() {
  const u = await getCurrentUser()
  if (!u) redirect("/sign-in")
  const userId = u.id

  const [
    holdings,
    watches,
    notes,
    analyses,
    chats,
    logs,
  ] = await Promise.all([
    db.select().from(portfolioHolding).where(eq(portfolioHolding.userId, userId)).orderBy(desc(portfolioHolding.createdAt)).limit(20).catch(() => []),
    db.select().from(watchlistItem).where(eq(watchlistItem.userId, userId)).orderBy(desc(watchlistItem.createdAt)).limit(20).catch(() => []),
    db.select().from(notification).where(eq(notification.userId, userId)).orderBy(desc(notification.createdAt)).limit(20).catch(() => []),
    db.select().from(savedAnalysis).where(eq(savedAnalysis.userId, userId)).orderBy(desc(savedAnalysis.createdAt)).limit(20).catch(() => []),
    db.select().from(chatConversation).where(eq(chatConversation.userId, userId)).orderBy(desc(chatConversation.updatedAt)).limit(20).catch(() => []),
    db.select().from(activityLog).where(eq(activityLog.userId, userId)).orderBy(desc(activityLog.createdAt)).limit(100).catch(() => []),
  ])

  const items: ActivityItem[] = []

  for (const h of holdings as any[]) {
    items.push({
      id: `holding-${h.id}`,
      type: "portfolio",
      title: `Portfolio updated · ${h.quantity} ${h.symbol}`,
      ticker: h.symbol,
      href: "/portfolio",
      timestamp: toSafeIso(h.updatedAt ?? h.createdAt),
    })
  }

  for (const w of watches as any[]) {
    items.push({
      id: `watch-${w.id}`,
      type: "watchlist",
      title: `Added ${w.symbol} to watchlist`,
      ticker: w.symbol,
      href: "/watchlist",
      timestamp: toSafeIso(w.createdAt),
    })
  }

  for (const a of analyses as any[]) {
    items.push({
      id: `analysis-${a.id}`,
      type: "analysis",
      title: `Analyzed ${a.symbol}${a.direction && a.direction !== "neutral" ? ` · ${a.direction}` : ""}`,
      ticker: a.symbol,
      href: "/markets?symbol=" + a.symbol,
      timestamp: toSafeIso(a.createdAt),
    })
  }

  for (const c of chats as any[]) {
    items.push({
      id: `chat-${c.id}`,
      type: "chat",
      title: `Chat: ${c.title || "New chat"}`,
      href: "/chat",
      timestamp: toSafeIso(c.updatedAt ?? c.createdAt),
    })
  }

  for (const n of notes as any[]) {
    items.push({
      id: `notif-${n.id}`,
      type: "notification",
      title: n.title,
      ticker: n.symbol,
      href: "/notifications",
      timestamp: toSafeIso(n.createdAt),
    })
  }

  for (const l of logs as any[]) {
    items.push({
      id: `log-${l.id}`,
      type: l.type || "activity",
      title: l.title || "Activity logged",
      ticker: l.ticker,
      href: l.href || "/activity",
      timestamp: toSafeIso(l.createdAt),
    })
  }

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return <ActivityClient items={items} />
}
