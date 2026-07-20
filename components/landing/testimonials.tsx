"use client"

import { motion } from "motion/react"
import { FadeUp, CardReveal } from "@/components/reveal"
import { Clock, Sparkles } from "lucide-react"

const COMING_SOON = [
  {
    title: "Early access stories",
    desc: "We're gathering feedback from our first operators. Honest reviews from real traders will live here soon.",
    icon: Clock,
  },
  {
    title: "Verified desk notes",
    desc: "Curated notes from professional desks — published only with consent and attribution.",
    icon: Sparkles,
  },
  {
    title: "Community spotlight",
    desc: "A space for the Lumora community to share how they use AI explanations in their workflow.",
    icon: Clock,
  },
]

export function Testimonials() {
  return (
    <FadeUp>
      <p className="subheading text-center">In their words</p>
      <h2 className="title mt-3 text-center">Stories coming soon</h2>
      <p className="body mx-auto mt-4 max-w-xl text-center">
        Lumora is in beta. We&apos;ll publish real, attributed stories from early operators once we launch publicly.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {COMING_SOON.map((t, i) => {
          const Icon = t.icon
          return (
            <CardReveal key={t.title} delay={i * 0.08} index={i}>
              <div className="relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-7">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl"
                  style={{ background: "var(--gold-glow)" }}
                />
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--gold-line)] bg-[var(--gold-glow)] text-[var(--gold)]">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="heading-sm">{t.title}</p>
                  <p className="body mt-2">{t.desc}</p>
                </div>
                <span className="chip chip-gold mt-auto w-fit">Coming soon</span>
              </div>
            </CardReveal>
          )
        })}
      </div>
    </FadeUp>
  )
}
