"use client"

import { motion } from "motion/react"
import { FadeUp, CardReveal } from "@/components/reveal"

const TESTIMONIALS = [
  { quote: "Lumora replaced three terminal subscriptions. The AI explanations actually teach me why a signal fired.", name: "Aarav M.", role: "Independent trader" },
  { quote: "Finally a tool that respects my time. Clean, fast, and the confidence scores are honest.", name: "Sofia R.", role: "Portfolio manager" },
  { quote: "The trade planner's risk/reward view is the clearest I've seen outside a Bloomberg terminal.", name: "Kenji T.", role: "Quant analyst" },
]

export function Testimonials() {
  return (
    <FadeUp>
      <p className="subheading text-center">Trusted by operators</p>
      <h2 className="title mt-3 text-center">Quietly loved by serious desks</h2>
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <CardReveal key={t.name} delay={i * 0.08} index={i}>
            <div className="flex h-full flex-col gap-4 rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-7">
              <span className="font-serif text-3xl leading-none" style={{ color: "var(--gold)" }}>&ldquo;</span>
              <p className="body flex-1">{t.quote}</p>
              <div className="mt-2">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t.name}</p>
                <p className="meta mt-0.5">{t.role}</p>
              </div>
            </div>
          </CardReveal>
        ))}
      </div>
    </FadeUp>
  )
}
