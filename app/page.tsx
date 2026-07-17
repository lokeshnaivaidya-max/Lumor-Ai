import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Coverage } from "@/components/coverage"
import { CtaFooter } from "@/components/cta-footer"
import { LoadingSequence } from "@/components/loading-sequence"

export default function HomePage() {

  return (
    <>
      <LoadingSequence />
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
