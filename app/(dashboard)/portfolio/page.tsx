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
  const summary = (await getPortfolioSummary(user!.id)) as PortfolioSummary
  return (
    <PortfolioClient
      holdings={summary.holdings as PortfolioHoldingView[]}
      summary={{
        investment: summary.investment,
        value: summary.value,
        todayPnL: summary.todayPnL,
        totalReturns: summary.totalReturns,
        returnsPercent: summary.returnsPercent,
        holdingsCount: summary.holdingsCount,
      }}
    />
  )
}
