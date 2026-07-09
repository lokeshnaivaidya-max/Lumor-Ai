"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { LumoraMark } from "./lumora-mark"
import { MagneticButton } from "./magnetic-button"
import { Reveal } from "./reveal"

export function CtaFooter() {
  return (
    <footer id="pricing" className="relative px-6 pb-12 pt-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] glass-strong px-8 py-16 text-center sm:px-16 sm:py-24">
            <div
              className="animate-pulse-glow pointer-events-none absolute inset-x-0 top-0 mx-auto h-64 w-64 rounded-full blur-[100px]"
              style={{ background: "oklch(0.6 0.18 250 / 0.5)" }}
            />
            <h2 className="relative text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              See the market like{" "}
              <span className="font-serif italic font-normal text-gradient">
                never before.
              </span>
            </h2>
            <p className="relative mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
              Join the intelligence layer trusted for cinematic clarity across
              global markets. Free to start — no card required.
            </p>
            <div className="relative mt-9 flex flex-wrap justify-center gap-3">
              <MagneticButton href="/markets">
                Launch the terminal
                <ArrowUpRight className="h-4 w-4" />
              </MagneticButton>
              <MagneticButton href="#intelligence" variant="ghost">
                Explore features
              </MagneticButton>
            </div>
          </div>
        </Reveal>

        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-border/60 pt-8 sm:flex-row">
          <Link href="/" className="flex items-center gap-2.5">
            <LumoraMark className="h-6 w-6" />
            <span className="font-semibold tracking-tight">Lumora</span>
          </Link>
          <p className="text-xs text-muted-foreground">
            Market data for informational purposes only. Not investment advice.
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Lumora Intelligence
          </p>
        </div>
      </div>
    </footer>
  )
}
