// Real financial news via Yahoo Finance search endpoint (no API key required).

import { resolveSymbol } from "@/lib/market"

export type NewsItem = {
  uuid: string
  title: string
  publisher: string
  link: string
  publishedAt: number
  relatedTickers?: string[]
  thumbnail?: string
}

const YF_HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"]
const UAS = ["Mozilla/5.0", "Mozilla/5.0 (compatible; Lumora/1.0)", "curl/8.4.0"]

async function fetchJson(path: string, revalidate = 300, retries = 2): Promise<any> {
  let lastErr: unknown
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(`${YF_HOSTS[i % YF_HOSTS.length]}${path}`, {
        headers: { "User-Agent": UAS[i % UAS.length], Accept: "application/json" },
        next: { revalidate },
      })
      if (res.ok) return await res.json()
      lastErr = new Error(`HTTP ${res.status}`)
      await new Promise((r) => setTimeout(r, 250 * (i + 1)))
    } catch (err) {
      lastErr = err
      await new Promise((r) => setTimeout(r, 250 * (i + 1)))
    }
  }
  throw lastErr
}

export async function getNews(symbol: string, count = 10): Promise<NewsItem[]> {
  const resolved = resolveSymbol(symbol)
  try {
    const path = `/v1/finance/search?q=${encodeURIComponent(resolved)}&quotesCount=0&newsCount=${count}`
    const json = await fetchJson(path)
    const news = json?.news ?? []
    return news
      .filter((n: Record<string, unknown>) => n.title && n.link)
      .map((n: any): NewsItem => ({
        uuid: String(n.uuid ?? n.link),
        title: String(n.title),
        publisher: String(n.publisher ?? "—"),
        link: String(n.link),
        publishedAt: n.providerPublishTime ? Number(n.providerPublishTime) * 1000 : Date.now(),
        relatedTickers: Array.isArray(n.relatedTickers) ? n.relatedTickers.map(String) : undefined,
        thumbnail: n.thumbnail?.resolutions?.[0]?.url ? String(n.thumbnail.resolutions[0].url) : undefined,
      }))
  } catch {
    return []
  }
}
