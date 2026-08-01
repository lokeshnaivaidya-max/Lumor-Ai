// Universal financial instrument parser & normalizer.
// Detects equities, indices, ETFs, forex, crypto, futures, REITs, INVITs, and options
// from freeform user queries and resolves them cleanly.

export type InstrumentType =
  | "equity"
  | "index"
  | "etf"
  | "forex"
  | "crypto"
  | "commodity"
  | "future"
  | "option"
  | "reit"
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

export const MONTHS: Record<string, string> = {
  JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
  JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
}

export const INDEX_MAP: Record<string, string> = {
  "NIFTY": "^NSEI",
  "NIFTY 50": "^NSEI",
  "NIFTY50": "^NSEI",
  "BANKNIFTY": "^NSEBANK",
  "BANK NIFTY": "^NSEBANK",
  "NIFTY BANK": "^NSEBANK",
  "SENSEX": "^BSESN",
  "BSE SENSEX": "^BSESN",
  "BANKEX": "^BSEBANK",
  "FINNIFTY": "NIFTY_FIN_SERVICE.NS",
  "FIN NIFTY": "NIFTY_FIN_SERVICE.NS",
  "MIDCPNIFTY": "^NSMIDCP",
  "NIFTY MIDCAP": "^NSMIDCP",
  "NIFTY MIDCAP 100": "^NSMIDCP",
  "NIFTY NEXT 50": "^NSMIDCP",
  "NIFTY IT": "^CNXIT",
  "NIFTY AUTO": "^CNXAUTO",
  "NIFTY PHARMA": "^CNXPHARMA",
  "NIFTY FMCG": "^CNXFMCG",
  "NIFTY METAL": "^CNXMETAL",
  "NIFTY MEDIA": "^CNXMEDIA",
  "NIFTY ENERGY": "^CNXENERGY",
  "NIFTY REALTY": "^CNXREALTY",
  "NIFTY PSU BANK": "^CNXPSUBANK",
  "NIFTY CONSUMPTION": "^CNXCONSUM",
  "NIFTY 100": "^CNX100",
  "NIFTY 200": "^CNX200",
  "NIFTY 500": "^CNX500",
  "NASDAQ": "^IXIC",
  "NASDAQ 100": "NDX",
  "S&P 500": "^GSPC",
  "S&P500": "^GSPC",
  "SPX": "^GSPC",
  "DOW": "^DJI",
  "DOW JONES": "^DJI",
  "VIX": "^VIX",
  "FTSE": "^FTSE",
  "DAX": "^GDAXI",
  "NIKKEI": "^N225",
  "HANG SENG": "^HSI",
}

export const COMMODITY_MAP: Record<string, string> = {
  "GOLD": "GC=F",
  "SILVER": "SI=F",
  "CRUDE OIL": "CL=F",
  "CRUDE": "CL=F",
  "WTI": "CL=F",
  "BRENT": "BZ=F",
  "NATURAL GAS": "NG=F",
  "COPPER": "HG=F",
  "ALUMINIUM": "ALI=F",
  "ALUMINUM": "ALI=F",
  "PLATINUM": "PL=F",
  "PALLADIUM": "PA=F",
  "ZINC": "ZNC=F",
  "NICKEL": "NIC=F",
}

export const INDEX_NAMES: Record<string, string> = {
  "^NSEI": "NIFTY 50",
  "^NSEBANK": "BANK NIFTY",
  "^BSESN": "SENSEX",
  "^BSEBANK": "BANKEX",
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
  "^VIX": "CBOE VIX",
  "^FTSE": "FTSE 100",
  "^GDAXI": "DAX 40",
  "^N225": "Nikkei 225",
  "^HSI": "Hang Seng",
}

// Common stock aliases & tickers mapped to standard symbols
export const STOCK_MAP: Record<string, string> = {
  // Indian stocks
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
  "LT": "LT.NS",
  "L&T": "LT.NS",
  "LARSEN": "LT.NS",
  "LARSEN & TOUBRO": "LT.NS",
  "LTF": "LTF.NS",
  "L&TFH": "LTF.NS",
  "L&T FINANCE": "LTF.NS",
  "L&T FINANCE HOLDINGS": "LTF.NS",
  "L&T FIN": "LTF.NS",
  "TATAMOTORS": "TATAMOTORS.NS",
  "TATA MOTORS": "TATAMOTORS.NS",
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
  "BAJFINANCE": "BAJFINANCE.NS",
  "BAJAJ FINANCE": "BAJFINANCE.NS",
  "BAJAJFINSV": "BAJAJFINSV.NS",
  "ASIANPAINT": "ASIANPAINT.NS",
  "HINDUNILVR": "HINDUNILVR.NS",
  "HUL": "HINDUNILVR.NS",
  "DMART": "DMART.NS",
  "JSWSTEEL": "JSWSTEEL.NS",
  "TATASTEEL": "TATASTEEL.NS",
  "COALINDIA": "COALINDIA.NS",
  "IOC": "IOC.NS",
  "BPCL": "BPCL.NS",
  "HINDALCO": "HINDALCO.NS",
  "GRASIM": "GRASIM.NS",
  "ADANIPORTS": "ADANIPORTS.NS",
  "EICHERMOT": "EICHERMOT.NS",
  "DIVISLAB": "DIVISLAB.NS",
  "DRREDDY": "DRREDDY.NS",
  "CIPLA": "CIPLA.NS",
  "PIDILITIND": "PIDILITIND.NS",
  "BRITANNIA": "BRITANNIA.NS",
  "APOLLOHOSP": "APOLLOHOSP.NS",
  "NESTLEIND": "NESTLEIND.NS",
  "M&M": "M&M.NS",
  "MAHINDRA": "M&M.NS",
  "MAHINDRA & MAHINDRA": "M&M.NS",
  "M_M": "M&M.NS",
  "TECHM": "TECHM.NS",
  "TECH MAHINDRA": "TECHM.NS",
  "TATACONSUM": "TATACONSUM.NS",
  "SHRIRAMFIN": "SHRIRAMFIN.NS",
  "TRENT": "TRENT.NS",
  "ZOMATO": "ZOMATO.NS",
  "HDFCLIFE": "HDFCLIFE.NS",
  "SBILIFE": "SBILIFE.NS",
  "MARICO": "MARICO.NS",
  "DABUR": "DABUR.NS",
  "HAVELLS": "HAVELLS.NS",
  "VOLTAS": "VOLTAS.NS",
  "SIEMENS": "SIEMENS.NS",
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
  "ADANIENT": "ADANIENT.NS",
  "ADANIPOWER": "ADANIPOWER.NS",
  "ADANIGREEN": "ADANIGREEN.NS",
  "LTIM": "LTIM.NS",
  "LTIMINDTREE": "LTIM.NS",
  "PERSISTENT": "PERSISTENT.NS",
  "COFORGE": "COFORGE.NS",
  "MPHASIS": "MPHASIS.NS",
  "POLYCAB": "POLYCAB.NS",
  "DIXON": "DIXON.NS",
  "CDSL": "CDSL.NS",
  "BSE": "BSE.NS",
  "MCX": "MCX.NS",
  "ANGELONE": "ANGELONE.NS",
  "CAMS": "CAMS.NS",
  "IEX": "IEX.NS",
  // ETFs / REITs
  "NIFTYBEES": "NIFTYBEES.NS",
  "BANKBEES": "BANKBEES.NS",
  "GOLDBEES": "GOLDBEES.NS",
  "SILVERBEES": "SILVERBEES.NS",
  "MON100": "MON100.NS",
  "CPSEETF": "CPSEETF.NS",
  "EMBASSY": "EMBASSY.NS",
  "MINDSPACE": "MINDSPACE.NS",
  "BROOKFIELD": "BIRET.NS",
  // US stocks
  "AAPL": "AAPL",
  "MSFT": "MSFT",
  "GOOGL": "GOOGL",
  "GOOG": "GOOGL",
  "AMZN": "AMZN",
  "NVDA": "NVDA",
  "META": "META",
  "TSLA": "TSLA",
  "AMD": "AMD",
  "NFLX": "NFLX",
  "INTC": "INTC",
  "ORCL": "ORCL",
}

export const STOCK_NAMES: Record<string, string> = {
  "RELIANCE.NS": "Reliance Industries",
  "TCS.NS": "Tata Consultancy Services",
  "INFY.NS": "Infosys",
  "HDFCBANK.NS": "HDFC Bank",
  "ICICIBANK.NS": "ICICI Bank",
  "SBIN.NS": "State Bank of India",
  "WIPRO.NS": "Wipro",
  "LT.NS": "Larsen & Toubro",
  "LTF.NS": "L&T Finance",
  "BEL.NS": "Bharat Electronics",
  "M&M.NS": "Mahindra & Mahindra",
  "TATAMOTORS.NS": "Tata Motors",
  "TATASTEEL.NS": "Tata Steel",
  "BHARTIARTL.NS": "Bharti Airtel",
  "ADANIENT.NS": "Adani Enterprises",
}

/**
 * Intelligent Option Query Parser
 * Normalizes user queries like:
 *   "NIFTY 31 JUL 25000 CE"
 *   "NIFTY 25000 CE"
 *   "NIFTY25000CE"
 *   "25000 CE NIFTY"
 *   "NIFTY CE 25000"
 *   "BANKNIFTY 56000 PE"
 *   "RELIANCE 1500 CE"
 *   "SBIN 900 PE"
 *   "ICICIBANK CE"
 */
export function parseOptionQuery(input: string): ParsedInstrument | null {
  const raw = input.trim()
  if (!raw || raw.length < 3) return null

  const upper = raw.toUpperCase().replace(/\s+/g, " ")

  // Check for presence of CE or PE or CALL or PUT
  const hasOptType = /\b(CE|PE|CALL|PUT)\b/.test(upper) || /(CE|PE)$/.test(upper)
  if (!hasOptType) return null

  let optType: OptionType = "CE"
  if (/\bPE\b|\bPUT\b|PE$/.test(upper)) optType = "PE"

  // Extract Strike Price (3 to 6 digits)
  const strikeMatch = upper.match(/\b(\d{3,6})\b/)
  const strike = strikeMatch ? parseInt(strikeMatch[1], 10) : undefined

  // Extract Expiry Month if present
  let expiryStr = "JUL"
  const monthMatch = upper.match(/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/)
  if (monthMatch) expiryStr = monthMatch[1]

  // Extract Underlying candidate by removing numbers, CE/PE/CALL/PUT, month names
  let cleaned = upper
    .replace(/\b(CE|PE|CALL|PUT)\b/g, "")
    .replace(/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/g, "")
    .replace(/\b\d{1,2}\b/g, "") // remove day numbers like 31
    .replace(/\b\d{3,6}\b/g, "") // remove strike numbers
    .trim()

  if (!cleaned) cleaned = "NIFTY"

  // Map underlying
  let underlyingSymbol = INDEX_MAP[cleaned] || STOCK_MAP[cleaned]
  let underlyingName = cleaned

  if (!underlyingSymbol) {
    // Try fuzzy match
    for (const k of Object.keys(INDEX_MAP)) {
      if (cleaned.includes(k) || k.includes(cleaned)) {
        underlyingSymbol = INDEX_MAP[k]
        underlyingName = INDEX_NAMES[underlyingSymbol] || k
        break
      }
    }
  }

  if (!underlyingSymbol) {
    for (const k of Object.keys(STOCK_MAP)) {
      if (cleaned.includes(k) || k.includes(cleaned)) {
        underlyingSymbol = STOCK_MAP[k]
        underlyingName = STOCK_NAMES[underlyingSymbol] || k
        break
      }
    }
  }

  if (!underlyingSymbol) {
    underlyingSymbol = cleaned + (cleaned.includes(".") ? "" : ".NS")
    underlyingName = cleaned
  }

  const defaultStrikes: Record<string, number> = {
    "^NSEI": 25000,
    "^NSEBANK": 56000,
    "NIFTY_FIN_SERVICE.NS": 24000,
    "^BSESN": 85000,
    "^NSMIDCP": 13000,
    "RELIANCE.NS": 1500,
    "SBIN.NS": 900,
    "TCS.NS": 4200,
    "INFY.NS": 1800,
    "ICICIBANK.NS": 1200,
    "HDFCBANK.NS": 1650,
    "LT.NS": 3600,
  }

  const finalStrike = strike ?? defaultStrikes[underlyingSymbol] ?? 1000

  const monthNum = MONTHS[expiryStr] || "07"
  const year = new Date().getFullYear()
  const expiryDate = `${year}-${monthNum}-31`

  return {
    type: "option",
    symbol: underlyingSymbol,
    name: `${underlyingName} ${expiryStr} ${finalStrike} ${optType}`,
    exchange: "NSE",
    underlying: underlyingName,
    underlyingSymbol,
    strike: finalStrike,
    optionType: optType,
    expiry: expiryStr,
    expiryDate,
    raw,
  }
}

export function parseInstrument(input: string): ParsedInstrument {
  const raw = input.trim()
  if (!raw) return { type: "unknown", symbol: raw, name: raw, raw }

  const upper = raw.toUpperCase()

  // 1. Try flexible option parser first if query contains option hints
  const optParsed = parseOptionQuery(raw)
  if (optParsed) return optParsed

  // 2. Futures: WORD FUT
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

  // 3. Known index
  const indexSymbol = INDEX_MAP[upper]
  if (indexSymbol) {
    return { type: "index", symbol: indexSymbol, name: INDEX_NAMES[indexSymbol] ?? upper, exchange: "NSE", raw }
  }

  // 4. Known commodity
  const commoditySymbol = COMMODITY_MAP[upper]
  if (commoditySymbol) {
    return { type: "commodity", symbol: commoditySymbol, name: `${upper} Futures`, exchange: "COMEX", raw }
  }

  // 5. Yahoo extension
  if (/\.(NS|BO|TO|L|SS|SZ)$/.test(upper)) {
    return { type: "equity", symbol: upper, name: upper.replace(/\.(NS|BO)$/, ""), exchange: upper.endsWith(".NS") ? "NSE" : "BSE", raw }
  }

  // 6. Forex
  if (/=X$/.test(upper) || /^(USD|EUR|GBP|JPY|AUD|CAD|INR)(INR|USD|EUR|GBP|JPY)$/.test(upper)) {
    const sym = upper.endsWith("=X") ? upper : `${upper}=X`
    return { type: "forex", symbol: sym, name: upper.replace("=X", ""), exchange: "FX", raw }
  }

  // 7. Crypto
  if (/-USD$/.test(upper) || ["BTC", "ETH", "SOL", "DOGE", "XRP", "ADA", "BNB"].includes(upper)) {
    const sym = upper.endsWith("-USD") ? upper : `${upper}-USD`
    return { type: "crypto", symbol: sym, name: upper.replace("-USD", ""), exchange: "CCC", raw }
  }

  // 8. Known stock map
  if (STOCK_MAP[upper]) {
    const sym = STOCK_MAP[upper]
    return { type: "equity", symbol: sym, name: STOCK_NAMES[sym] ?? upper, exchange: "NSE", raw }
  }

  // 9. Fallback
  return { type: "equity", symbol: upper, name: upper, raw }
}

export function suggestOptionContracts(underlying: string, count = 3): { symbol: string; name: string; exchange: string; type: string; strike: number; optionType: "CE" | "PE"; expiry: string; underlying: string }[] {
  const u = underlying.toUpperCase()
  const resolved = INDEX_MAP[u] ?? STOCK_MAP[u] ?? null
  if (!resolved) return []

  const monthNames = ["JUL", "AUG", "SEP"]
  const baseStrikes: Record<string, number> = {
    "^NSEI": 25000,
    "^NSEBANK": 56000,
    "NIFTY_FIN_SERVICE.NS": 24000,
    "^BSESN": 85000,
    "^NSMIDCP": 13000,
    "RELIANCE.NS": 1500,
    "SBIN.NS": 900,
    "TCS.NS": 4200,
    "INFY.NS": 1800,
    "ICICIBANK.NS": 1200,
    "HDFCBANK.NS": 1650,
  }

  const base = baseStrikes[resolved] ?? 1000
  const name = INDEX_NAMES[resolved] ?? STOCK_NAMES[resolved] ?? u
  const types: ("CE" | "PE")[] = ["CE", "PE"]
  const results: { symbol: string; name: string; exchange: string; type: string; strike: number; optionType: "CE" | "PE"; expiry: string; underlying: string }[] = []

  const step = base > 10000 ? 500 : base > 2000 ? 100 : 50

  for (const month of monthNames.slice(0, count)) {
    for (const off of [0, 1, -1]) {
      for (const optType of types) {
        const strike = base + off * step
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
      }
    }
  }

  return results.slice(0, count * 4)
}
