export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  HKD: "HK$",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  SGD: "S$",
  CNY: "¥",
  KRW: "₩",
  BRL: "R$",
  MXN: "Mex$",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  NZD: "NZ$",
  ZAR: "R",
  TRY: "₺",
  RUB: "₽",
  PLN: "zł",
  THB: "฿",
  IDR: "Rp",
  MYR: "RM",
  PHP: "₱",
  CZK: "Kč",
  HUF: "Ft",
  ILS: "₪",
  CLP: "CLP$",
  AED: "د.إ",
  SAR: "﷼",
}

export function currencySymbol(currency: string | undefined): string {
  if (!currency) return ""
  const sym = CURRENCY_SYMBOLS[currency.toUpperCase()]
  return sym ?? currency
}

const LOGO_CACHE = new Map<string, string>()

export function logoUrl(symbol: string, name?: string, website?: string, exchange?: string): string {
  if (!symbol) return ""
  const key = `${symbol}|${website ?? ""}`
  const cached = LOGO_CACHE.get(key)
  if (cached) return cached

  const cleanSymbol = symbol.replace(/\.NS$|\.BO$|=X|-USD$|\^/g, "").toLowerCase()

  const domainMap: Record<string, string> = {
    aapl: "apple.com",
    msft: "microsoft.com",
    googl: "google.com",
    goog: "google.com",
    amzn: "amazon.com",
    meta: "meta.com",
    nvda: "nvidia.com",
    tsla: "tesla.com",
    amd: "amd.com",
    intc: "intel.com",
    nflx: "netflix.com",
    orcl: "oracle.com",
    ibm: "ibm.com",
    csco: "cisco.com",
    qcom: "qualcomm.com",
    adbe: "adobe.com",
    sales: "salesforce.com",
    sap: "sap.com",
    shop: "shopify.com",
    spot: "spotify.com",
    pypl: "paypal.com",
    sq: "block.xyz",
    dis: "thewaltdisneycompany.com",
    ko: "coca-colacompany.com",
    pep: "pepsico.com",
    jpm: "jpmorganchase.com",
    bac: "bankofamerica.com",
    wfc: "wellsfargo.com",
    gs: "goldmansachs.com",
    v: "visa.com",
    ma: "mastercard.com",
    unh: "unitedhealthgroup.com",
    jnj: "jnj.com",
    pg: "pg.com",
    xom: "exxonmobil.com",
    cvx: "chevron.com",
    wmt: "walmart.com",
    hd: "homedepot.com",
    mcd: "mcdonalds.com",
    nke: "nike.com",
    ba: "boeing.com",
    cat: "caterpillar.com",
    ge: "ge.com",
    twtr: "twitter.com",
  }

  const known: Record<string, string> = {
    "RELIANCE.NS": "ril.com",
    "TCS.NS": "tcs.com",
    "INFY.NS": "infosys.com",
    "HDFCBANK.NS": "hdfcbank.com",
    "ICICIBANK.NS": "icicibank.com",
    "SBIN.NS": "bank.sbi",
    "WIPRO.NS": "wipro.com",
    "TATAMOTORS.NS": "tatamotors.com",
    "ADANIENT.NS": "adanienterprises.com",
    "LT.NS": "larsentoubro.com",
    "AXISBANK.NS": "axisbank.com",
    "KOTAKBANK.NS": "kotak.com",
    "BHARTIARTL.NS": "airtel.in",
    "ITC.NS": "itcportal.com",
    "MARUTI.NS": "marutisuzuki.com",
    "SUNPHARMA.NS": "sunpharma.com",
    "TITAN.NS": "titancompany.in",
    "NTPC.NS": "ntpc.co.in",
    "ONGC.NS": "ongcindia.com",
    "POWERGRID.NS": "powergridindia.com",
    "ULTRACEMCO.NS": "ultratechcement.com",
    "HCLTECH.NS": "hcltech.com",
    "BAJFINANCE.NS": "bajajfinserv.in",
    "BAJAJFINSV.NS": "bajajfinserv.in",
    "ASIANPAINT.NS": "asianpaints.com",
    "HINDUNILVR.NS": "hul.co.in",
    "DMART.NS": "dmartindia.com",
    "JSWSTEEL.NS": "jsw.in",
    "TATASTEEL.NS": "tatasteel.com",
    "COALINDIA.NS": "coalindia.in",
    "IOC.NS": "iocl.com",
    "BPCL.NS": "bharatpetroleum.in",
    "HINDALCO.NS": "hindalco.com",
    "GRASIM.NS": "grasim.com",
    "ADANIPORTS.NS": "adaniports.com",
    "EICHERMOT.NS": "eichertrucksandbuses.com",
    "DIVISLAB.NS": "divislabs.com",
    "DRREDDY.NS": "drreddys.com",
    "CIPLA.NS": "cipla.com",
    "PIDILITIND.NS": "pidilite.com",
    "BRITANNIA.NS": "britannia.co.in",
    "APOLLOHOSP.NS": "apollohospitals.com",
    "NESTLEIND.NS": "nestle.in",
    "M&M.NS": "mahindra.com",
    "TECHM.NS": "techmahindra.com",
    "TATACONSUM.NS": "tataconsumer.com",
    "SHRIRAMFIN.NS": "shriramfinance.in",
    "TRENT.NS": "trentlimited.com",
    "ADANIGREEN.NS": "adanigreenenergy.com",
    "ADANITRANS.NS": "adanienergysolutions.com",
    "ADANIPOWER.NS": "adanipower.com",
    "ZOMATO.NS": "zomato.com",
    "ICICIPRULI.NS": "iciciprulife.com",
    "HDFCLIFE.NS": "hdfclife.com",
    "SBILIFE.NS": "sbilife.co.in",
    "MARICO.NS": "marico.com",
    "DABUR.NS": "dabur.com",
    "HAVELLS.NS": "havells.com",
    "TORNTPHARM.NS": "torrentpharma.com",
    "GODREJCP.NS": "godrejcp.com",
    "BERGEPAINT.NS": "bergerpaints.com",
    "VOLTAS.NS": "voltas.com",
    "SIEMENS.NS": "siemens.co.in",
    "ABB.NS": "abb.co.in",
    "PGHH.NS": "pg.com",
    "COLPAL.NS": "colgate.com",
    "AMBUJACEM.NS": "ambujacement.com",
    "MUTHOOTFIN.NS": "muthootfinance.com",
    "INDUSTOWER.NS": "indusind.com",
    "NAUKRI.NS": "naukri.com",
    "BANDHANBNK.NS": "bandhanbank.com",
    "ICICIGI.NS": "iciciprulife.com",
    "ASTRAL.NS": "astral.com",
    "DIXON.NS": "dixoninfo.com",
    "BEL.NS": "bel-india.in",
    "DLF.NS": "dlf.in",
    "IRCTC.NS": "irctc.co.in",
    "HAL.NS": "hal-india.co.in",
    "VEDL.NS": "vedantalimited.com",
    "GAIL.NS": "gailonline.com",
    "SAIL.NS": "sail.co.in",
    "BHEL.NS": "bhel.com",
    "LIC.NS": "licindia.in",
  }

  const domain = known[symbol] ?? domainMap[cleanSymbol]

  if (domain) {
    const url = `https://logo.clearbit.com/${domain}`
    LOGO_CACHE.set(key, url)
    return url
  }

  if (website) {
    try {
      const u = new URL(website.startsWith("http") ? website : `https://${website}`)
      const url = `https://logo.clearbit.com/${u.hostname.replace(/^www\./, "")}`
      LOGO_CACHE.set(key, url)
      return url
    } catch {
      /* fall through */
    }
  }

  const gen = `https://logo.clearbit.com/${encodeURIComponent(name ?? cleanSymbol)}.com`
  LOGO_CACHE.set(key, gen)
  return gen
}

const SPARKLINE_CACHE = new Map<string, { values: number[]; change: number; changePercent: number }>()

export async function fetchSparkline(symbol: string): Promise<{ values: number[]; change: number; changePercent: number } | null> {
  const cached = SPARKLINE_CACHE.get(symbol)
  if (cached) return cached

  try {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=15m`,
      { headers: { "User-Agent": ua, Accept: "application/json" }, next: { revalidate: 60 } },
    )
    if (!res.ok) return null
    const json = await res.json()
    const q = json?.chart?.result?.[0]?.indicators?.quote?.[0]
    const closes = q?.close ?? []
    const values: number[] = closes.filter((c: number | null) => c != null).map(Number)
    if (values.length < 2) return null
    const first = values[0]
    const last = values[values.length - 1]
    const result = {
      values,
      change: last - first,
      changePercent: first ? ((last - first) / first) * 100 : 0,
    }
    SPARKLINE_CACHE.set(symbol, result)
    return result
  } catch {
    return null
  }
}

export function sparklineSvg(values: number[], width = 80, height = 24, color?: string): string {
  if (values.length < 2) return ""
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pad = 2
  const w = width - pad * 2
  const h = height - pad * 2
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * w
    const y = pad + h - ((v - min) / range) * h
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const stroke = color ?? (values[values.length - 1] >= values[0] ? "oklch(0.62 0.16 168)" : "oklch(0.58 0.18 22)")
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><path d="M${pts.join(" L")}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
}
