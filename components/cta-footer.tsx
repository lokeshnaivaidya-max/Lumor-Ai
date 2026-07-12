"use client"

import { motion } from "motion/react"
import { ArrowUpRight } from "lucide-react"
import { MagneticButton } from "./magnetic-button"
import { LumoraMark } from "./lumora-mark"

export function CtaFooter() {
  return (
    <section className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card relative overflow-hidden rounded-3xl p-10 sm:p-16 text-center"
        >
          <div className="mesh-bg absolute inset-0 opacity-60" />
          <div className="relative">
            <span className="inline-block rounded-full bg-emerald/10 px-4 py-1.5 text-xs font-medium text-emerald tracking-wide uppercase">Free to start</span>
            <h2 className="font-heading mt-6 text-3xl font-semibold tracking-tight sm:text-5xl">
              Intelligence for every <span className="text-gradient">investor</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground text-pretty">
              No subscription wall. No hidden fees. Real-time data with AI-powered
              insights — completely free.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton href="/markets">
                Start exploring
                <ArrowUpRight className="h-4 w-4" />
              </MagneticButton>
              <MagneticButton href="#intelligence" variant="ghost">
                Learn more
              </MagneticButton>
            </div>
          </div>
        </motion.div>

        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 flex flex-col items-center gap-4 text-center"
        >
          <div className="flex items-center gap-2.5">
            <LumoraMark className="h-5 w-5 text-muted-foreground" />
            <span className="font-heading text-sm font-semibold tracking-tight">Lumora</span>
          </div>
          <p className="max-w-md text-xs text-muted-foreground">
            Lumora provides AI-generated market intelligence for informational purposes only.
            Not financial advice. Always do your own research.
          </p>
          <p className="text-[11px] text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Lumora AI. All rights reserved.
          </p>
        </motion.footer>
      </div>
    </section>
  )
}
