import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardShell } from "@/components/dashboard-shell"

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
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="relative ml-24 min-h-screen flex-1">
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
          <div
            className="absolute -top-[10%] right-[5%] h-[400px] w-[400px] opacity-40"
            style={{
              background: "radial-gradient(circle, var(--gold-glow-strong), transparent 60%)",
              filter: "blur(90px)",
            }}
          />
        </div>
        <DashboardShell>
          <div className="relative z-10 mx-auto max-w-[1400px] px-6 py-8 lg:px-10 lg:py-10">
            {children}
          </div>
        </DashboardShell>
      </main>
    </div>
  )
}
