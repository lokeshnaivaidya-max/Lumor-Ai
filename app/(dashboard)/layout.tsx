import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  if (!user.emailVerified) redirect("/verify-email")

  return (
    <>
      <DashboardSidebar />
      <main className="relative min-h-screen pt-13">
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>
    </>
  )
}
