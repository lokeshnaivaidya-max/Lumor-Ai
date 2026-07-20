"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Check, Rocket, Building2, Clock, Sparkles } from "lucide-react"
import { FadeUp } from "@/components/reveal"

const PLANS = [
  {
    name: "Free Beta",
    price: "Free",
    period: "during beta",
    highlight: true,
    icon: Rocket,
    features: [
      "Real-time quotes & charts",
      "AI analysis on any stock",
      "Watchlists & dashboard",
      "AI chat assistant",
      "No credit card required",
    ],
    cta: "Start free",
    href: "/sign-up",
  },
  {
    name: "Early Access",
    price: "Free",
    period: "waitlist",
    highlight: false,
    icon: Sparkles,
    features: [
      "Everything in Free Beta",
      "Priority AI models",
      "Trade planner & confidence",
      "Early feature previews",
      "Founder direct feedback line",
    ],
    cta: "Join waitlist",
    href: "/sign-up",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "after launch",
    highlight: false,
    icon: Building2,
    features: [
      "Team workspaces & SSO",
      "API & data feeds",
      "Dedicated support",
      "Custom integrations",
      "Compliance & audit logs",
    ],
    cta: "Contact us",
    href: "/sign-up",
  },
]

export function Pricing() {
  return (
    <FadeUp>
      <p className="subheading text-center">Pricing</p>
      <h2 className="title mt-3 text-center">Free while we build in the open</h2>
      <p className="body mx-auto mt-4 max-w-xl text-center">
        Lumora is free during beta. No plans are charged today — pricing launches with us. Here&apos;s what&apos;s on the way.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((p, i) => {
          const Icon = p.icon
          return (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={`relative flex flex-col rounded-3xl border p-7 ${
                p.highlight ? "border-[var(--gold-line)] bg-[var(--gold-glow)]" : "border-[var(--line)] bg-[var(--panel)]"
              }`}
            >
              {p.highlight && <span className="chip chip-gold absolute -top-3 left-1/2 -translate-x-1/2">Available now</span>}
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--gold-line)] bg-[var(--gold-glow)] text-[var(--gold)]">
                <Icon className="h-5 w-5" />
              </span>
              <p className="meta mt-4">{p.name}</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="stat-number" style={{ color: "var(--text-primary)" }}>{p.price}</span>
                {p.period && <span className="mb-1 text-sm" style={{ color: "var(--text-tertiary)" }}>{p.period}</span>}
              </div>
              <div className="my-5 h-px" style={{ background: "var(--line)" }} />
              <ul className="flex flex-1 flex-col gap-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <Check className="h-4 w-4 shrink-0" style={{ color: "var(--gold)" }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={p.href} className={`btn mt-6 w-full justify-center ${p.highlight ? "btn--gold" : ""}`}>
                {p.cta}
              </Link>
              {p.name === "Early Access" && (
                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  <Clock className="h-3 w-3" /> Opening to a limited cohort
                </p>
              )}
            </motion.div>
          )
        })}
      </div>
    </FadeUp>
  )
}
