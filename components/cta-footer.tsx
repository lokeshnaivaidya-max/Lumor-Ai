"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight } from "lucide-react"

export function CtaFooter() {
  return (
    <section className="relative overflow-hidden px-6 py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,oklch(0.45_0.15_265/0.08)_0%,transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto max-w-3xl text-center"
      >
        <h2 className="font-heading text-balance text-4xl font-light tracking-tight text-foreground sm:text-5xl">
          Ready to see the market{' '}
          <span className="font-semibold text-gradient">clearly</span>
          ?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Create your account in under a minute. No credit card required.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/sign-up"
            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-foreground px-6 text-sm font-semibold text-background transition-all hover:opacity-90"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/markets"
            className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 text-sm font-medium text-foreground transition-all hover:bg-white/[0.08]"
          >
            Explore markets
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
