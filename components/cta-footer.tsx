"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { Sparkles, ArrowRight } from "lucide-react"

const footerLinks = [
  {
    heading: "Product",
    links: [
      { label: "Markets", href: "/markets" },
      { label: "Intelligence", href: "#intelligence" },
      { label: "Coverage", href: "#coverage" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Contact", href: "mailto:support@lumora.app" },
    ],
  },
]

export function CtaFooter() {
  return (
    <footer className="relative overflow-hidden">
      <section className="relative px-4 py-32">

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
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-start gap-4 sm:col-span-2 lg:col-span-2"
            >
              <div className="flex items-center gap-2">
                <span className="font-heading text-xl font-semibold tracking-tight">Lumora</span>
                <span className="rounded-full bg-blue/10 px-2.5 py-0.5 text-[10px] font-medium text-blue">AI</span>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                AI-powered market intelligence platform. Real-time data, predictive analytics, and portfolio optimization for the modern investor.
              </p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                Designed &amp; Developed by <span className="font-medium text-foreground">Lokesh</span>
              </div>
            </motion.div>

            {footerLinks.map((group, i) => (
              <motion.div
                key={group.heading}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="flex flex-col items-start gap-3"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
                  {group.heading}
                </span>
                {group.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-12 border-t border-border/30 pt-8 text-center text-xs text-muted-foreground/60"
          >
            &copy; 2026 Lumora AI. All rights reserved.
          </motion.div>
        </div>
      </div>
    </footer>
  )
}
