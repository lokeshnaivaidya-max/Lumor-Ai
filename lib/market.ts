// Real market data layer backed by Yahoo Finance public endpoints.
// No paid API key required. Uses a cookie+crumb handshake to unlock the richer
// v7 quote endpoint (market cap, P/E, EPS, dividend, etc.) and falls back to the
// always-open v8 chart endpoint for price/state so the app never shows empty UI.

export type MarketState = "PRE" | "REGULAR" | "POST" | "CLOSED"

export type AssetType =
  | "EQUITY"
  | "ETF"
  | "INDEX"
  | "CRYPTOCURRENCY"
  | "CURRENCY"
  | "COMMODITY"
  | "FUTURE"
  | "OTHER"

export type Quote = {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  currency: string
  exchange: string
  marketState: MarketState
  previousClose: number
  open?: number
  dayHigh?: number
  dayLow?: number
  volume?: number
  avgVolume?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  marketCap?: number
  trailingPE?: number
  forwardPE?: number
  eps?: number
  dividendYield?: number
  beta?: number
  sector?: string
  industry?: string
  headquarters?: string
  ceo?: string
  founded?: number
  employees?: number
  phone?: string
  assetType?: AssetType
  timezone?: string
  logoUrl?: string
  website?: string
  nextEventAt?: number
  updatedAt: number
}

export type Candle = {
  t: number
  o: number
  h: number
  l: number
  c: number
  v: number
}

const YF_HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"]
const UAS = ["Mozilla/5.0", "Mozilla/5.0 (compatible; Lumora/1.0)", "curl/8.4.0"]

async function fetchJson(path: string, revalidate = 30, retries = 3): Promise<any> {
  let lastErr: unknown
  for (let i = 0; i <= retries; i++) {
    const host = YF_HOSTS[i % YF_HOSTS.length]
    const ua = UAS[i % UAS.length]
    try {
      const res = await fetch(`${host}${path}`, {
        headers: { "User-Agent": ua, Accept: "application/json" },
        next: { revalidate },
      })
      if (res.ok) return await res.json()
      lastErr = new Error(`HTTP ${res.status}`)
      const wait = res.status === 429 ? 500 * (i + 1) : 200 * (i + 1)
      await new Promise((r) => setTimeout(r, wait))
    } catch (err) {
      lastErr = err
      await new Promise((r) => setTimeout(r, 250 * (i + 1)))
    }
  }
  throw lastErr
}

/* -------------------------------------------------------------------------- */
/* Symbol resolution — friendly names / aliases -> Yahoo tickers               */
/* -------------------------------------------------------------------------- */

const ALIASES: Record<string, string> = {
  // US indices
  "NASDAQ": "^IXIC",
  "NASDAQ COMPOSITE": "^IXIC",
  "S&P 500": "^GSPC",
  "SP500": "^GSPC",
  "SPX": "^GSPC",
  "DOW": "^DJI",
  "DOW JONES": "^DJI",
  "DJIA": "^DJI",
  "RUSSELL 2000": "^RUT",
  "VIX": "^VIX",
  // Indian indices
  "NIFTY": "^NSEI",
  "NIFTY 50": "^NSEI",
  "NIFTY50": "^NSEI",
  "BANK NIFTY": "^NSEBANK",
  "BANKNIFTY": "^NSEBANK",
  "NIFTY BANK": "^NSEBANK",
  "SENSEX": "^BSESN",
  "BSE SENSEX": "^BSESN",
  "BANKEX": "^BSEBANK",
  "FINNIFTY": "NIFTY_FIN_SERVICE.NS",
  "FIN NIFTY": "NIFTY_FIN_SERVICE.NS",
  "NIFTY NEXT 50": "^NSMIDCP",
  "NIFTY MIDCAP": "^NSMIDCP",
  "MIDCPNIFTY": "^NSMIDCP",
  "NIFTY IT": "^CNXIT",
  "NIFTY AUTO": "^CNXAUTO",
  "NIFTY FMCG": "^CNXFMCG",
  "NIFTY PHARMA": "^CNXPHARMA",
  "NIFTY METAL": "^CNXMETAL",
  "NIFTY PSU BANK": "^CNXPSUBANK",
  "NIFTY ENERGY": "^CNXENERGY",
  "NIFTY REALTY": "^CNXREALTY",
  "NIFTY MEDIA": "^CNXMEDIA",
  "NIFTY CONSUMPTION": "^CNXCONSUM",
  "NIFTY COMMODITIES": "^CNXCOM",
  "NIFTY SERVICES": "^CNXSERVICE",
  "NIFTY100": "^CNX100",
  "NIFTY 100": "^CNX100",
  "NIFTY200": "^CNX200",
  "NIFTY 200": "^CNX200",
  "NIFTY500": "^CNX500",
  "NIFTY 500": "^CNX500",
  // Other regional indices
  "FTSE": "^FTSE",
  "FTSE 100": "^FTSE",
  "NIKKEI": "^N225",
  "NIKKEI 225": "^N225",
  "HANG SENG": "^HSI",
  "DAX": "^GDAXI",
  "CAC 40": "^FCHI",
  "ASX 200": "^AXJO",
  "SHANGHAI": "000001.SS",
  "SHANGHAI COMPOSITE": "000001.SS",
  "SHENZHEN": "399001.SZ",
  "KOSPI": "^KS11",
  "TAIWAN": "^TWII",
  "NIFTY MIDCAP 100": "^NSMIDCP",
  // Commodities / Futures
  "GOLD": "GC=F",
  "GOLD FUTURES": "GC=F",
  "SILVER": "SI=F",
  "SILVER FUTURES": "SI=F",
  "CRUDE OIL": "CL=F",
  "CRUDE": "CL=F",
  "WTI": "CL=F",
  "BRENT": "BZ=F",
  "NATURAL GAS": "NG=F",
  "COPPER": "HG=F",
  "PLATINUM": "PL=F",
  "PALLADIUM": "PA=F",
  "NIFTY FUT": "^NSEI",
  "NIFTY FUTURES": "^NSEI",
  "BANKNIFTY FUT": "^NSEBANK",
  "BANKNIFTY FUTURES": "^NSEBANK",
  // Crypto
  "BITCOIN": "BTC-USD",
  "BTC": "BTC-USD",
  "ETHEREUM": "ETH-USD",
  "ETH": "ETH-USD",
  "SOLANA": "SOL-USD",
  "SOL": "SOL-USD",
  "DOGECOIN": "DOGE-USD",
  "DOGE": "DOGE-USD",
  "BNB": "BNB-USD",
  "ADA": "ADA-USD",
  "CARDANO": "ADA-USD",
  "XRP": "XRP-USD",
  "RIPPLE": "XRP-USD",
  "DOT": "DOT-USD",
  "POLKADOT": "DOT-USD",
  "AVAX": "AVAX-USD",
  "AVALANCHE": "AVAX-USD",
  "MATIC": "MATIC-USD",
  "LINK": "LINK-USD",
  "CHAINLINK": "LINK-USD",
  "UNI": "UNI-USD",
  "UNISWAP": "UNI-USD",
  "ATOM": "ATOM-USD",
  "LTC": "LTC-USD",
  "LITECOIN": "LTC-USD",
  "BCH": "BCH-USD",
  "BITCOIN CASH": "BCH-USD",
  "TRX": "TRX-USD",
  "TRON": "TRX-USD",
  "NEAR": "NEAR-USD",
  "APT": "APT-USD",
  "APTOS": "APT-USD",
  "SUI": "SUI-USD",
  "ARB": "ARB-USD",
  "ARBITRUM": "ARB-USD",
  "OP": "OP-USD",
  "OPTIMISM": "OP-USD",
  "PEPE": "PEPE-USD",
  "SHIB": "SHIB-USD",
  "SHIBA INU": "SHIB-USD",
  // Currencies / Forex
  "USDINR": "INR=X",
  "USD/INR": "INR=X",
  "EURINR": "EURINR=X",
  "EUR/INR": "EURINR=X",
  "GBPINR": "GBPINR=X",
  "GBP/INR": "GBPINR=X",
  "JPYINR": "JPYINR=X",
  "JPY/INR": "JPYINR=X",
  "EURUSD": "EURUSD=X",
  "EUR/USD": "EURUSD=X",
  "GBPUSD": "GBPUSD=X",
  "GBP/USD": "GBPUSD=X",
  "USDJPY": "JPY=X",
  "USD/JPY": "JPY=X",
  "USDGBP": "GBP=X",
  "USD/GBP": "GBP=X",
  "USDEUR": "EURUSD=X",
  "USD/EUR": "EURUSD=X",
  "GBPJPY": "GBPJPY=X",
  "GBP/JPY": "GBPJPY=X",
  "EURJPY": "EURJPY=X",
  "EUR/JPY": "EURJPY=X",
  "AUDUSD": "AUDUSD=X",
  "AUD/USD": "AUDUSD=X",
  "USDCAD": "CAD=X",
  "USD/CAD": "CAD=X",
  "USDCHF": "CHF=X",
  "USD/CHF": "CHF=X",
  "NZDUSD": "NZDUSD=X",
  "NZD/USD": "NZDUSD=X",
  "EURGBP": "EURGBP=X",
  "EUR/GBP": "EURGBP=X",
  "USDSGD": "SGD=X",
  "USD/SGD": "SGD=X",
  "USDHKD": "HKD=X",
  "USD/HKD": "HKD=X",
  // Popular Indian stocks (bare ticker -> NSE)
  "RELIANCE": "RELIANCE.NS",
  "TCS": "TCS.NS",
  "INFY": "INFY.NS",
  "INFOSYS": "INFY.NS",
  "HDFCBANK": "HDFCBANK.NS",
  "HDFC": "HDFCBANK.NS",
  "ICICIBANK": "ICICIBANK.NS",
  "ICICI": "ICICIBANK.NS",
  "SBIN": "SBIN.NS",
  "SBI": "SBIN.NS",
  "WIPRO": "WIPRO.NS",
  "TATAMOTORS": "TATAMOTORS.NS",
  "TATA MOTORS": "TATAMOTORS.NS",
  "ADANIENT": "ADANIENT.NS",
  "ADANI ENTERPRISES": "ADANIENT.NS",
  "LT": "LT.NS",
  "L&T": "LT.NS",
  "LARSEN": "LT.NS",
  "AXISBANK": "AXISBANK.NS",
  "AXIS": "AXISBANK.NS",
  "KOTAKBANK": "KOTAKBANK.NS",
  "KOTAK": "KOTAKBANK.NS",
  "BHARTIARTL": "BHARTIARTL.NS",
  "AIRTEL": "BHARTIARTL.NS",
  "ITC": "ITC.NS",
  "MARUTI": "MARUTI.NS",
  "MARUTI SUZUKI": "MARUTI.NS",
  "SUNPHARMA": "SUNPHARMA.NS",
  "SUN PHARMA": "SUNPHARMA.NS",
  "TITAN": "TITAN.NS",
  "NTPC": "NTPC.NS",
  "ONGC": "ONGC.NS",
  "POWERGRID": "POWERGRID.NS",
  "ULTRACEMCO": "ULTRACEMCO.NS",
  "ULTRATECH": "ULTRACEMCO.NS",
  "HCLTECH": "HCLTECH.NS",
  "HCL": "HCLTECH.NS",
  "BAJFINANCE": "BAJFINANCE.NS",
  "BAJAJ FINANCE": "BAJFINANCE.NS",
  "BAJAJFINSV": "BAJAJFINSV.NS",
  "ASIANPAINT": "ASIANPAINT.NS",
  "ASIAN PAINTS": "ASIANPAINT.NS",
  "HINDUNILVR": "HINDUNILVR.NS",
  "HUL": "HINDUNILVR.NS",
  "DMART": "DMART.NS",
  "JSWSTEEL": "JSWSTEEL.NS",
  "TATASTEEL": "TATASTEEL.NS",
  "TATA STEEL": "TATASTEEL.NS",
  "COALINDIA": "COALINDIA.NS",
  "IOC": "IOC.NS",
  "BPCL": "BPCL.NS",
  "HINDALCO": "HINDALCO.NS",
  "GRASIM": "GRASIM.NS",
  "ADANIPORTS": "ADANIPORTS.NS",
  "ADANI PORTS": "ADANIPORTS.NS",
  "EICHERMOT": "EICHERMOT.NS",
  "EICHER": "EICHERMOT.NS",
  "DIVISLAB": "DIVISLAB.NS",
  "DIVIS": "DIVISLAB.NS",
  "DRREDDY": "DRREDDY.NS",
  "DR REDDY": "DRREDDY.NS",
  "CIPLA": "CIPLA.NS",
  "PIDILITIND": "PIDILITIND.NS",
  "PIDILITE": "PIDILITIND.NS",
  "BRITANNIA": "BRITANNIA.NS",
  "APOLLOHOSP": "APOLLOHOSP.NS",
  "APOLLO HOSPITALS": "APOLLOHOSP.NS",
  "NESTLEIND": "NESTLEIND.NS",
  "NESTLE": "NESTLEIND.NS",
  "M&M": "M&M.NS",
  "MAHINDRA": "M&M.NS",
  "TECHM": "TECHM.NS",
  "TECH MAHINDRA": "TECHM.NS",
  "TATACONSUM": "TATACONSUM.NS",
  "TATA CONSUMER": "TATACONSUM.NS",
  "SHRIRAMFIN": "SHRIRAMFIN.NS",
  "TRENT": "TRENT.NS",
  "ZOMATO": "ZOMATO.NS",
  "ICICIPRULI": "ICICIPRULI.NS",
  "HDFCLIFE": "HDFCLIFE.NS",
  "SBILIFE": "SBILIFE.NS",
  "MARICO": "MARICO.NS",
  "DABUR": "DABUR.NS",
  "HAVELLS": "HAVELLS.NS",
  "TORNTPHARM": "TORNTPHARM.NS",
  "GODREJCP": "GODREJCP.NS",
  "BERGEPAINT": "BERGEPAINT.NS",
  "VOLTAS": "VOLTAS.NS",
  "SIEMENS": "SIEMENS.NS",
  "ABB": "ABB.NS",
  "COLPAL": "COLPAL.NS",
  "AMBUJACEM": "AMBUJACEM.NS",
  "MUTHOOTFIN": "MUTHOOTFIN.NS",
  "INDUSTOWER": "INDUSTOWER.NS",
  "NAUKRI": "NAUKRI.NS",
  "BANDHANBNK": "BANDHANBNK.NS",
  "BANDHAN": "BANDHANBNK.NS",
  "ICICIGI": "ICICIGI.NS",
  "ASTRAL": "ASTRAL.NS",
  "DIXON": "DIXON.NS",
  "BEL": "BEL.NS",
  "DLF": "DLF.NS",
  "IRCTC": "IRCTC.NS",
  "HAL": "HAL.NS",
  "VEDL": "VEDL.NS",
  "VEDANTA": "VEDL.NS",
  "GAIL": "GAIL.NS",
  "SAIL": "SAIL.NS",
  "BHEL": "BHEL.NS",
  "LIC": "LIC.NS",
  "LIC INDIA": "LIC.NS",
  // BSE variants
  "RELIANCE.BO": "RELIANCE.BO",
  "TCS.BO": "TCS.BO",
  "INFY.BO": "INFY.BO",
  "HDFCBANK.BO": "HDFCBANK.BO",
  "SBIN.BO": "SBIN.BO",
}

export function resolveSymbol(input: string): string {
  const raw = input.trim()
  if (!raw) return raw
  const upper = raw.toUpperCase()
  if (ALIASES[upper]) return ALIASES[upper]
  return raw
}

/* -------------------------------------------------------------------------- */
/* Cookie + crumb handshake (unlocks v7 quote with fundamentals)               */
/* -------------------------------------------------------------------------- */

let crumbCache: { crumb: string; cookie: string; at: number } | null = null

async function getCrumb(): Promise<{ crumb: string; cookie: string } | null> {
  if (crumbCache && Date.now() - crumbCache.at < 30 * 60 * 1000) {
    return { crumb: crumbCache.crumb, cookie: crumbCache.cookie }
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
    crumbCache = { crumb, cookie, at: Date.now() }
    return { crumb, cookie }
  } catch {
    return null
  }
}

/* -------------------------------------------------------------------------- */
/* Market-state derivation                                                     */
/* -------------------------------------------------------------------------- */

type Meta = Record<string, unknown> & {
  currentTradingPeriod?: {
    pre?: { start: number; end: number }
    regular?: { start: number; end: number }
    post?: { start: number; end: number }
  }
}

function deriveState(meta: Meta): { state: MarketState; nextEventAt?: number } {
  const now = Math.floor(Date.now() / 1000)
  const p = meta.currentTradingPeriod
  if (!p?.regular) return { state: "CLOSED" }
  const { pre, regular, post } = p
  if (regular && now >= regular.start && now < regular.end) return { state: "REGULAR", nextEventAt: regular.end * 1000 }
  if (pre && now >= pre.start && now < pre.end) return { state: "PRE", nextEventAt: regular.start * 1000 }
  if (post && now >= post.start && now < post.end) return { state: "POST", nextEventAt: post.end * 1000 }
  const next = (pre?.start ?? regular.start) * 1000
  return { state: "CLOSED", nextEventAt: next > Date.now() ? next : undefined }
}

function mapAssetType(t?: string): AssetType {
  switch ((t ?? "").toUpperCase()) {
    case "EQUITY":
      return "EQUITY"
    case "ETF":
      return "ETF"
    case "INDEX":
      return "INDEX"
    case "CRYPTOCURRENCY":
      return "CRYPTOCURRENCY"
    case "CURRENCY":
      return "CURRENCY"
    case "FUTURE":
      return "COMMODITY"
    default:
      return "OTHER"
  }
}

/* -------------------------------------------------------------------------- */
/* Quote — merges v8 chart meta (price/state) + v7 quote (fundamentals)        */
/* -------------------------------------------------------------------------- */

async function fetchChartMeta(symbol: string): Promise<Partial<Quote> | null> {
  try {
    const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`
    const json = await fetchJson(path, 20)
    const meta: Meta | undefined = json?.chart?.result?.[0]?.meta
    if (!meta) return null
    const price = Number(meta.regularMarketPrice ?? 0)
    const prev = Number(meta.chartPreviousClose ?? meta.previousClose ?? price)
    const change = price - prev
    const { state, nextEventAt } = deriveState(meta)
    return {
      symbol: String(meta.symbol ?? symbol),
      name: String(meta.shortName ?? meta.longName ?? symbol),
      price,
      change,
      changePercent: prev ? (change / prev) * 100 : 0,
      currency: String(meta.currency ?? "USD"),
      exchange: String(meta.fullExchangeName ?? meta.exchangeName ?? ""),
      marketState: state,
      previousClose: prev,
      dayHigh: meta.regularMarketDayHigh ? Number(meta.regularMarketDayHigh) : undefined,
      dayLow: meta.regularMarketDayLow ? Number(meta.regularMarketDayLow) : undefined,
      volume: meta.regularMarketVolume ? Number(meta.regularMarketVolume) : undefined,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ? Number(meta.fiftyTwoWeekHigh) : undefined,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow ? Number(meta.fiftyTwoWeekLow) : undefined,
      timezone: meta.exchangeTimezoneName ? String(meta.exchangeTimezoneName) : undefined,
      nextEventAt,
    }
  } catch {
    return null
  }
}

async function fetchQuoteV7(symbol: string): Promise<Partial<Quote> | null> {
  try {
    const auth = await getCrumb()
    if (!auth) return null
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
      symbol,
    )}&crumb=${encodeURIComponent(auth.crumb)}`
    const res = await fetch(url, {
      headers: { "User-Agent": ua, Accept: "application/json", ...(auth.cookie ? { Cookie: auth.cookie } : {}) },
      next: { revalidate: 20 },
    })
    if (!res.ok) return null
    const json = await res.json()
    const q = json?.quoteResponse?.result?.[0]
    if (!q) return null
    return {
      marketCap: q.marketCap ? Number(q.marketCap) : undefined,
      trailingPE: q.trailingPE ? Number(q.trailingPE) : undefined,
      forwardPE: q.forwardPE ? Number(q.forwardPE) : undefined,
      eps: q.epsTrailingTwelveMonths ? Number(q.epsTrailingTwelveMonths) : undefined,
      dividendYield: q.dividendYield ? Number(q.dividendYield) : q.trailingAnnualDividendYield ? Number(q.trailingAnnualDividendYield) * 100 : undefined,
      avgVolume: q.averageDailyVolume3Month ? Number(q.averageDailyVolume3Month) : undefined,
      open: q.regularMarketOpen ? Number(q.regularMarketOpen) : undefined,
      assetType: mapAssetType(q.quoteType),
      name: q.longName || q.shortName || undefined,
    }
  } catch {
    return null
  }
}

async function fetchProfile(symbol: string): Promise<Partial<Quote> | null> {
  try {
    const auth = await getCrumb()
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    const modules = "assetProfile,defaultKeyStatistics,summaryDetail"
    const crumbQs = auth?.crumb ? `&crumb=${encodeURIComponent(auth.crumb)}` : ""
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
      symbol,
    )}?modules=${modules}${crumbQs}`
    const res = await fetch(url, {
      headers: { "User-Agent": ua, Accept: "application/json", ...(auth?.cookie ? { Cookie: auth.cookie } : {}) },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const json = await res.json()
    const r = json?.quoteSummary?.result?.[0]
    if (!r) return null
    const profile = r.assetProfile ?? {}
    const stats = r.defaultKeyStatistics ?? {}
    const summary = r.summaryDetail ?? {}
    const address = profile.address1 ?? ""
    const city = profile.city ?? ""
    const state = profile.state ?? ""
    const country = profile.country ?? ""
    const hq = [address, city, state, country].filter(Boolean).join(", ")
    return {
      sector: profile.sector || undefined,
      industry: profile.industry || undefined,
      website: profile.website || undefined,
      beta: stats.beta?.raw ?? summary.beta?.raw ?? undefined,
      headquarters: hq || undefined,
      ceo: profile.companyOfficers?.[0]?.name || undefined,
      founded: profile.foundedYear ? Number(profile.foundedYear) : undefined,
      employees: stats.fullTimeEmployees ? Number(stats.fullTimeEmployees) : undefined,
      phone: profile.phone || undefined,
    }
  } catch {
    return null
  }
}

function domainFromWebsite(website?: string): string | undefined {
  if (!website) return undefined
  try {
    const u = new URL(website.startsWith("http") ? website : `https://${website}`)
    return u.hostname.replace(/^www\./, "")
  } catch {
    return undefined
  }
}

export async function getQuote(symbol: string, opts?: { withFundamentals?: boolean }): Promise<Quote | null> {
  const resolved = resolveSymbol(symbol)
  const withFundamentals = opts?.withFundamentals ?? false

  const [meta, v7, profile] = await Promise.all([
    fetchChartMeta(resolved),
    withFundamentals ? fetchQuoteV7(resolved) : Promise.resolve(null),
    withFundamentals ? fetchProfile(resolved) : Promise.resolve(null),
  ])

  if (!meta && !v7) return null
  const base = meta ?? {}
  const website = profile?.website
  const domain = domainFromWebsite(website)

  const quote: Quote = {
    symbol: String(base.symbol ?? v7?.symbol ?? resolved),
    name: String(v7?.name ?? base.name ?? resolved),
    price: base.price ?? 0,
    change: base.change ?? 0,
    changePercent: base.changePercent ?? 0,
    currency: base.currency ?? "USD",
    exchange: base.exchange ?? "",
    marketState: base.marketState ?? "CLOSED",
    previousClose: base.previousClose ?? 0,
    open: v7?.open ?? base.open,
    dayHigh: base.dayHigh,
    dayLow: base.dayLow,
    volume: base.volume,
    avgVolume: v7?.avgVolume,
    fiftyTwoWeekHigh: base.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: base.fiftyTwoWeekLow,
    marketCap: v7?.marketCap,
    trailingPE: v7?.trailingPE,
    forwardPE: v7?.forwardPE,
    eps: v7?.eps,
    dividendYield: v7?.dividendYield,
    beta: profile?.beta,
    sector: profile?.sector,
    industry: profile?.industry,
    headquarters: profile?.headquarters,
    ceo: profile?.ceo,
    founded: profile?.founded,
    employees: profile?.employees,
    phone: profile?.phone,
    assetType: v7?.assetType,
    timezone: base.timezone,
    website,
    logoUrl: domain ? `https://logo.clearbit.com/${domain}` : undefined,
    nextEventAt: base.nextEventAt,
    updatedAt: Date.now(),
  }
  return quote
}

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  if (symbols.length === 0) return []
  const results = await Promise.all(symbols.map((s) => getQuote(s, { withFundamentals: true })))
  return results.filter((q): q is Quote => q !== null)
}

/* -------------------------------------------------------------------------- */
/* Historical OHLCV                                                            */
/* -------------------------------------------------------------------------- */

export async function getChart(symbol: string, range = "1mo", interval = "1d"): Promise<Candle[]> {
  const resolved = resolveSymbol(symbol)
  try {
    const path = `/v8/finance/chart/${encodeURIComponent(resolved)}?range=${range}&interval=${interval}`
    const json = await fetchJson(path, 60)
    const result = json?.chart?.result?.[0]
    if (!result) return []
    const ts: number[] = result.timestamp ?? []
    const q = result.indicators?.quote?.[0] ?? {}
    const opens: (number | null)[] = q.open ?? []
    const highs: (number | null)[] = q.high ?? []
    const lows: (number | null)[] = q.low ?? []
    const closes: (number | null)[] = q.close ?? []
    const vols: (number | null)[] = q.volume ?? []
    const out: Candle[] = []
    for (let i = 0; i < ts.length; i++) {
      const c = closes[i]
      if (c == null) continue
      out.push({
        t: ts[i] * 1000,
        o: opens[i] ?? c,
        h: highs[i] ?? c,
        l: lows[i] ?? c,
        c,
        v: vols[i] ?? 0,
      })
    }
    return out
  } catch {
    return []
  }
}

/* -------------------------------------------------------------------------- */
/* Search                                                                     */
/* -------------------------------------------------------------------------- */

export type SearchResult = {
  symbol: string
  name: string
  exchange: string
  type: string
}

const CURATED_SEARCH: SearchResult[] = [
  { symbol: "^NSEI", name: "NIFTY 50", exchange: "NSE", type: "INDEX" },
  { symbol: "^NSEBANK", name: "BANK NIFTY", exchange: "NSE", type: "INDEX" },
  { symbol: "^BSESN", name: "SENSEX", exchange: "BSE", type: "INDEX" },
  { symbol: "^GSPC", name: "S&P 500", exchange: "SNP", type: "INDEX" },
  { symbol: "^IXIC", name: "NASDAQ Composite", exchange: "NASDAQ", type: "INDEX" },
  { symbol: "^DJI", name: "Dow Jones", exchange: "DJI", type: "INDEX" },
  { symbol: "^NSMIDCP", name: "NIFTY MIDCAP", exchange: "NSE", type: "INDEX" },
  { symbol: "^CNXIT", name: "NIFTY IT", exchange: "NSE", type: "INDEX" },
  { symbol: "GC=F", name: "Gold Futures", exchange: "COMEX", type: "COMMODITY" },
  { symbol: "SI=F", name: "Silver Futures", exchange: "COMEX", type: "COMMODITY" },
  { symbol: "CL=F", name: "Crude Oil WTI", exchange: "NYMEX", type: "COMMODITY" },
  { symbol: "NG=F", name: "Natural Gas Futures", exchange: "NYMEX", type: "COMMODITY" },
  { symbol: "BZ=F", name: "Brent Crude", exchange: "ICE", type: "COMMODITY" },
  { symbol: "BTC-USD", name: "Bitcoin", exchange: "CCC", type: "CRYPTO" },
  { symbol: "ETH-USD", name: "Ethereum", exchange: "CCC", type: "CRYPTO" },
  { symbol: "SOL-USD", name: "Solana", exchange: "CCC", type: "CRYPTO" },
  { symbol: "DOGE-USD", name: "Dogecoin", exchange: "CCC", type: "CRYPTO" },
  { symbol: "BNB-USD", name: "BNB", exchange: "CCC", type: "CRYPTO" },
  { symbol: "XRP-USD", name: "XRP", exchange: "CCC", type: "CRYPTO" },
  { symbol: "ADA-USD", name: "Cardano", exchange: "CCC", type: "CRYPTO" },
  { symbol: "INR=X", name: "USD / INR", exchange: "FX", type: "CURRENCY" },
  { symbol: "EURUSD=X", name: "EUR / USD", exchange: "FX", type: "CURRENCY" },
  { symbol: "GBPUSD=X", name: "GBP / USD", exchange: "FX", type: "CURRENCY" },
  { symbol: "JPY=X", name: "USD / JPY", exchange: "FX", type: "CURRENCY" },
  { symbol: "EURINR=X", name: "EUR / INR", exchange: "FX", type: "CURRENCY" },
  { symbol: "GBPINR=X", name: "GBP / INR", exchange: "FX", type: "CURRENCY" },
  { symbol: "RELIANCE.NS", name: "Reliance Industries", exchange: "NSE", type: "EQUITY" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", exchange: "NSE", type: "EQUITY" },
  { symbol: "INFY.NS", name: "Infosys", exchange: "NSE", type: "EQUITY" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", exchange: "NSE", type: "EQUITY" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", exchange: "NSE", type: "EQUITY" },
  { symbol: "SBIN.NS", name: "State Bank of India", exchange: "NSE", type: "EQUITY" },
  { symbol: "LT.NS", name: "Larsen & Toubro", exchange: "NSE", type: "EQUITY" },
  { symbol: "AXISBANK.NS", name: "Axis Bank", exchange: "NSE", type: "EQUITY" },
  { symbol: "AAPL", name: "Apple Inc", exchange: "NASDAQ", type: "EQUITY" },
  { symbol: "MSFT", name: "Microsoft Corp", exchange: "NASDAQ", type: "EQUITY" },
  { symbol: "GOOGL", name: "Alphabet Inc", exchange: "NASDAQ", type: "EQUITY" },
  { symbol: "AMZN", name: "Amazon.com Inc", exchange: "NASDAQ", type: "EQUITY" },
  { symbol: "NVDA", name: "NVIDIA Corp", exchange: "NASDAQ", type: "EQUITY" },
  { symbol: "META", name: "Meta Platforms", exchange: "NASDAQ", type: "EQUITY" },
  { symbol: "TSLA", name: "Tesla Inc", exchange: "NASDAQ", type: "EQUITY" },
  { symbol: "AMD", name: "Advanced Micro Devices", exchange: "NASDAQ", type: "EQUITY" },
  { symbol: "NFLX", name: "Netflix Inc", exchange: "NASDAQ", type: "EQUITY" },
  { symbol: "INTC", name: "Intel Corp", exchange: "NASDAQ", type: "EQUITY" },
  { symbol: "ORCL", name: "Oracle Corp", exchange: "NYSE", type: "EQUITY" },
]

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  const q = query.trim()
  if (!q) return []
  const local = CURATED_SEARCH.filter(
    (r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.symbol.toLowerCase().includes(q.toLowerCase()),
  )
  try {
    const path = `/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=12&newsCount=0`
    const json = await fetchJson(path, 300)
    const quotes = json?.quotes ?? []
    const remote: SearchResult[] = quotes
      .filter((r: Record<string, unknown>) => r.symbol)
      .map((r: Record<string, unknown>) => ({
        symbol: String(r.symbol),
        name: String(r.shortname ?? r.longname ?? r.symbol),
        exchange: String(r.exchDisp ?? r.exchange ?? ""),
        type: String(r.quoteType ?? r.typeDisp ?? "OTHER"),
      }))
    // Curated matches first, de-duplicated against remote.
    const seen = new Set(local.map((r) => r.symbol))
    return [...local, ...remote.filter((r) => !seen.has(r.symbol))].slice(0, 14)
  } catch {
    return local
  }
}

/* -------------------------------------------------------------------------- */
/* Region support                                                             */
/* -------------------------------------------------------------------------- */

export type Region = "IN" | "US" | "GB" | "JP" | "GLOBAL"

export const REGION_CONFIG: Record<Region, { label: string; currency: string; exchanges: string[]; watchlist: string[] }> = {
  IN: { label: "India", currency: "INR", exchanges: ["NSE", "BSE"],
    watchlist: ["^NSEI", "^NSEBANK", "^BSESN", "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "LT.NS"] },
  US: { label: "United States", currency: "USD", exchanges: ["NASDAQ", "NYSE"],
    watchlist: ["^GSPC", "^IXIC", "^DJI", "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "META"] },
  GB: { label: "United Kingdom", currency: "GBP", exchanges: ["LSE"],
    watchlist: ["^FTSE", "HSBA.L", "BP.L", "SHEL.L", "AZN.L"] },
  JP: { label: "Japan", currency: "JPY", exchanges: ["TSE"],
    watchlist: ["^N225", "7203.T", "6758.T", "9984.T"] },
  GLOBAL: { label: "Global", currency: "USD", exchanges: ["NASDAQ", "NYSE", "NSE"],
    watchlist: ["^GSPC", "^IXIC", "BTC-USD", "ETH-USD", "GC=F", "CL=F", "EURUSD=X", "INR=X"] },
}

export function regionFromCountry(country?: string | null): Region {
  switch ((country ?? "").toUpperCase()) {
    case "IN":
      return "IN"
    case "US":
      return "US"
    case "GB":
    case "UK":
      return "GB"
    case "JP":
      return "JP"
    default:
      return "GLOBAL"
  }
}

export const CURATED_TICKER = ["^GSPC", "^IXIC", "^DJI", "^NSEI", "^NSEBANK", "BTC-USD", "ETH-USD", "GC=F", "CL=F", "INR=X"]

export function displayName(symbol: string, fallback?: string): string {
  const map: Record<string, string> = {
    "^GSPC": "S&P 500",
    "^IXIC": "Nasdaq",
    "^DJI": "Dow Jones",
    "^FTSE": "FTSE 100",
    "^N225": "Nikkei 225",
    "^HSI": "Hang Seng",
    "^GDAXI": "DAX",
    "^FCHI": "CAC 40",
    "^RUT": "Russell 2000",
    "^VIX": "CBOE Volatility Index",
    "^NSEI": "NIFTY 50",
    "^NSEBANK": "BANK NIFTY",
    "^BSESN": "SENSEX",
    "^BSEBANK": "BANKEX",
    "^NSMIDCP": "NIFTY MIDCAP",
    "^CNXIT": "NIFTY IT",
    "^CNXAUTO": "NIFTY AUTO",
    "^CNXFMCG": "NIFTY FMCG",
    "^CNXPHARMA": "NIFTY PHARMA",
    "^CNXMETAL": "NIFTY METAL",
    "^CNXPSUBANK": "NIFTY PSU BANK",
    "^CNXENERGY": "NIFTY ENERGY",
    "^CNXREALTY": "NIFTY REALTY",
    "^CNXMEDIA": "NIFTY MEDIA",
    "^CNXCONSUM": "NIFTY CONSUMPTION",
    "^CNX100": "NIFTY 100",
    "^CNX200": "NIFTY 200",
    "^CNX500": "NIFTY 500",
    "NIFTY_FIN_SERVICE.NS": "NIFTY FIN SERVICE",
    "BTC-USD": "Bitcoin",
    "ETH-USD": "Ethereum",
    "SOL-USD": "Solana",
    "DOGE-USD": "Dogecoin",
    "BNB-USD": "BNB",
    "XRP-USD": "XRP",
    "ADA-USD": "Cardano",
    "GC=F": "Gold",
    "SI=F": "Silver",
    "CL=F": "Crude Oil (WTI)",
    "BZ=F": "Brent Crude",
    "NG=F": "Natural Gas",
    "HG=F": "Copper",
    "PL=F": "Platinum",
    "PA=F": "Palladium",
    "INR=X": "USD / INR",
    "EURINR=X": "EUR / INR",
    "GBPINR=X": "GBP / INR",
    "JPYINR=X": "JPY / INR",
    "EURUSD=X": "EUR / USD",
    "GBPUSD=X": "GBP / USD",
    "JPY=X": "USD / JPY",
    "AUD=X": "USD / AUD",
    "CAD=X": "USD / CAD",
    "CHF=X": "USD / CHF",
    "GBP=X": "USD / GBP",
    "HKD=X": "USD / HKD",
    "SGD=X": "USD / SGD",
    "NZDUSD=X": "NZD / USD",
    "EURGBP=X": "EUR / GBP",
    "EURJPY=X": "EUR / JPY",
    "GBPJPY=X": "GBP / JPY",
  }
  return map[symbol] ?? fallback ?? symbol
}
