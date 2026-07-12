"use server"

import { db } from "@/lib/db"
import { portfolioHolding } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type PortfolioHolding = typeof portfolioHolding.$inferSelect

export async function getPortfolio(): Promise<PortfolioHolding[]> {
  const userId = await getUserId()
  return db
    .select()
    .from(portfolioHolding)
    .where(eq(portfolioHolding.userId, userId))
    .orderBy(desc(portfolioHolding.updatedAt))
}

export async function addHolding(input: {
  symbol: string
  name?: string
  assetType?: string
  quantity: number
  avgPrice: number
}) {
  const userId = await getUserId()
  const symbol = input.symbol.trim().toUpperCase()
  if (!symbol) throw new Error("Symbol is required")
  if (!Number.isFinite(input.quantity) || input.quantity <= 0)
    throw new Error("Quantity must be greater than 0")
  if (!Number.isFinite(input.avgPrice) || input.avgPrice < 0)
    throw new Error("Average price must be 0 or greater")

  // Merge into an existing holding for the same symbol (weighted average).
  const existing = await db
    .select()
    .from(portfolioHolding)
    .where(
      and(
        eq(portfolioHolding.userId, userId),
        eq(portfolioHolding.symbol, symbol),
      ),
    )
    .limit(1)

  if (existing.length > 0) {
    const prev = existing[0]
    const prevQty = Number(prev.quantity)
    const prevPrice = Number(prev.avgPrice)
    const newQty = prevQty + input.quantity
    const newAvg =
      newQty > 0
        ? (prevQty * prevPrice + input.quantity * input.avgPrice) / newQty
        : input.avgPrice
    await db
      .update(portfolioHolding)
      .set({
        quantity: String(newQty),
        avgPrice: String(newAvg),
        name: input.name ?? prev.name,
        assetType: input.assetType ?? prev.assetType,
        updatedAt: new Date(),
      })
      .where(eq(portfolioHolding.id, prev.id))
  } else {
    await db.insert(portfolioHolding).values({
      userId,
      symbol,
      name: input.name ?? null,
      assetType: input.assetType ?? null,
      quantity: String(input.quantity),
      avgPrice: String(input.avgPrice),
    })
  }

  revalidatePath("/portfolio")
  revalidatePath("/dashboard")
}

export async function updateHolding(input: {
  id: number
  quantity: number
  avgPrice: number
}) {
  const userId = await getUserId()
  await db
    .update(portfolioHolding)
    .set({
      quantity: String(input.quantity),
      avgPrice: String(input.avgPrice),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(portfolioHolding.id, input.id),
        eq(portfolioHolding.userId, userId),
      ),
    )
  revalidatePath("/portfolio")
  revalidatePath("/dashboard")
}

export async function removeHolding(id: number) {
  const userId = await getUserId()
  await db
    .delete(portfolioHolding)
    .where(
      and(
        eq(portfolioHolding.id, id),
        eq(portfolioHolding.userId, userId),
      ),
    )
  revalidatePath("/portfolio")
  revalidatePath("/dashboard")
}
