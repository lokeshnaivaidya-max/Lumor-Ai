/**
 * Unified currency detection and formatting for Lumora AI
 * Supports multi-exchange currencies (INR, USD, GBP, JPY, EUR, CAD, AUD, HKD, etc.)
 */

export function getCurrencyForSymbol(symbol: string = "", exchange: string = "", currency: string = ""): string {
  // If a valid non-empty currency is provided by provider, use it
  if (currency && currency.trim() !== "" && currency.toUpperCase() !== "UNKNOWN") {
    const uc = currency.toUpperCase()
    if (uc === "GBX" || uc === "GBPENCE") return "GBP"
    return uc
  }

  const s = symbol.toUpperCase()
  const ex = (exchange || "").toUpperCase()

  // Indian Stock Exchange detection (NSE / BSE)
  if (
    s.endsWith(".NS") ||
    s.endsWith(".BO") ||
    s.startsWith("^NSE") ||
    s.startsWith("^BSE") ||
    s.includes("NIFTY") ||
    s.includes("SENSEX") ||
    ex.includes("NSE") ||
    ex.includes("BSE") ||
    ex.includes("BOMBAY") ||
    ex.includes("NATIONAL STOCK")
  ) {
    return "INR"
  }

  // London Stock Exchange
  if (s.endsWith(".L") || ex.includes("LSE") || ex.includes("LONDON")) {
    return "GBP"
  }

  // Tokyo Stock Exchange
  if (s.endsWith(".T") || ex.includes("TSE") || ex.includes("TOKYO") || ex.includes("JPX")) {
    return "JPY"
  }

  // European Exchanges (XETRA, Euronext, Frankfurt, Milan, Paris)
  if (
    s.endsWith(".DE") ||
    s.endsWith(".PA") ||
    s.endsWith(".MI") ||
    s.endsWith(".AS") ||
    s.endsWith(".BR") ||
    ex.includes("EURONEXT") ||
    ex.includes("XETRA") ||
    ex.includes("FRANKFURT") ||
    ex.includes("PARIS")
  ) {
    return "EUR"
  }

  // Toronto Stock Exchange
  if (s.endsWith(".TO") || s.endsWith(".V") || ex.includes("TSX") || ex.includes("TORONTO")) {
    return "CAD"
  }

  // Australian Securities Exchange
  if (s.endsWith(".AX") || ex.includes("ASX") || ex.includes("AUSTRALIA")) {
    return "AUD"
  }

  // Hong Kong Stock Exchange
  if (s.endsWith(".HK") || ex.includes("HKEX") || ex.includes("HONG KONG")) {
    return "HKD"
  }

  // Cryptocurrencies with specific quote currency
  if (s.includes("-") || s.includes("/")) {
    if (s.endsWith("INR") || s.endsWith("/INR")) return "INR"
    if (s.endsWith("EUR") || s.endsWith("/EUR")) return "EUR"
    if (s.endsWith("GBP") || s.endsWith("/GBP")) return "GBP"
    if (s.endsWith("JPY") || s.endsWith("/JPY")) return "JPY"
  }

  // Default to USD for US stocks (NASDAQ, NYSE) and unclassified
  return "USD"
}

export function getCurrencySymbol(currency: string = "USD"): string {
  const c = currency.toUpperCase()
  switch (c) {
    case "INR":
      return "₹"
    case "USD":
      return "$"
    case "GBP":
    case "GBX":
      return "£"
    case "EUR":
      return "€"
    case "JPY":
      return "¥"
    case "CAD":
      return "CA$"
    case "AUD":
      return "A$"
    case "HKD":
      return "HK$"
    case "SGD":
      return "S$"
    case "CNY":
    case "RMB":
      return "¥"
    case "KRW":
      return "₩"
    default:
      return "$"
  }
}

/**
 * Format price with correct currency symbol and locale formatting.
 * Accepts:
 * - formatCurrency(1234.56, "INR")
 * - formatCurrency(1234.56, { symbol: "RELIANCE.NS", exchange: "NSE", currency: "INR" })
 * - formatCurrency(1234.56, "RELIANCE.NS")
 */
export function formatCurrency(
  amount: number | null | undefined,
  currencyOrObj: string | { symbol?: string; exchange?: string; currency?: string } = "USD",
  opts?: { compact?: boolean; decimals?: number; showSymbol?: boolean }
): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "—"

  let detectedCurrency = "USD"
  if (typeof currencyOrObj === "object" && currencyOrObj !== null) {
    detectedCurrency = getCurrencyForSymbol(
      currencyOrObj.symbol || "",
      currencyOrObj.exchange || "",
      currencyOrObj.currency || ""
    )
  } else if (typeof currencyOrObj === "string") {
    if (currencyOrObj.length <= 4 && !currencyOrObj.includes(".")) {
      // Looks like a currency code (e.g., INR, USD, GBP)
      detectedCurrency = currencyOrObj
    } else {
      // Looks like a ticker symbol (e.g., RELIANCE.NS, AAPL)
      detectedCurrency = getCurrencyForSymbol(currencyOrObj)
    }
  }

  const symbol = getCurrencySymbol(detectedCurrency)
  const showSymbol = opts?.showSymbol ?? true
  const decimals = opts?.decimals ?? (Math.abs(amount) < 1 && Math.abs(amount) > 0 ? 4 : 2)

  let formattedNumber = ""

  if (opts?.compact) {
    const abs = Math.abs(amount)
    if (detectedCurrency === "INR") {
      if (abs >= 10_000_000) {
        formattedNumber = (amount / 10_000_000).toFixed(2) + " Cr"
      } else if (abs >= 100_000) {
        formattedNumber = (amount / 100_000).toFixed(2) + " L"
      } else if (abs >= 1_000) {
        formattedNumber = (amount / 1_000).toFixed(2) + " K"
      } else {
        formattedNumber = amount.toFixed(decimals)
      }
    } else {
      if (abs >= 1_000_000_000_000) {
        formattedNumber = (amount / 1_000_000_000_000).toFixed(2) + "T"
      } else if (abs >= 1_000_000_000) {
        formattedNumber = (amount / 1_000_000_000).toFixed(2) + "B"
      } else if (abs >= 1_000_000) {
        formattedNumber = (amount / 1_000_000).toFixed(2) + "M"
      } else if (abs >= 1_000) {
        formattedNumber = (amount / 1_000).toFixed(2) + "K"
      } else {
        formattedNumber = amount.toFixed(decimals)
      }
    }
  } else {
    const locale = detectedCurrency === "INR" ? "en-IN" : "en-US"
    try {
      formattedNumber = new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(amount)
    } catch {
      formattedNumber = amount.toFixed(decimals)
    }
  }

  return showSymbol ? `${symbol}${formattedNumber}` : formattedNumber
}

/**
 * Convenient helper for formatting prices directly using ticker symbol or quote object
 */
export function formatPrice(
  amount: number | null | undefined,
  symbol: string = "",
  exchange: string = "",
  currency: string = ""
): string {
  const detectedCurrency = getCurrencyForSymbol(symbol, exchange, currency)
  return formatCurrency(amount, detectedCurrency)
}
