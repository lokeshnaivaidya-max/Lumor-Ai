"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Check } from "lucide-react"
import { FadeUp } from "@/components/reveal"

const PLANS = [
  {
    name: "Explorer", price: "Free", period: "forever",
    features: ["Real-time quotes", "3 watchlists", "Daily AI brief", "Community chat"],
    cta: "Get started", href: "/sign-up", highlight: false,
  },
  {
    name: "Trader", price: "$18", period: "/month",
    features: ["Everything in Explorer", "Unlimited AI analysis", "Trade planner + confidence", "Full news sentiment", "Priority models"],
    cta: "Start trial", href: "/sign-up", highlight: true,
  },
  {
    name: "Desk", price: "Custom", period: "",
    features: ["Everything in Trader", "Team workspaces", "API access", "Dedicated support", "SSO + audit"],
    cta: "Contact us", href: "/sign-up", highlight: false,
  },
]

export function Pricing() {
  return (
    <FadeUp>
      <p className="subheading text-center">Pricing</p>
      <h2 className="title mt-3 text-center">Simple, transparent plans</h2>
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((p, i) => (
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
            {p.highlight && <span className="chip chip-gold absolute -top-3 left-1/2 -translate-x-1/2">Most popular</span>}
            <p className="meta">{p.name}</p>
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
          </motion.div>
        ))}
      </div>
    </FadeUp>
  )
}
