import { DashboardClient } from "./dashboard-client"

export const metadata = {
  title: "Dashboard — Lumora AI",
  description: "Your portfolio overview, market summary, and AI insights at a glance.",
}

export default function DashboardPage() {
  return <DashboardClient />
}
