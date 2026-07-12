import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { AmbientBackground } from "@/components/ambient-background"
import { CursorGlow } from "@/components/cursor-glow"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  // A session must only exist for verified users now, but guard anyway.
  if (!user.emailVerified) redirect("/verify-email")

  return (
    <>
      <AmbientBackground />
      <CursorGlow />
      <div className="flex min-h-screen">
        <DashboardSidebar />
        <main className="relative z-10 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </>
  )
}
