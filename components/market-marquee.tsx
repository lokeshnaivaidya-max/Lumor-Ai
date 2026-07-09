"use client"

import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import type { Quote } from "@/lib/market"

function niceName(q: Quote) {
  const map: Record<string, string> = {
    "^GSPC": "S&P 500",
    "^IXIC": "Nasdaq",
    "^DJI": "Dow Jones",
    "BTC-USD": "Bitcoin",
    "ETH-USD": "Ethereum",
  }
  return map[q.symbol] ?? q.symbol
}

export function MarketMarquee({ quotes }: { quotes: Quote[] }) {
  if (!quotes.length) return null
  const items = [...quotes, ...quotes]

  return (
    <div className="relative w-full overflow-hidden border-y border-border/60 bg-white/[0.015] py-4">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32"
        style={{ background: "linear-gradient(90deg, var(--background), transparent)" }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32"
        style={{ background: "linear-gradient(270deg, var(--background), transparent)" }}
      />
      <div className="animate-marquee flex w-max items-center gap-8 whitespace-nowrap will-change-transform">
        {items.map((q, i) => {
          const up = q.changePercent >= 0
          return (
            <div key={`${q.symbol}-${i}`} className="flex items-center gap-2.5">
              <span className="font-mono text-sm text-muted-foreground">
                {niceName(q)}
              </span>
              <span className="text-sm font-medium tabular-nums">
                {q.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span
                className={`flex items-center gap-0.5 text-xs tabular-nums ${
                  up ? "text-accent" : "text-red-400"
                }`}
              >
                {up ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(q.changePercent).toFixed(2)}%
              </span>
              <span className="text-border">·</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
