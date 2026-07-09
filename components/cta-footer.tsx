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
          <div className="edge-light grain relative overflow-hidden rounded-[2.5rem] glass-strong px-8 py-16 text-center sm:px-16 sm:py-28">
            <div
              className="animate-pulse-glow pointer-events-none absolute inset-x-0 top-0 mx-auto h-72 w-72 rounded-full blur-[110px]"
              style={{ background: "oklch(0.6 0.18 255 / 0.5)" }}
            />
            <div
              className="animate-pulse-glow pointer-events-none absolute bottom-0 right-1/4 h-56 w-56 rounded-full blur-[110px]"
              style={{ background: "oklch(0.62 0.16 168 / 0.35)", animationDelay: "-2.5s" }}
            />
            <p className="relative font-mono text-xs tracking-[0.3em] text-accent uppercase">
              Free to start · no card required
            </p>
            <h2 className="relative mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              See the market like{" "}
              <span className="font-serif italic font-normal text-gradient-aurora">
                never before.
              </span>
            </h2>
            <p className="relative mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
              Join the intelligence layer trusted for cinematic clarity across
              global markets.
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
          <p className="max-w-sm text-center text-xs text-muted-foreground sm:text-left">
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
