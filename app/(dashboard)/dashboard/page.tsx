import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { getPortfolioSummary, getWatchlistView, type PortfolioSummary, type WatchlistView } from "@/lib/portfolio"
import { getNotifications } from "@/app/actions/notifications"
import { getSavedAnalyses } from "@/app/actions/saved-analysis"
import { getQuotes, displayName } from "@/lib/market"
import { DashboardClient } from "./dashboard-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Dashboard — Lumora AI",
  description: "Your portfolio overview, market summary, and AI insights at a glance.",
}

const INDEX_SYMBOLS = ["^GSPC", "^IXIC", "^DJI", "BTC-USD"]

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const userId = user.id

  const [portfolio, watchlist, notifications, analyses, indexQuotes] = await Promise.all([
    getPortfolioSummary(userId).catch(() => null),
    getWatchlistView(userId).catch(() => []),
    getNotifications().catch(() => []),
    getSavedAnalyses().catch(() => []),
    getQuotes(INDEX_SYMBOLS).catch(() => []),
  ])

  const indices = (indexQuotes || []).map((q: any) => ({
    symbol: q.symbol,
    name: displayName(q.symbol, q.name),
    price: q.price,
    changePercent: q.changePercent,
  }))

  return (
    <DashboardClient
      name={user.name || "there"}
      portfolio={(portfolio || {}) as PortfolioSummary}
      watchlist={(watchlist || []) as WatchlistView[]}
      notifications={(notifications || []).map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      }))}
      analyses={(analyses || []).map((a: any) => ({
        id: a.id,
        symbol: a.symbol,
        kind: a.kind,
        summary: a.summary,
        confidence: a.confidence,
        direction: a.direction,
        createdAt: a.createdAt.toISOString(),
      }))}
      indices={indices}
    />
  )
}
