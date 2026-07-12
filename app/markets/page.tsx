import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AmbientBackground } from "@/components/ambient-background"
import { CursorGlow } from "@/components/cursor-glow"
import { LumoraMark } from "@/components/lumora-mark"
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
      <AmbientBackground />
      <CursorGlow />
      <div className="mesh-bg fixed inset-0 opacity-30" />

      <header className="relative z-30 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6">
        <Link href="/" className="flex items-center gap-2.5 text-foreground">
          <LumoraMark className="h-7 w-7" />
          <span className="font-heading font-semibold tracking-tight">Lumora</span>
        </Link>
        <Link href="/" className="glass-card flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </Link>
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
      </main>
    </>
  )
}
