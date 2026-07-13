export type OptionType = "CE" | "PE"

export type OptionContract = {
  strike: number
  type: OptionType
  expiry: string
  premium: number
  iv: number
  delta: number | null
  gamma: number | null
  theta: number | null
  vega: number | null
  openInterest: number
  volume: number
  change: number
  changePercent: number
}

export type OptionChainData = {
  symbol: string
  underlyingPrice: number
  underlyingChange: number
  underlyingChangePercent: number
  expiries: string[]
  expiry: string
  contracts: OptionContract[]
  pcr: number | null
  maxPain: number | null
  provider: string
}

export type OptionChainRequest = {
  symbol: string
  expiry?: string
}

export interface OptionsProvider {
  readonly name: string
  isAvailable(): boolean
  getOptionChain(request: OptionChainRequest): Promise<OptionChainData | null>
}

const YF_HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"]
const UAS = ["Mozilla/5.0", "Mozilla/5.0 (compatible; Lumora/1.0)", "curl/8.4.0"]

let crumbOptCache: { crumb: string; cookie: string; at: number } | null = null

async function getYfCrumb(): Promise<{ crumb: string; cookie: string } | null> {
  if (crumbOptCache && Date.now() - crumbOptCache.at < 30 * 60 * 1000) {
    return { crumb: crumbOptCache.crumb, cookie: crumbOptCache.cookie }
  }
  try {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    const c1 = await fetch("https://fc.yahoo.com", { headers: { "User-Agent": ua } })
    let cookie = c1.headers.get("set-cookie") ?? ""
    if (!cookie) {
      const c2 = await fetch("https://finance.yahoo.com", { headers: { "User-Agent": ua } })
      cookie = c2.headers.get("set-cookie") ?? ""
    }
    cookie = cookie.split(";")[0] ?? ""
    const res = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
      headers: { "User-Agent": ua, Accept: "text/plain", ...(cookie ? { Cookie: cookie } : {}) },
    })
    const crumb = (await res.text()).trim()
    if (!crumb || crumb.includes("<")) return null
    crumbOptCache = { crumb, cookie, at: Date.now() }
    return { crumb, cookie }
  } catch {
    return null
  }
}

async function yfFetchJson(path: string, retries = 2): Promise<any> {
  let lastErr: unknown
  for (let i = 0; i <= retries; i++) {
    const host = YF_HOSTS[i % YF_HOSTS.length]
    const ua = UAS[i % UAS.length]
    try {
      const res = await fetch(`${host}${path}`, {
        headers: { "User-Agent": ua, Accept: "application/json" },
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

export class YahooFinanceOptionsProvider implements OptionsProvider {
  readonly name = "Yahoo Finance"

  isAvailable(): boolean {
    return true
  }

  async getOptionChain(request: OptionChainRequest): Promise<OptionChainData | null> {
    const symbol = request.symbol
    const yfSymbol = this.toYahooSymbol(symbol)

    try {
      const auth = await getYfCrumb()
      const crumbQs = auth?.crumb ? `?crumb=${encodeURIComponent(auth.crumb)}` : ""

      const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      const url = `https://query1.finance.yahoo.com/v7/finance/options/${encodeURIComponent(yfSymbol)}${crumbQs}`

      const headers: Record<string, string> = { "User-Agent": ua, Accept: "application/json" }
      if (auth?.cookie) headers.Cookie = auth.cookie
      const res = await fetch(url, { headers })
      if (!res.ok) return null
      const json = await res.json()
      const opt = json?.optionChain?.result?.[0]
      if (!opt) return null

      const underlyingPrice = opt.quote?.regularMarketPrice ?? opt.underlyingPrice ?? 0
      const underlyingChange = opt.quote?.regularMarketChange ?? 0
      const underlyingChangePercent = opt.quote?.regularMarketChangePercent ?? 0
      const expirations: string[] = opt.expirationDates?.map((e: number) => {
        const d = new Date(e * 1000)
        return d.toISOString().slice(0, 10)
      }) ?? []

      const expiry = request.expiry ?? expirations[0] ?? ""

      const options = opt.options?.[0]
      if (!options) return null

      const calls: OptionContract[] = (options.calls ?? []).map((c: any) => ({
        strike: Number(c.strike ?? 0),
        type: "CE" as OptionType,
        expiry,
        premium: Number(c.lastPrice ?? c.ask ?? 0),
        iv: c.impliedVolatility != null ? Number(c.impliedVolatility) * 100 : 0,
        delta: c.greeks?.delta != null ? Number(c.greeks.delta) : null,
        gamma: c.greeks?.gamma != null ? Number(c.greeks.gamma) : null,
        theta: c.greeks?.theta != null ? Number(c.greeks.theta) : null,
        vega: c.greeks?.vega != null ? Number(c.greeks.vega) : null,
        openInterest: Number(c.openInterest ?? 0),
        volume: Number(c.volume ?? 0),
        change: Number(c.change ?? 0),
        changePercent: Number(c.percentChange ?? 0),
      }))

      const puts: OptionContract[] = (options.puts ?? []).map((p: any) => ({
        strike: Number(p.strike ?? 0),
        type: "PE" as OptionType,
        expiry,
        premium: Number(p.lastPrice ?? p.bid ?? 0),
        iv: p.impliedVolatility != null ? Number(p.impliedVolatility) * 100 : 0,
        delta: p.greeks?.delta != null ? Number(p.greeks.delta) : null,
        gamma: p.greeks?.gamma != null ? Number(p.greeks.gamma) : null,
        theta: p.greeks?.theta != null ? Number(p.greeks.theta) : null,
        vega: p.greeks?.vega != null ? Number(p.greeks.vega) : null,
        openInterest: Number(p.openInterest ?? 0),
        volume: Number(p.volume ?? 0),
        change: Number(p.change ?? 0),
        changePercent: Number(p.percentChange ?? 0),
      }))

      const allContracts = [...calls, ...puts]
      if (allContracts.length === 0) return null

      const totalCallOI = calls.reduce((s, c) => s + c.openInterest, 0)
      const totalPutOI = puts.reduce((s, p) => s + p.openInterest, 0)
      const pcr = totalPutOI > 0 && totalCallOI > 0 ? totalPutOI / totalCallOI : null

      let maxPain: number | null = null
      let minPain = Infinity
      for (const c of calls) {
        let pain = 0
        const strike = c.strike
        for (const cc of calls) pain += Math.max(0, strike - cc.strike) * cc.openInterest
        for (const pp of puts) pain += Math.max(0, pp.strike - strike) * pp.openInterest
        if (pain < minPain) {
          minPain = pain
          maxPain = strike
        }
      }

      return {
        symbol,
        underlyingPrice,
        underlyingChange,
        underlyingChangePercent,
        expiries: expirations,
        expiry,
        contracts: allContracts,
        pcr,
        maxPain,
        provider: this.name,
      }
    } catch {
      return null
    }
  }

  private toYahooSymbol(symbol: string): string {
    const map: Record<string, string> = {
      "^NSEI": "NIFTY",
      "^NSEBANK": "BANKNIFTY",
      "^BSESN": "SENSEX",
      "NIFTY_FIN_SERVICE.NS": "NIFTY_FIN_SERVICE",
    }
    return map[symbol] ?? symbol.replace(/\.NS$/, "").replace(/\.BO$/, "")
  }
}

export const providers: OptionsProvider[] = [
  new YahooFinanceOptionsProvider(),
]

export async function getOptionChain(request: OptionChainRequest): Promise<OptionChainData | null> {
  for (const provider of providers) {
    if (!provider.isAvailable()) continue
    try {
      const result = await provider.getOptionChain(request)
      if (result) return result
    } catch {
      continue
    }
  }
  return null
}
