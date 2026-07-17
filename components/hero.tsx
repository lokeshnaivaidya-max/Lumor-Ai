"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.45_0.15_265/0.12)_0%,transparent_70%)]" />

      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
          Live across 60+ global exchanges
        </div>

        <h1 className="font-heading text-balance text-5xl font-light leading-[1.1] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
          See the market{' '}
          <span className="font-semibold text-gradient">clearly</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Real-time global market intelligence powered by AI. Track every major exchange from a single terminal — no noise, no clutter.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/markets"
            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-foreground px-6 text-sm font-semibold text-background transition-all hover:opacity-90"
          >
            Launch Terminal
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 text-sm font-medium text-foreground transition-all hover:bg-white/[0.08]"
          >
            Create account
          </Link>
        </div>
      </div>
    </section>
  )
}
