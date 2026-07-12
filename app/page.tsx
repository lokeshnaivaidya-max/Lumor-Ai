import { AmbientBackground } from "@/components/ambient-background"
import { CursorGlow } from "@/components/cursor-glow"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Coverage } from "@/components/coverage"
import { CtaFooter } from "@/components/cta-footer"
import { LoadingSequence } from "@/components/loading-sequence"

export default async function HomePage() {

  return (
    <>
      <LoadingSequence />
      <AmbientBackground />
      <CursorGlow />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <Features />
        <Coverage />
        <CtaFooter />
      </main>
    </>
  )
}
