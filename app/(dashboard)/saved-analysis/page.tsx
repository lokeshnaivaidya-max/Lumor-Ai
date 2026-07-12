import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { getSavedAnalyses } from "@/app/actions/saved-analysis"
import { SavedAnalysisClient } from "./saved-analysis-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Saved Analysis — Lumora AI",
  description: "Your saved AI market analyses.",
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
        createdAt: a.createdAt.toISOString(),
      }))}
    />
  )
}
