import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { getPortfolioSummary, type PortfolioHoldingView, type PortfolioSummary } from "@/lib/portfolio"
import { PortfolioClient } from "./portfolio-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Portfolio — Lumora AI",
  description: "Manage your holdings, track performance, and get AI-powered portfolio insights.",
}

export default async function PortfolioPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  const summary = (await getPortfolioSummary(user.id).catch(() => null)) as PortfolioSummary | null
  return (
    <PortfolioClient
      holdings={(summary?.holdings || []) as PortfolioHoldingView[]}
      summary={{
        investment: summary?.investment ?? 0,
        value: summary?.value ?? 0,
        todayPnL: summary?.todayPnL ?? 0,
        totalReturns: summary?.totalReturns ?? 0,
        returnsPercent: summary?.returnsPercent ?? 0,
        holdingsCount: summary?.holdingsCount ?? 0,
      }}
    />
  )
}
