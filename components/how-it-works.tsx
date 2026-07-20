"use client"

import { Search, LayoutDashboard, Lightbulb } from "lucide-react"

const STEPS = [
  {
    icon: Search,
    title: "Search any market",
    desc: "Type a ticker or company name. Lumora pulls live data from 60+ exchanges instantly.",
    color: "#7a9ec4",
  },
  {
    icon: LayoutDashboard,
    title: "Review the data",
    desc: "See prices, fundamentals, news — all unified in one clean dashboard.",
    color: "#c4956a",
  },
  {
    icon: Lightbulb,
    title: "Understand the story",
    desc: "Lumora explains what the data means in plain language. No jargon, no noise.",
    color: "#4a9e7a",
  },
]

export function HowItWorks() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <p className="subheading text-center">How it works</p>
      <h2 className="title mt-3 text-center">Three steps to clarity</h2>
      <p className="body mt-3 text-center mx-auto">
        From ticker to insight in seconds. No terminal experience needed.
      </p>

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-6">
        {STEPS.map((step, i) => (
          <div key={step.title} className="glass-card relative flex flex-col items-center rounded-2xl p-8 text-center">
            {i < STEPS.length - 1 && (
              <div className="absolute left-[60%] top-8 hidden h-px w-[80%] md:block" style={{
                background: "linear-gradient(90deg, var(--gold-glow), transparent)",
              }} />
            )}

            <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{
              background: "rgba(196,149,106,0.08)",
              border: "1px solid rgba(196,149,106,0.12)",
            }}>
              <span className="text-[10px] font-semibold" style={{ color: "var(--gold)" }}>{i + 1}</span>
            </div>

            <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-xl" style={{
              background: `${step.color}10`,
              border: `1px solid ${step.color}15`,
            }}>
              <step.icon className="h-5 w-5" style={{ color: step.color }} />
            </div>

            <h3 className="heading-sm mt-4">{step.title}</h3>
            <p className="body mt-2 text-center">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
