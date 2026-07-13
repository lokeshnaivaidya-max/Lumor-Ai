import { resolveSymbol, displayName } from "@/lib/market"

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

const SECTOR_KEYWORDS: Record<string, string[]> = {
  "INFY.NS": ["infosys", "infy", "tcs", "wipro", "accenture", "hcl", "tech mahindra", "it services", "indian it", "techm", "l&t infotech", "ltim", "mindtree", "persistent", "coforge", "cyient", "firstsource"],
  "TCS.NS": ["tcs", "tata consultancy", "infosys", "infy", "wipro", "accenture", "hcl", "it services", "indian it"],
  "RELIANCE.NS": ["reliance", "ril", "jio", "reliance industries", "reliance retail", "reliance digital", "oil & gas india", "mukesh ambani"],
  "HDFCBANK.NS": ["hdfc bank", "hdfcbank", "hdfc", "banking india", "private bank india"],
  "ICICIBANK.NS": ["icici bank", "icici", "private bank india", "banking india"],
  "SBIN.NS": ["sbi", "state bank", "banking india", "psu bank"],
  "LT.NS": ["larsen", "l&t", "larsen & toubro", "infrastructure india", "engineering india"],
  "WIPRO.NS": ["wipro", "it services india", "indian it"],
}

const COMPANY_NAMES: Record<string, string[]> = {
  "AAPL": ["apple", "aapl", "iphone", "ipad", "macbook", "tim cook", "app store", "apple music"],
  "MSFT": ["microsoft", "msft", "windows", "azure", "office 365", "satya nadella", "copilot", "xbox", "linkedin", "activision"],
  "GOOGL": ["google", "alphabet", "googl", "goog", "youtube", "pixel", "gmail", "google cloud", "sundar pichai", "deepmind", "gemini", "waymo"],
  "AMZN": ["amazon", "amzn", "aws", "alexa", "prime video", "whole foods", "jeff bezos", "andy jassy", "amazon web services"],
  "NVDA": ["nvidia", "nvda", "jensen huang", "geforce", "cuda", "h100", "b200", "blackwell", "hopper", "gpu", "ai chip"],
  "META": ["meta", "facebook", "instagram", "whatsapp", "mark zuckerberg", "threads", "oculus", "metaverse", "llama", "reels"],
  "TSLA": ["tesla", "tsla", "elon musk", "model 3", "model y", "cybertruck", "full self driving", "gigafactory", "tesla energy", "powerwall"],
  "AMD": ["amd", "advanced micro", "radeon", "ryzen", "epyc", "lisa su", "fpg", "xilinx"],
  "NFLX": ["netflix", "nflx", "streaming", "reed hastings", "ted sarandos", "squid game", "stranger things"],
  "INTC": ["intel", "intc", "pat gelsinger", "core ultra", "xeon", "foundry", "altera", "mobileye"],
  "ORCL": ["oracle", "orcl", "larry ellison", "safra catz", "oracle cloud", "oci"],
}

const GLOBAL_SECTOR_KNOWN: Record<string, string[]> = {
  "AAPL": ["aapl", "apple", "iphone"],
  "MSFT": ["msft", "microsoft"],
  "GOOGL": ["googl", "goog", "alphabet", "google"],
  "AMZN": ["amzn", "amazon"],
  "NVDA": ["nvda", "nvidia"],
  "META": ["meta", "facebook"],
  "TSLA": ["tsla", "tesla"],
  "AMD": ["amd"],
  "NFLX": ["nflx", "netflix"],
}

function isCompanySpecific(title: string, symbol: string): boolean {
  const lower = title.toLowerCase()
  const bare = symbol.replace(/\.NS$|\.BO$|=X|-USD$|\^/g, "").toLowerCase()

  const names = COMPANY_NAMES[symbol] ?? []
  for (const kw of names) {
    if (lower.includes(kw.toLowerCase())) return true
  }

  const sectorKws = SECTOR_KEYWORDS[symbol] ?? []
  for (const kw of sectorKws) {
    if (lower.includes(kw.toLowerCase())) return true
  }

  const known = GLOBAL_SECTOR_KNOWN[symbol] ?? []
  for (const kw of known) {
    if (lower.includes(kw.toLowerCase())) return true
  }

  if (lower.includes(bare)) return true

  return false
}

export async function getNews(symbol: string, count = 10): Promise<NewsItem[]> {
  const resolved = resolveSymbol(symbol)
  try {
    const path = `/v1/finance/search?q=${encodeURIComponent(resolved)}&quotesCount=0&newsCount=${count * 2}`
    const json = await fetchJson(path)
    const news = json?.news ?? []
    const raw: NewsItem[] = news
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

    const filtered = raw.filter((n) => {
      if (isCompanySpecific(n.title, symbol)) return true
      if (n.relatedTickers?.some((t) => t.toUpperCase() === symbol)) return true
      const relatedSymbols = n.relatedTickers ?? []
      if (relatedSymbols.some((t) => t.replace(/\.NS$/, "").toUpperCase() === symbol.replace(/\.NS$/, "").toUpperCase())) return true
      return false
    })

    return filtered.length > 0 ? filtered.slice(0, count) : []
  } catch {
    return []
  }
}
