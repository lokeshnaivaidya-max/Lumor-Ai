"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Check, Rocket } from "lucide-react"
import { FadeUp } from "@/components/reveal"

const PLAN = {
  name: "Free During Beta",
  price: "Free",
  period: "while we build in public",
  icon: Rocket,
  description:
    "Lumora is currently free while we build in public. Everything is unlocked — no trial, no card, no catch.",
  features: [
    "AI Analysis on any stock",
    "Live market data & charts",
    "Personal dashboard",
    "Watchlists & saved analysis",
    "AI chat assistant",
    "Unlimited beta access",
  ],
  cta: "Start free",
  href: "/sign-up",
}

export function Pricing() {
  const Icon = PLAN.icon
  return (
    <FadeUp>
      <p className="subheading text-center">Pricing</p>
      <h2 className="title mt-3 text-center">Free while we build in the open</h2>
      <p className="body mx-auto mt-4 max-w-xl text-center">
        No plans, no tiers, no surprises. Lumora is free during beta — every feature
        is available to every member today.
      </p>
      <div className="mt-10 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex w-full max-w-md flex-col rounded-3xl border border-[var(--gold-line)] bg-[var(--gold-glow)] p-7"
        >
          <span className="chip chip-gold absolute -top-3 left-1/2 -translate-x-1/2">
            Available now
          </span>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--gold-line)] bg-[var(--gold-glow)] text-[var(--gold)]">
            <Icon className="h-5 w-5" />
          </span>
          <p className="meta mt-4">{PLAN.name}</p>
          <div className="mt-3 flex items-end gap-1">
            <span className="stat-number" style={{ color: "var(--text-primary)" }}>
              {PLAN.price}
            </span>
            <span className="mb-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
              {PLAN.period}
            </span>
          </div>
          <p className="body mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            {PLAN.description}
          </p>
          <div className="my-5 h-px" style={{ background: "var(--line)" }} />
          <ul className="flex flex-1 flex-col gap-2.5">
            {PLAN.features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                <Check className="h-4 w-4 shrink-0" style={{ color: "var(--gold)" }} />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href={PLAN.href}
            className="btn btn--gold mt-6 w-full justify-center"
          >
            {PLAN.cta}
          </Link>
        </motion.div>
      </div>
    </FadeUp>
  )
}
