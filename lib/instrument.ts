// Universal financial instrument parser.
// Detects equities, indices, ETFs, forex, crypto, futures, and option contracts
// from freeform user queries and resolves them to Yahoo Finance symbols.

export type InstrumentType =
  | "equity"
  | "index"
  | "etf"
  | "forex"
  | "crypto"
  | "commodity"
  | "future"
  | "option"
  | "unknown"

export type OptionType = "CE" | "PE"

export type ParsedInstrument = {
  type: InstrumentType
  symbol: string
  name: string
  exchange?: string
  underlying?: string
  underlyingSymbol?: string
  strike?: number
  optionType?: OptionType
  expiry?: string
  expiryDate?: string
  raw: string
}

const MONTHS: Record<string, string> = {
  JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
  JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
}

const INDEX_MAP: Record<string, string> = {
  NIFTY: "^NSEI",
  "NIFTY 50": "^NSEI",
  BANKNIFTY: "^NSEBANK",
  "BANK NIFTY": "^NSEBANK",
  "NIFTY BANK": "^NSEBANK",
  SENSEX: "^BSESN",
  FINNIFTY: "NIFTY_FIN_SERVICE.NS",
  "FIN NIFTY": "NIFTY_FIN_SERVICE.NS",
  MIDCPNIFTY: "^NSMIDCP",
  "NIFTY MIDCAP": "^NSMIDCP",
  "NIFTY NEXT 50": "^NSMIDCP",
  "NIFTY IT": "^CNXIT",
  "NIFTY AUTO": "^CNXAUTO",
  "NIFTY PHARMA": "^CNXPHARMA",
  "NIFTY FMCG": "^CNXFMCG",
  "NIFTY METAL": "^CNXMETAL",
  "NIFTY MEDIA": "^CNXMEDIA",
  "NIFTY ENERGY": "^CNXENERGY",
  "NIFTY REALTY": "^CNXREALTY",
  GOLD: "^XAUUSD",
  SILVER: "^XAGUSD",
}

const COMMODITY_MAP: Record<string, string> = {
  GOLD: "GC=F",
  SILVER: "SI=F",
  "CRUDE OIL": "CL=F",
  CRUDE: "CL=F",
  WTI: "CL=F",
  BRENT: "BZ=F",
  "NATURAL GAS": "NG=F",
  COPPER: "HG=F",
  PLATINUM: "PL=F",
  PALLADIUM: "PA=F",
}

const INDEX_NAMES: Record<string, string> = {
  "^NSEI": "NIFTY 50",
  "^NSEBANK": "BANK NIFTY",
  "^BSESN": "SENSEX",
  "NIFTY_FIN_SERVICE.NS": "FIN NIFTY",
  "^NSMIDCP": "NIFTY MIDCAP",
  "^CNXIT": "NIFTY IT",
  "^CNXAUTO": "NIFTY AUTO",
  "^CNXPHARMA": "NIFTY PHARMA",
  "^CNXFMCG": "NIFTY FMCG",
  "^CNXMETAL": "NIFTY METAL",
  "^CNXMEDIA": "NIFTY MEDIA",
  "^CNXENERGY": "NIFTY ENERGY",
  "^CNXREALTY": "NIFTY REALTY",
  "^GSPC": "S&P 500",
  "^IXIC": "NASDAQ Composite",
  "^DJI": "Dow Jones",
}

// Common Indian and global stock bare-ticker → Yahoo symbol
const STOCK_MAP: Record<string, string> = {
  RELIANCE: "RELIANCE.NS",
  TCS: "TCS.NS",
  INFY: "INFY.NS",
  HDFCBANK: "HDFCBANK.NS",
  ICICIBANK: "ICICIBANK.NS",
  SBIN: "SBIN.NS",
  WIPRO: "WIPRO.NS",
  LT: "LT.NS",
  TATAMOTORS: "TATAMOTORS.NS",
  AXISBANK: "AXISBANK.NS",
  KOTAKBANK: "KOTAKBANK.NS",
  BHARTIARTL: "BHARTIARTL.NS",
  ITC: "ITC.NS",
  MARUTI: "MARUTI.NS",
  SUNPHARMA: "SUNPHARMA.NS",
  TITAN: "TITAN.NS",
  NTPC: "NTPC.NS",
  ONGC: "ONGC.NS",
  POWERGRID: "POWERGRID.NS",
  ULTRACEMCO: "ULTRACEMCO.NS",
  HCLTECH: "HCLTECH.NS",
  BAJFINANCE: "BAJFINANCE.NS",
  ASIANPAINT: "ASIANPAINT.NS",
  HINDUNILVR: "HINDUNILVR.NS",
  DMART: "DMART.NS",
  JSWSTEEL: "JSWSTEEL.NS",
  TATASTEEL: "TATASTEEL.NS",
  COALINDIA: "COALINDIA.NS",
  IOC: "IOC.NS",
  BPCL: "BPCL.NS",
  HINDALCO: "HINDALCO.NS",
  GRASIM: "GRASIM.NS",
  ADANIPORTS: "ADANIPORTS.NS",
  EICHERMOT: "EICHERMOT.NS",
  DIVISLAB: "DIVISLAB.NS",
  DRREDDY: "DRREDDY.NS",
  CIPLA: "CIPLA.NS",
  PIDILITIND: "PIDILITIND.NS",
  BRITANNIA: "BRITANNIA.NS",
  APOLLOHOSP: "APOLLOHOSP.NS",
  NESTLEIND: "NESTLEIND.NS",
  M_M: "M&M.NS",
  TECHM: "TECHM.NS",
  TATACONSUM: "TATACONSUM.NS",
  SHRIRAMFIN: "SHRIRAMFIN.NS",
  TRENT: "TRENT.NS",
  ZOMATO: "ZOMATO.NS",
  HDFCLIFE: "HDFCLIFE.NS",
  SBILIFE: "SBILIFE.NS",
  MARICO: "MARICO.NS",
  DABUR: "DABUR.NS",
  HAVELLS: "HAVELLS.NS",
  VOLTAS: "VOLTAS.NS",
  SIEMENS: "SIEMENS.NS",
  BEL: "BEL.NS",
  DLF: "DLF.NS",
  IRCTC: "IRCTC.NS",
  HAL: "HAL.NS",
  VEDL: "VEDL.NS",
  GAIL: "GAIL.NS",
  SAIL: "SAIL.NS",
  BHEL: "BHEL.NS",
  LIC: "LIC.NS",
  ADANIENT: "ADANIENT.NS",
  ADANIPOWER: "ADANIPOWER.NS",
  ADANIGREEN: "ADANIGREEN.NS",
  ADANITRANS: "ADANITRANS.NS",
  "M&M": "M&M.NS",
}

const STOCK_NAMES: Record<string, string> = {
  "RELIANCE.NS": "Reliance Industries",
  "TCS.NS": "Tata Consultancy Services",
  "INFY.NS": "Infosys",
  "HDFCBANK.NS": "HDFC Bank",
  "ICICIBANK.NS": "ICICI Bank",
  "SBIN.NS": "State Bank of India",
  "WIPRO.NS": "Wipro",
  "LT.NS": "Larsen & Toubro",
  "BEL.NS": "Bharat Electronics",
}

function parseMonth(input: string): string | null {
  const u = input.toUpperCase().slice(0, 3)
  return MONTHS[u] ?? null
}

/**
 * Parse a freeform instrument query into a structured instrument descriptor.
 *
 * Handles:
 *   - Option contracts:  "NIFTY JUL 24000 CE", "INFY JUL 1700 PE", "TCS AUG 3500 CE"
 *   - Futures:           "NIFTY FUT", "GOLD FUT", "CRUDE FUT"
 *   - Indices:           "^NSEI", "NIFTY", "BANKNIFTY", "S&P 500"
 *   - Commodities:       "GOLD", "SILVER", "CRUDE OIL"
 *   - Crypto:            "BTC", "ETH", "BTC-USD", "SOL-USD"
 *   - Forex:             "USDINR", "EURUSD", "INR=X"
 *   - Equities:          "AAPL", "TCS", "INFY.NS", "RELIANCE"
 */
export function parseInstrument(input: string): ParsedInstrument {
  const raw = input.trim()
  if (!raw) return { type: "unknown", symbol: raw, name: raw, raw }

  const upper = raw.toUpperCase()

  // ── 1. Option contract: WORD MONTH STRIKE CE|PE ──
  const optMatch = upper.match(/^([A-Z][A-Z0-9.\s&/]+?)\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{3,7})\s+(CE|PE)$/)
  if (optMatch) {
    const underlyingRaw = optMatch[1].trim()
    const month = optMatch[2]
    const strike = parseInt(optMatch[3], 10)
    const optType = optMatch[4] as OptionType

    // Resolve underlying
    let underlyingSymbol: string
    let instrumentType: InstrumentType
    let name: string

    if (INDEX_MAP[underlyingRaw]) {
      underlyingSymbol = INDEX_MAP[underlyingRaw]
      instrumentType = "index"
      name = INDEX_NAMES[underlyingSymbol] ?? underlyingRaw
    } else if (STOCK_MAP[underlyingRaw]) {
      underlyingSymbol = STOCK_MAP[underlyingRaw]
      instrumentType = "equity"
      name = STOCK_NAMES[underlyingSymbol] ?? underlyingRaw
    } else {
      underlyingSymbol = underlyingRaw + (underlyingRaw.includes(".") ? "" : ".NS")
      instrumentType = "equity"
      name = underlyingRaw
    }

    const monthNum = MONTHS[month]
    const year = new Date().getFullYear()
    const expiryDate = `${year}-${monthNum}-01`

    return {
      type: "option",
      symbol: underlyingSymbol,
      name: `${name} ${month} ${strike} ${optType}`,
      exchange: instrumentType === "index" ? "NSE" : "NSE",
      underlying: name,
      underlyingSymbol,
      strike,
      optionType: optType,
      expiry: month,
      expiryDate,
      raw,
    }
  }

  // ── 2. Futures: WORD FUT ──
  const futMatch = upper.match(/^([A-Z][A-Z0-9.\s&/]+?)\s+FUT$/)
  if (futMatch) {
    const underlyingRaw = futMatch[1].trim()

    if (COMMODITY_MAP[underlyingRaw]) {
      const sym = COMMODITY_MAP[underlyingRaw]
      return { type: "future", symbol: sym, name: `${underlyingRaw} Futures`, exchange: "COMEX", underlying: underlyingRaw, raw }
    }
    if (INDEX_MAP[underlyingRaw]) {
      const sym = INDEX_MAP[underlyingRaw]
      return { type: "future", symbol: sym, name: `${underlyingRaw} Futures`, exchange: "NSE", underlying: underlyingRaw, raw }
    }
    return { type: "future", symbol: underlyingRaw, name: `${underlyingRaw} Futures`, raw }
  }

  // ── 3. Known index ──
  const indexSymbol = INDEX_MAP[upper]
  if (indexSymbol) {
    return { type: "index", symbol: indexSymbol, name: INDEX_NAMES[indexSymbol] ?? upper, exchange: "NSE", raw }
  }

  // ── 4. Known commodity ──
  const commoditySymbol = COMMODITY_MAP[upper]
  if (commoditySymbol) {
    return { type: "commodity", symbol: commoditySymbol, name: `${upper} Futures`, exchange: "COMEX", raw }
  }

  // ── 5. Has Yahoo suffix hint → equity ──
  if (/\.(NS|BO|TO|L|SS|SZ)$/.test(upper)) {
    return { type: "equity", symbol: upper, name: upper.replace(/\.(NS|BO)$/, ""), exchange: upper.endsWith(".NS") ? "NSE" : "BSE", raw }
  }

  // ── 6. =X suffix → forex ──
  if (/=X$/.test(upper)) {
    const pairs: Record<string, string> = {
      "INR=X": "USD/INR",
      "EURINR=X": "EUR/INR",
      "GBPINR=X": "GBP/INR",
      "JPYINR=X": "JPY/INR",
      "EURUSD=X": "EUR/USD",
      "GBPUSD=X": "GBP/USD",
      "JPY=X": "USD/JPY",
      "AUDUSD=X": "AUD/USD",
      "CAD=X": "USD/CAD",
      "CHF=X": "USD/CHF",
      "GBP=X": "USD/GBP",
      "HKD=X": "USD/HKD",
      "SGD=X": "USD/SGD",
      "NZDUSD=X": "NZD/USD",
      "EURGBP=X": "EUR/GBP",
      "EURJPY=X": "EUR/JPY",
      "GBPJPY=X": "GBP/JPY",
    }
    return { type: "forex", symbol: upper, name: pairs[upper] ?? upper.replace("=X", ""), exchange: "FX", raw }
  }

  // ── 7. -USD suffix → crypto ──
  if (/-USD$/.test(upper)) {
    const cryptoName: Record<string, string> = {
      "BTC-USD": "Bitcoin",
      "ETH-USD": "Ethereum",
      "SOL-USD": "Solana",
      "DOGE-USD": "Dogecoin",
      "BNB-USD": "BNB",
      "XRP-USD": "XRP",
      "ADA-USD": "Cardano",
      "DOT-USD": "Polkadot",
      "AVAX-USD": "Avalanche",
      "LINK-USD": "Chainlink",
      "MATIC-USD": "Polygon",
      "UNI-USD": "Uniswap",
      "ATOM-USD": "Cosmos",
      "LTC-USD": "Litecoin",
      "BCH-USD": "Bitcoin Cash",
      "TRX-USD": "TRON",
      "NEAR-USD": "NEAR Protocol",
      "APT-USD": "Aptos",
      "SUI-USD": "Sui",
      "ARB-USD": "Arbitrum",
      "OP-USD": "Optimism",
      "PEPE-USD": "Pepe",
      "SHIB-USD": "Shiba Inu",
    }
    return { type: "crypto", symbol: upper, name: cryptoName[upper] ?? upper.replace("-USD", ""), exchange: "CCC", raw }
  }

  // ── 8. Known Indian stock bare ticker → map to NS ──
  if (STOCK_MAP[upper]) {
    const sym = STOCK_MAP[upper]
    return { type: "equity", symbol: sym, name: STOCK_NAMES[sym] ?? upper, exchange: "NSE", raw }
  }

  // ── 9. USDINR-style forex pairs ──
  const fxMatch = upper.match(/^(USD|EUR|GBP|JPY|AUD|CAD|CHF|NZD|SGD|HKD|INR|CNY|KRW|BRL|MXN|ZAR|TRY)(USD|EUR|GBP|JPY|AUD|CAD|CHF|NZD|SGD|HKD|INR|CNY|KRW|BRL|MXN|ZAR|TRY)$/)
  if (fxMatch && fxMatch[1] !== fxMatch[2]) {
    const pair = `${fxMatch[1]}/${fxMatch[2]}`
    const yahooSym = `${fxMatch[1]}${fxMatch[2]}=X`
    return { type: "forex", symbol: yahooSym, name: pair, exchange: "FX", raw }
  }

  // ── 10. Crypto bare ticker ──
  const cryptoBare: Record<string, string> = {
    BTC: "BTC-USD",
    BITCOIN: "BTC-USD",
    ETH: "ETH-USD",
    ETHEREUM: "ETH-USD",
    SOL: "SOL-USD",
    SOLANA: "SOL-USD",
    DOGE: "DOGE-USD",
    DOGECOIN: "DOGE-USD",
    XRP: "XRP-USD",
    RIPPLE: "XRP-USD",
    ADA: "ADA-USD",
    CARDANO: "ADA-USD",
    DOT: "DOT-USD",
    POLKADOT: "DOT-USD",
    AVAX: "AVAX-USD",
    AVALANCHE: "AVAX-USD",
    LINK: "LINK-USD",
    CHAINLINK: "LINK-USD",
    MATIC: "MATIC-USD",
    UNI: "UNI-USD",
    UNISWAP: "UNI-USD",
    ATOM: "ATOM-USD",
    LTC: "LTC-USD",
    LITECOIN: "LTC-USD",
    BCH: "BCH-USD",
    TRX: "TRX-USD",
    TRON: "TRX-USD",
    NEAR: "NEAR-USD",
    APT: "APT-USD",
    APTOS: "APT-USD",
    SUI: "SUI-USD",
    ARB: "ARB-USD",
    ARBITRUM: "ARB-USD",
    OP: "OP-USD",
    OPTIMISM: "OP-USD",
    PEPE: "PEPE-USD",
    SHIB: "SHIB-USD",
    BNB: "BNB-USD",
  }
  if (cryptoBare[upper]) {
    const sym = cryptoBare[upper]
    return { type: "crypto", symbol: sym, name: upper.charAt(0) + upper.slice(1).toLowerCase(), exchange: "CCC", raw }
  }

  // ── 11. ^ prefix → index ──
  if (upper.startsWith("^")) {
    return { type: "index", symbol: upper, name: INDEX_NAMES[upper] ?? upper, raw }
  }

  // ── 12. =F suffix → commodity ──
  if (/=F$/.test(upper)) {
    return { type: "commodity", symbol: upper, name: upper, raw }
  }

  // ── 13. Fallback → equity ──
  return { type: "equity", symbol: upper, name: upper, raw }
}

/**
 * Generate option contract suggestions for a partial underlying name.
 * E.g. "NIFTY" → ["NIFTY JUL 24000 CE", "NIFTY JUL 24000 PE", ...]
 */
export function suggestOptionContracts(underlying: string, count = 3): { symbol: string; name: string; exchange: string; type: string; strike: number; optionType: "CE" | "PE"; expiry: string; underlying: string }[] {
  const u = underlying.toUpperCase()
  const resolved = INDEX_MAP[u] ?? STOCK_MAP[u] ?? null
  if (!resolved) return []

  const monthNames = ["JUL", "AUG", "SEP"]
  const baseStrikes: Record<string, number> = {
    "^NSEI": 24000,
    "^NSEBANK": 56000,
    "NIFTY_FIN_SERVICE.NS": 25000,
    "^BSESN": 80000,
  }

  const base = baseStrikes[resolved]
  if (!base) return []

  const name = INDEX_NAMES[resolved] ?? u
  const types: ("CE" | "PE")[] = ["CE", "PE"]
  const results: { symbol: string; name: string; exchange: string; type: string; strike: number; optionType: "CE" | "PE"; expiry: string; underlying: string }[] = []

  for (const month of monthNames.slice(0, count)) {
    for (const off of [0, 1, -1]) {
      for (const optType of types) {
        const strike = base + off * 500
        if (strike <= 0) continue
        results.push({
          symbol: resolved,
          name: `${name} ${month} ${strike} ${optType}`,
          exchange: "NSE",
          type: "OPTION",
          strike,
          optionType: optType,
          expiry: month,
          underlying: name,
        })
        if (results.length >= count * 4) break
      }
      if (results.length >= count * 4) break
    }
    if (results.length >= count * 4) break
  }

  return results.slice(0, count * 4)
}
