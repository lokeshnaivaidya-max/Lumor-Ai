"use client"

import { type Quote } from "@/lib/market"

export function MarketMarquee({ quotes }: { quotes: Quote[] }) {
  if (quotes.length === 0) return null

  const items = [...quotes, ...quotes]

  return (
    <div className="relative overflow-hidden border-y border-border/30 py-3">
      <div className="absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      <div className="flex animate-marquee gap-10 hover:[animation-play-state:paused]">
        {items.map((q, i) => (
          <div key={`${q.symbol}-${i}`} className="flex shrink-0 items-center gap-3 text-sm">
            <span className="font-heading font-semibold tracking-tight">{q.symbol}</span>
            <span className="tabular-nums">${q.price.toFixed(2)}</span>
            <span className={`tabular-nums ${q.changePercent >= 0 ? "text-emerald" : "text-neg"}`}>
              {q.changePercent >= 0 ? "+" : ""}{q.changePercent.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
