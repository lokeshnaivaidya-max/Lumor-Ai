import { AmbientBackground } from "@/components/ambient-background"
import { CursorGlow } from "@/components/cursor-glow"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { MarketMarquee } from "@/components/market-marquee"
import { Features } from "@/components/features"
import { Coverage } from "@/components/coverage"
import { CtaFooter } from "@/components/cta-footer"
import { LoadingSequence } from "@/components/loading-sequence"
import { getQuotes, CURATED_TICKER } from "@/lib/market"

export const revalidate = 30

export default async function HomePage() {
  const quotes = await getQuotes(CURATED_TICKER)

  return (
    <>
      <LoadingSequence />
      <AmbientBackground />
      <CursorGlow />
      <Navbar />
      <main className="relative z-10">
        <Hero quotes={quotes} />
        <MarketMarquee quotes={quotes} />
        <Features />
        <Coverage />
        <CtaFooter />
      </main>
    </>
  )
}
