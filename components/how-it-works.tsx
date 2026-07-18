"use client"

import { Search, BarChart3, Sparkles, ArrowRight } from "lucide-react"

const STEPS = [
  {
    icon: Search,
    title: "Search any market",
    desc: "Type a ticker or company name. Lumora pulls live data from 60+ global exchanges instantly.",
    color: "#5b8dff",
  },
  {
    icon: BarChart3,
    title: "Review the data",
    desc: "See prices, charts, fundamentals, and news — all unified in one clear dashboard.",
    color: "#3bce8e",
  },
  {
    icon: Sparkles,
    title: "Get AI insights",
    desc: "Lumora explains what the data means in plain language. No jargon, no noise.",
    color: "#d4a853",
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

      <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
        {STEPS.map((step, i) => (
          <div key={step.title} className="relative flex flex-col items-center text-center">
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className="absolute left-[60%] top-8 hidden h-px w-[80%] md:block" style={{
                background: "linear-gradient(90deg, rgba(212,168,83,0.15), transparent)",
              }} />
            )}

            {/* Step number */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{
              background: "rgba(212,168,83,0.08)",
              border: "1px solid rgba(212,168,83,0.15)",
            }}>
              <span className="text-[11px] font-semibold" style={{ color: "var(--gold)" }}>{i + 1}</span>
            </div>

            {/* Icon */}
            <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{
              background: `${step.color}10`,
              border: `1px solid ${step.color}15`,
            }}>
              <step.icon className="h-6 w-6" style={{ color: step.color }} />
            </div>

            <h3 className="heading--small mt-5">{step.title}</h3>
            <p className="body mt-2 text-center">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
