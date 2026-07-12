import { getCurrentUser } from "@/lib/session"
import { getNotifications } from "@/app/actions/notifications"
import { NotificationsClient } from "./notifications-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Notifications — Lumora AI",
  description: "Your alerts and AI insights.",
}

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  const notifications = await getNotifications()
  return (
    <NotificationsClient
      notifications={notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      }))}
    />
  )
}
