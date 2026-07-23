"use client"

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported"
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isNotificationSupported()) return "unsupported"
  try {
    const res = await Notification.requestPermission()
    if (res === "granted") {
      sendBrowserNotification("Lumora AI Notifications Active", {
        body: "You will receive real-time market alerts and AI analysis updates.",
        icon: "/favicon.ico",
      })
    }
    return res
  } catch {
    return "denied"
  }
}

export function sendBrowserNotification(
  title: string,
  options?: NotificationOptions & { requireBackground?: boolean }
) {
  if (!isNotificationSupported()) return null
  if (Notification.permission !== "granted") return null

  // If requireBackground is true, only send if tab is not visible
  if (options?.requireBackground && typeof document !== "undefined" && !document.hidden) {
    return null
  }

  try {
    const notif = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    })
    return notif
  } catch (err) {
    console.error("[Notification Error]", err)
    return null
  }
}
