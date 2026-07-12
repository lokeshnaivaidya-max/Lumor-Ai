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
  const analyses = await getSavedAnalyses()
  return (
    <SavedAnalysisClient
      analyses={analyses.map((a) => ({
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
