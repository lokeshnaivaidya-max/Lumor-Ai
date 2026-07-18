import { NextResponse } from "next/server"
import { getNews } from "@/lib/news"
import { displayName } from "@/lib/market"
import { generateNewsSentiment, getAiErrorDiagnostic } from "@/lib/ai/provider"
import { rateLimit, clientIp } from "@/lib/ratelimit"

export const runtime = "nodejs"
export const maxDuration = 30

type Sentiment = "positive" | "negative" | "neutral"

type AnalyzedNews = {
  title: string
  publisher: string
  link: string
  publishedAt: number
  sentiment: Sentiment
  reason: string
}

export async function GET(req: Request) {
  const rl = rateLimit(`news:${clientIp(req)}`, 10, 60_000)
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 })

  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol")?.trim()
  if (!symbol) return NextResponse.json({ items: [], overall: "neutral" })

  const raw = await getNews(symbol, 10)
  if (raw.length === 0) {
    return NextResponse.json({
      items: [],
      overall: "neutral",
      summary: "No recent headlines found for this instrument.",
    })
  }

  const analyzed: AnalyzedNews[] = raw.map((n) => ({
    title: n.title,
    publisher: n.publisher,
    link: n.link,
    publishedAt: n.publishedAt,
    sentiment: "neutral" as Sentiment,
    reason: "",
  }))
  let overall: Sentiment = "neutral"
  let summary = ""

  try {
    const result = await generateNewsSentiment({
      name: displayName(symbol),
      headlines: raw.map((n) => n.title),
    })
    overall = result.overall ?? "neutral"
    summary = result.summary ?? ""
    for (const item of result.items ?? []) {
      if (analyzed[item.index]) {
        analyzed[item.index].sentiment = item.sentiment ?? "neutral"
        analyzed[item.index].reason = item.reason ?? ""
      }
    }
  } catch (err) {
    console.error("[Lumora AI] News sentiment analysis failed", getAiErrorDiagnostic(err))
    // Graceful degradation: return real headlines with neutral sentiment.
  }

  return NextResponse.json({ items: analyzed, overall, summary })
}
