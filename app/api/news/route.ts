import { NextResponse } from "next/server"
import { generateText } from "ai"
import { getNews } from "@/lib/news"
import { displayName } from "@/lib/market"
import { AI_MODEL_FAST } from "@/lib/ai"

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
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol")?.trim()
  if (!symbol) return NextResponse.json({ items: [], overall: "neutral" })

  const raw = await getNews(symbol, 10)
  if (raw.length === 0) {
    return NextResponse.json({ items: [], overall: "neutral", summary: "No recent headlines found for this instrument." })
  }

  const name = displayName(symbol)
  const headlines = raw.map((n, i) => `${i}. "${n.title}" — ${n.publisher}`).join("\n")

  let analyzed: AnalyzedNews[] = raw.map((n) => ({
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
    const { text } = await generateText({
      model: AI_MODEL_FAST,
      temperature: 0.2,
      system: `You are a financial news sentiment analyst. Classify each headline's likely impact on ${name} as "positive", "negative", or "neutral" FROM AN INVESTOR'S PERSPECTIVE. Base it only on the headline text. Respond with STRICT JSON only, no markdown fences.`,
      prompt: `Headlines:\n${headlines}\n\nReturn JSON of this exact shape:
{"overall":"positive|negative|neutral","summary":"one sentence overall read","items":[{"index":0,"sentiment":"positive|negative|neutral","reason":"max 12 words why"}]}`,
    })

    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim()
    const parsed = JSON.parse(cleaned) as {
      overall?: Sentiment
      summary?: string
      items?: { index: number; sentiment: Sentiment; reason: string }[]
    }
    if (parsed.overall) overall = parsed.overall
    if (parsed.summary) summary = parsed.summary
    for (const item of parsed.items ?? []) {
      if (analyzed[item.index]) {
        analyzed[item.index].sentiment = item.sentiment ?? "neutral"
        analyzed[item.index].reason = item.reason ?? ""
      }
    }
  } catch (err) {
    console.log("[v0] news sentiment error:", err instanceof Error ? err.message : String(err))
    // Graceful degradation: return headlines with neutral sentiment.
  }

  return NextResponse.json({ items: analyzed, overall, summary })
}
