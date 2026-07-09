"use client"

import {
  Activity,
  Brain,
  Globe2,
  LineChart,
  Newspaper,
  ShieldCheck,
} from "lucide-react"
import { Reveal } from "./reveal"

const cards = [
  {
    icon: Brain,
    title: "AI research desk",
    body: "Bull case, bear case, technicals, fundamentals, and a price target — authored on demand for any ticker.",
    className: "md:col-span-3 md:row-span-2",
    feature: true,
  },
  {
    icon: Globe2,
    title: "60+ exchanges",
    body: "NYSE, Nasdaq, LSE, TSE, HKEX, NSE and more. Auto-detected currency, timezone and session.",
    className: "md:col-span-3",
  },
  {
    icon: LineChart,
    title: "Deep technicals",
    body: "RSI, MACD, EMA, VWAP, ATR, ADX, Bollinger, Ichimoku, Fibonacci — computed live.",
    className: "md:col-span-2",
  },
  {
    icon: Newspaper,
    title: "News, summarized",
    body: "Real headlines distilled with sentiment scoring.",
    className: "md:col-span-2",
  },
  {
    icon: Activity,
    title: "Market status",
    body: "Open, pre-market, after-hours, or holiday — with a live countdown.",
    className: "md:col-span-2",
  },
  {
    icon: ShieldCheck,
    title: "Risk lens",
    body: "Volatility, drawdown and exposure signals surfaced before you act.",
    className: "md:col-span-6",
  },
]

export function Features() {
  return (
    <section id="intelligence" className="relative px-6 py-28 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="font-mono text-xs tracking-widest text-accent uppercase">
            The intelligence layer
          </p>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Everything a desk of analysts does,{" "}
            <span className="font-serif italic font-normal text-gradient">
              in one breath.
            </span>
          </h2>
        </Reveal>

        <div className="mt-14 grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 md:grid-cols-6">
          {cards.map((c, i) => {
            const Icon = c.icon
            return (
              <Reveal key={c.title} delay={i * 0.06} className={c.className}>
                <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl glass p-6 transition-all duration-500 hover:border-primary/30">
                  <div
                    className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: "oklch(0.68 0.17 245 / 0.5)" }}
                  />
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl glass">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="mt-5 text-lg font-medium tracking-tight">
                    {c.title}
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                    {c.body}
                  </p>

                  {c.feature && (
                    <div className="mt-auto pt-6">
                      <div className="rounded-2xl border border-white/5 bg-black/30 p-4 font-mono text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="h-2 w-2 rounded-full bg-accent" />
                          lumora · analyze AAPL
                        </div>
                        <p className="mt-3 leading-relaxed text-foreground/80">
                          <span className="text-accent">Recommendation:</span> Buy
                          · confidence 84%
                          <br />
                          <span className="text-muted-foreground">
                            Momentum constructive above the 50-day EMA; RSI 61
                            leaves room before overbought…
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
