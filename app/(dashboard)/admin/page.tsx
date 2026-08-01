import { getCurrentUser } from "@/lib/session"
import { redirect } from "next/navigation"
import { EmailHistoryWidget } from "@/components/email-history-widget"
import { Shield, Mail, Server } from "lucide-react"

export const metadata = {
  title: "Admin Dashboard — Lumora AI",
  description: "System administration and email delivery monitoring.",
}

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/sign-in")
  }

  // Basic admin check (if role property exists or default admin email)
  const isAdmin = (user as any).role === "admin" || user.email.includes("admin") || user.email === "lokesh@lumora.ai"
  if (!isAdmin) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[var(--gold)]" />
          <h1 className="title">Admin Terminal</h1>
        </div>
        <p className="body">System metrics, dispatches, and email delivery monitoring.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <EmailHistoryWidget />
      </div>
    </div>
  )
}
