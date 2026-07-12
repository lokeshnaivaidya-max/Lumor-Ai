"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { Sparkles, ArrowRight, Heart } from "lucide-react"

export function CtaFooter() {
  return (
    <footer className="relative overflow-hidden">
      {/* CTA Section */}
      <section className="section-emerald relative px-4 py-28 text-center">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-block rounded-full badge-emerald px-3 py-1 text-xs font-medium mb-4">
              Get Started
            </span>
            <h2 className="font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Ready to See{" "}
              <span className="text-gradient-emerald">Clearly?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/50">
              Join thousands of traders who trust Lumora for market intelligence. No credit card required.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className="premium-btn premium-btn-emerald group px-8 py-3.5 text-sm"
              >
                <Sparkles className="h-4 w-4" />
                Start Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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

        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald/5 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan/5 blur-[120px]" />
      </section>

      {/* Footer */}
      <div className="border-t border-white/5 px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-heading text-sm font-semibold text-white">Lumora</span>
            <span className="text-xs text-white/30">AI</span>
          </div>
          <p className="flex items-center gap-1 text-xs text-white/30">
            Made with <Heart className="h-3 w-3 text-neg" /> for smarter investors
          </p>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <span>© 2026 Lumora AI</span>
            <Link href="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
