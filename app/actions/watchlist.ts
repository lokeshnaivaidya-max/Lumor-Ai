"use server"

import { db } from "@/lib/db"
import { watchlistItem } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type WatchlistItem = typeof watchlistItem.$inferSelect

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const userId = await getUserId()
  return db
    .select()
    .from(watchlistItem)
    .where(eq(watchlistItem.userId, userId))
    .orderBy(desc(watchlistItem.createdAt))
}

export async function addToWatchlist(input: {
  symbol: string
  name?: string
  assetType?: string
}) {
  const userId = await getUserId()
  const symbol = input.symbol.trim().toUpperCase()
  if (!symbol) throw new Error("Symbol is required")

  await db
    .insert(watchlistItem)
    .values({
      userId,
      symbol,
      name: input.name ?? null,
      assetType: input.assetType ?? null,
    })
    .onConflictDoNothing()

  revalidatePath("/watchlist")
  revalidatePath("/dashboard")
}

export async function removeFromWatchlist(symbol: string) {
  const userId = await getUserId()
  await db
    .delete(watchlistItem)
    .where(
      and(
        eq(watchlistItem.userId, userId),
        eq(watchlistItem.symbol, symbol.trim().toUpperCase()),
      ),
    )
  revalidatePath("/watchlist")
  revalidatePath("/dashboard")
}

export async function isWatched(symbol: string): Promise<boolean> {
  const userId = await getUserId()
  const rows = await db
    .select({ id: watchlistItem.id })
    .from(watchlistItem)
    .where(
      and(
        eq(watchlistItem.userId, userId),
        eq(watchlistItem.symbol, symbol.trim().toUpperCase()),
      ),
    )
    .limit(1)
  return rows.length > 0
}
