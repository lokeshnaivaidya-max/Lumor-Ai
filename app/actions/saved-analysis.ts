"use server"

import { db } from "@/lib/db"
import { savedAnalysis } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { desc, eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type SavedAnalysisRow = typeof savedAnalysis.$inferSelect

export async function getSavedAnalyses(): Promise<SavedAnalysisRow[]> {
  const userId = await getUserId()
  return db
    .select()
    .from(savedAnalysis)
    .where(eq(savedAnalysis.userId, userId))
    .orderBy(desc(savedAnalysis.createdAt))
}

export async function saveAnalysis(input: {
  symbol: string
  name?: string
  kind?: string
  summary?: string
  confidence?: number
  direction?: string
  data?: unknown
}) {
  const userId = await getUserId()
  const symbol = input.symbol.trim().toUpperCase()
  if (!symbol) throw new Error("Symbol is required")

  const [row] = await db
    .insert(savedAnalysis)
    .values({
      userId,
      symbol,
      name: input.name ?? null,
      kind: input.kind ?? "analysis",
      summary: input.summary ?? null,
      confidence: input.confidence ?? null,
      direction: input.direction ?? "neutral",
      data: (input.data ?? null) as never,
    })
    .returning()
  revalidatePath("/saved-analysis")
  revalidatePath("/dashboard")
  return row
}

export async function deleteSavedAnalysis(id: number) {
  const userId = await getUserId()
  await db
    .delete(savedAnalysis)
    .where(and(eq(savedAnalysis.id, id), eq(savedAnalysis.userId, userId)))
  revalidatePath("/saved-analysis")
}
