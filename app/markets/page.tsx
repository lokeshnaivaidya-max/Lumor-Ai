import Link from "next/link"
import { ArrowLeft, BarChart3, Target, ShieldAlert, Scale } from "lucide-react"

import { LumoraMark } from "@/components/lumora-mark"
import { ThemeToggle } from "@/components/theme-toggle"
import { MarketExplorer } from "@/components/market-explorer"

export const metadata = {
  title: "Markets Terminal — Lumora AI",
  description: "Live quotes, interactive charts, technical indicators, and AI-generated analysis for global markets.",
}

export default async function MarketsPage({ searchParams }: { searchParams?: Promise<{ symbol?: string }> }) {
  const params = await searchParams
  const symbol = params?.symbol?.toUpperCase() || "AAPL"

  return (
    <>
      
      <header className="relative z-30 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6">
        <Link href="/" className="flex items-center gap-2.5 text-foreground">
          <LumoraMark className="h-7 w-7" />
          <span className="font-heading font-semibold tracking-tight">Lumora</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/" className="glass-card flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <div className="mx-auto w-full max-w-6xl px-4 pb-2 pt-4">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-emerald">Markets Terminal</p>
          <h1 className="font-heading mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Search any market. See the <span className="text-gradient">signal.</span>
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
            Live quotes, interactive charts, and technical indicators — paired with on-demand AI analysis for global
            equities, indices, and crypto.
          </p>
        </div>
        <MarketExplorer initialSymbol={symbol} />

        <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12">
          <div className="rounded-[28px] border border-gold/15 bg-gold/[0.04] p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-gold">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">Trade Planner</p>
                </div>
                <h2 className="font-heading mt-3 text-2xl font-semibold tracking-tight text-foreground">
                  Plan your trade before you place it
                </h2>
                <p className="mt-2 text-pretty text-muted-foreground">
                  Enter your entry price, quantity, and style — intraday or swing — and get AI-computed target, stop-loss,
                  risk&nbsp;/&nbsp;reward, and position sizing. Describe it in plain language and we&apos;ll parse it for you.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="glass-card flex items-center gap-1.5 rounded-full px-3 py-1.5"><Target className="h-3 w-3 text-gold" />Target &amp; Stop-Loss</span>
                  <span className="glass-card flex items-center gap-1.5 rounded-full px-3 py-1.5"><Scale className="h-3 w-3 text-gold" />Risk / Reward</span>
                  <span className="glass-card flex items-center gap-1.5 rounded-full px-3 py-1.5"><ShieldAlert className="h-3 w-3 text-gold" />Position Sizing</span>
                </div>
              </div>
              <Link
                href="/trade-planner"
                className="lm-btn lm-btn--gold shrink-0 px-6 py-3 text-sm"
              >
                Open Trade Planner
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
