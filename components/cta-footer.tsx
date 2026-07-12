"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { Sparkles, ArrowRight } from "lucide-react"

export function CtaFooter() {
  return (
    <footer className="relative overflow-hidden">
      <section className="section-blue relative px-4 py-32">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue/[0.05] blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet/[0.05] blur-[120px]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald/[0.03] blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-blue/20 bg-blue/[0.06] px-4 py-1.5 text-xs font-medium text-blue"
            >
              <Sparkles className="h-3 w-3" />
              Get Started
            </motion.span>
            <h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Ready to See <span className="text-gradient">Clearly?</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Join thousands of traders who trust Lumora for market intelligence. Start making data-driven decisions today.
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className="premium-btn premium-btn-primary group px-9 py-4 text-sm"
              >
                <Sparkles className="h-4 w-4" />
                Start Free
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/markets"
                className="premium-btn premium-btn-ghost px-9 py-4 text-sm"
              >
                Explore Terminal
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="border-t border-border/40 px-4 py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2"
          >
            <span className="font-heading text-xl font-semibold tracking-tight">Lumora</span>
            <span className="rounded-full bg-blue/10 px-2.5 py-0.5 text-[10px] font-medium text-blue">AI</span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-md text-sm leading-relaxed text-muted-foreground"
          >
            Built with passion for everyone who dreams of financial freedom through intelligent investing.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-1 text-sm text-muted-foreground"
          >
            Designed &amp; Developed by <span className="font-medium text-foreground">Lokesh</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-8 text-xs text-muted-foreground"
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
