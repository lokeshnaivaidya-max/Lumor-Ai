import { getCurrentUser } from "@/lib/session"
import { getWatchlistView, type WatchlistView } from "@/lib/portfolio"
import { WatchlistClient } from "./watchlist-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Watchlist — Lumora AI",
  description: "Track your favorite symbols with live prices.",
}

export default async function WatchlistPage() {
  const user = await getCurrentUser()
  const items = (await getWatchlistView(user!.id)) as WatchlistView[]
  return <WatchlistClient items={items} />
}
