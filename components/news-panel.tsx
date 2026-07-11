"use client"

import { memo } from "react"
import useSWR from "swr"
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react"

type Sentiment = "positive" | "negative" | "neutral"

type NewsItem = {
  title: string
  publisher: string
  link: string
  publishedAt: number
  sentiment: Sentiment
  reason: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function relativeTime(ts: number) {
  const diff = Date.now() - ts
  const mins = Math.round(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

const SENTIMENT: Record<Sentiment, { label: string; cls: string; Icon: typeof TrendingUp }> = {
  positive: { label: "Positive", cls: "bg-pos/12 text-pos", Icon: TrendingUp },
  negative: { label: "Negative", cls: "bg-neg/12 text-neg", Icon: TrendingDown },
  neutral: { label: "Neutral", cls: "bg-white/10 text-muted-foreground", Icon: Minus },
}

function NewsPanelBase({ symbol }: { symbol: string }) {
  const { data, isLoading } = useSWR<{ items: NewsItem[]; overall: Sentiment; summary?: string }>(
    `/api/news?symbol=${encodeURIComponent(symbol)}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  )

  const items = data?.items ?? []
  const overall = data?.overall ?? "neutral"
  const OverallIcon = SENTIMENT[overall].Icon

  return (
    <div className="edge-light rounded-[1.5rem] glass-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-accent">
            <Newspaper className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-medium text-foreground">News & AI Sentiment</h3>
            <p className="text-xs text-muted-foreground">Real headlines, classified by Lumora AI</p>
          </div>
        </div>
        {items.length > 0 && (
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${SENTIMENT[overall].cls}`}>
            <OverallIcon className="h-3.5 w-3.5" />
            {SENTIMENT[overall].label}
          </span>
        )}
      </div>

      {data?.summary && <p className="mt-4 text-sm text-pretty text-muted-foreground">{data.summary}</p>}

      <div className="mt-4">
        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            Fetching and analyzing headlines…
          </div>
        ) : items.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">No recent headlines found for this instrument.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {items.map((n) => {
              const s = SENTIMENT[n.sentiment]
              return (
                <li key={n.link}>
                  <a
                    href={n.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start justify-between gap-4 rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-border hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${s.cls}`}>
                          <s.Icon className="h-3 w-3" />
                          {s.label}
                        </span>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {n.publisher} · {relativeTime(n.publishedAt)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-pretty text-sm text-foreground group-hover:text-foreground">{n.title}</p>
                      {n.reason && <p className="mt-0.5 text-xs text-muted-foreground">{n.reason}</p>}
                    </div>
                    <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export const NewsPanel = memo(NewsPanelBase)
