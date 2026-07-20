"use client"

import { Search, LayoutDashboard, Lightbulb } from "lucide-react"

const STEPS = [
  {
    icon: Search,
    title: "Search any market",
    desc: "Type a ticker or company name. Lumora pulls live data from 60+ exchanges instantly.",
    color: "var(--info)",
  },
  {
    icon: LayoutDashboard,
    title: "Review the data",
    desc: "See prices, fundamentals, news — all unified in one clean dashboard.",
    color: "var(--gold)",
  },
  {
    icon: Lightbulb,
    title: "Understand the story",
    desc: "Lumora explains what the data means in plain language. No jargon, no noise.",
    color: "var(--pos)",
  },
]

export function HowItWorks() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <p className="subheading text-center">How it works</p>
      <h2 className="title mt-3 text-center">Three steps to clarity</h2>
      <p className="body mt-3 mx-auto text-center">
        From ticker to insight in seconds. No terminal experience needed.
      </p>

      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="bento-card relative flex flex-col p-7">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-semibold text-[var(--gold)]">0{i + 1}</span>
              <span className="h-px flex-1 ml-4" style={{ background: "linear-gradient(90deg, var(--gold-line), transparent)" }} />
            </div>
            <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "var(--bg-alt)", border: "1px solid var(--line)" }}>
              <step.icon className="h-5 w-5" style={{ color: step.color }} />
            </div>
            <h3 className="heading-sm mt-5">{step.title}</h3>
            <p className="body mt-2">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
