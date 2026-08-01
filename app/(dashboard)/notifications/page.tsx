import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { getNotifications } from "@/app/actions/notifications"
import { NotificationsClient } from "./notifications-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Notifications — Lumora AI",
  description: "Your alerts and AI insights.",
}

function safeIsoDate(val: any): string {
  if (!val) return new Date().toISOString()
  if (typeof val === "string") return val
  if (val instanceof Date) return isNaN(val.getTime()) ? new Date().toISOString() : val.toISOString()
  try {
    const d = new Date(val)
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  const notifications = await getNotifications().catch(() => [])
  return (
    <NotificationsClient
      notifications={notifications.map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        read: n.read,
        createdAt: safeIsoDate(n.createdAt),
      }))}
    />
  )
}
