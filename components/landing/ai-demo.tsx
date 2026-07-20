"use client"

import { motion } from "motion/react"
import { MessageSquare, TrendingUp } from "lucide-react"
import { FadeUp } from "@/components/reveal"

const TURNS = [
  { role: "user", text: "Analyze NVDA into earnings — should I hold?" },
  { role: "ai", text: "NVDA shows momentum into earnings: RSI 64 (healthy), MACD bullish cross, support at $118. Confidence 78%. Risk/reward favors holding with a trailing stop at $112." },
]

export function AiDemo() {
  return (
    <FadeUp>
      <div className="mx-auto max-w-3xl">
        <p className="subheading text-center">Live AI demo</p>
        <h2 className="title mt-3 text-center">Ask. Understand. Act.</h2>
        <div className="glass mt-8 overflow-hidden rounded-3xl p-6">
          <div className="flex items-center gap-2 border-b border-[var(--line)] pb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--gold-glow)] text-[var(--gold)]">
              <MessageSquare className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium">Lumora AI</span>
            <span className="chip chip-gold ml-auto">Grounded in live data</span>
          </div>
          <div className="space-y-4 py-5">
            {TURNS.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.5 }} className={`flex gap-3 ${t.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${t.role === "user" ? "bg-[var(--gold-glow)] text-[var(--gold)]" : "bg-[var(--panel-2)] text-[var(--text-tertiary)]"}`}>
                  {t.role === "user" ? <MessageSquare className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                </div>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${t.role === "user" ? "bg-[var(--gold-glow)]" : "bg-[var(--panel-2)]"}`} style={{ color: "var(--text-primary)" }}>
                  {t.text}
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--panel-2)] px-4 py-3">
            <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>Ask Lumora anything…</span>
            <span className="ml-auto chip">Try it free</span>
          </div>
        </div>
      </div>
    </FadeUp>
  )
}
