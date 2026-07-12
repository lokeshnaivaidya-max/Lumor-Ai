"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { Sparkles, ArrowRight } from "lucide-react"

export function CtaFooter() {
  return (
    <footer className="relative overflow-hidden">
      <section className="section-blue relative px-4 py-28">
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="badge-blue mb-4 inline-block rounded-full px-3 py-1 text-xs font-medium">
              Get Started
            </span>
            <h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Ready to See <span className="text-gradient">Clearly?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
              Join thousands of traders who trust Lumora for market intelligence.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className="premium-btn premium-btn-primary group px-8 py-3.5 text-sm"
              >
                <Sparkles className="h-4 w-4" />
                Start Free
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/markets"
                className="premium-btn premium-btn-ghost px-8 py-3.5 text-sm"
              >
                Explore Terminal
              </Link>
            </div>
          </motion.div>
        </div>

        <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue/[0.04] blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-violet/[0.04] blur-[100px]" />
      </section>

      <div className="border-t px-4 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-md text-sm leading-relaxed text-muted-foreground"
          >
            Built with passion for everyone who dreams of financial freedom through intelligent investing.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2"
          >
            <span className="font-heading text-sm font-semibold">Lumora</span>
            <span className="text-xs text-muted-foreground">AI</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            Designed &amp; Developed by <span className="font-medium text-foreground">Lokesh</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-6 text-xs text-muted-foreground"
          >
            <span>&copy; 2026 Lumora AI</span>
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}
