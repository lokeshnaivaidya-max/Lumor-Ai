import Link from "next/link"
import { ArrowLeft } from "lucide-react"
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
        <Link href="/" className="flex items-center gap-2.5 text-[var(--text-primary)]">
          <LumoraMark className="h-7 w-7" />
          <span className="font-serif text-lg">Lumora</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/" className="btn flex items-center gap-1.5 px-4 py-2 text-sm">
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-2 pt-4">
          <div className="pointer-events-none absolute -inset-40 opacity-40" style={{ background: 'radial-gradient(circle at 30% 0%, var(--gold-glow-strong), transparent 60%)' }} />
          <div className="relative">
            <p className="subheading"><span className="dot-gold" /> Markets Terminal</p>
            <h1 className="title mt-3 text-[var(--text-primary)]">
              Search any market. See the <span className="text-gradient">signal.</span>
            </h1>
            <p className="body mt-3 text-[var(--text-secondary)]">
              Live quotes, interactive charts, and technical indicators — paired with on-demand AI analysis for global
              equities, indices, and crypto.
            </p>
          </div>
        </div>
        <MarketExplorer initialSymbol={symbol} />
      </main>
    </>
  )
}
