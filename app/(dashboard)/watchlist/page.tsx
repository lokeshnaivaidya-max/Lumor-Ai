import { WatchlistClient } from "./watchlist-client"

export const metadata = {
  title: "Watchlist — Lumora AI",
  description: "Track your favorite stocks with live prices, AI ratings, and quick analysis.",
}

export default function WatchlistPage() {
  return <WatchlistClient />
}
