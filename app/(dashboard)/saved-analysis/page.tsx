import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { getSavedAnalyses } from "@/app/actions/saved-analysis"
import { SavedAnalysisClient } from "./saved-analysis-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Saved Analysis — Lumora AI",
  description: "Your saved AI market analyses.",
}

function safeIsoDate(val: any): string {
  if (!val) return new Date().toISOString()
  if (typeof val === "string") return val
  if (val instanceof Date) return isNaN(val.getTime()) ? new Date().toISOString() : val.toISOString()
  try {
    const d = new Date(val)
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

export default async function SavedAnalysisPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  const analyses = await getSavedAnalyses().catch(() => [])
  return (
    <SavedAnalysisClient
      analyses={analyses.map((a: any) => ({
        id: a.id,
        symbol: a.symbol,
        kind: a.kind,
        summary: a.summary,
        confidence: a.confidence,
        direction: a.direction,
        createdAt: safeIsoDate(a.createdAt),
      }))}
    />
  )
}
