import { redirect } from "next/navigation"
import { getFullUser } from "@/lib/session"
import { ProfileClient } from "./profile-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Profile & Settings — Lumora AI",
  description: "Manage your profile, preferences, and account settings.",
}

export default async function ProfilePage() {
  const user = await getFullUser()
  if (!user) redirect("/sign-in")
  return (
    <ProfileClient
      user={{
        id: user.id,
        name: user.name ?? "",
        email: user.email ?? "",
        image: user.image ?? "",
        timezone: (user.timezone as string) ?? "",
        country: (user.country as string) ?? "",
        theme: (user.theme as string) ?? "system",
        bio: (user.bio as string) ?? "",
        notificationPrefs: (user.notificationPrefs as Record<string, boolean>) ?? {},
        createdAt: user.createdAt?.toISOString?.() ?? new Date().toISOString(),
      }}
    />
  )
}
