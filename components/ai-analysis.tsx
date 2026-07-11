"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Sparkles, Loader2, TrendingUp, TrendingDown, Minus, ShieldAlert, Target } from "lucide-react"

const HORIZONS = [
  { id: "day", label: "Day" },
  { id: "swing", label: "Swing" },
  { id: "position", label: "Position" },
] as const

type Bias = "Bullish" | "Bearish" | "Neutral"
type SentimentLabel = "Positive" | "Negative" | "Neutral"
type RiskLevel = "Low" | "Medium" | "High"

type Analysis = {
  executiveSummary: string
  bullCase: string[]
  bearCase: string[]
  technicalAnalysis: string
  fundamentalAnalysis: string
  riskAnalysis: string
  support: string
  resistance: string
  swingView: string
  longTermView: string
  sentiment: SentimentLabel
  bias: Bias
  riskLevel: RiskLevel
  confidenceScore: number
  disclaimer: string
}

function biasTone(bias: Bias) {
  if (bias === "Bullish") return "text-pos"
  if (bias === "Bearish") return "text-neg"
  return "text-muted-foreground"
}

function BiasIcon({ bias }: { bias: Bias }) {
  if (bias === "Bullish") return <TrendingUp className="h-4 w-4" />
  if (bias === "Bearish") return <TrendingDown className="h-4 w-4" />
  return <Minus className="h-4 w-4" />
}

export function AiAnalysis({ symbol }: { symbol: string }) {
  const [data, setData] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [horizon, setHorizon] = useState<string>("swing")
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, horizon }),
      })
      const json = await res.json()
      if (json.error) {
        setError(json.error)
      } else {
        setData(json.analysis as Analysis)
      }
    } catch {
      setError("Analysis failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="edge-light grain relative overflow-hidden rounded-[1.75rem] glass-panel p-5 sm:p-6">
      <div
        className="animate-pulse-glow pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-[80px]"
        style={{ background: "oklch(0.62 0.16 168 / 0.4)" }}
      />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary/25 to-accent/25 text-accent">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-medium text-foreground">Lumora AI Analysis</h3>
            <p className="text-xs text-muted-foreground">Powered by Gemini · grounded in live data</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-border bg-black/30 p-0.5">
            {HORIZONS.map((h) => (
              <button
                key={h.id}
                onClick={() => setHorizon(h.id)}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  horizon === h.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.04 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            onClick={run}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? "Analyzing…" : "Analyze"}
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="relative mt-5 border-t border-border/60 pt-5">
          <p className="text-sm text-neg">{error}</p>
        </div>
      )}

      {loading && !data && (
        <div className="relative mt-5 flex items-center gap-2 border-t border-border/60 pt-5 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          Reading the tape…
        </div>
      )}

      {data && (
        <div className="relative mt-5 space-y-5 border-t border-border/60 pt-5">
          {/* Verdict strip */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`flex items-center gap-1.5 rounded-full border border-border bg-black/20 px-3 py-1 text-sm font-medium ${biasTone(data.bias)}`}>
              <BiasIcon bias={data.bias} /> {data.bias}
            </span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted/40">
                <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(0, Math.min(100, data.confidenceScore))}%` }} />
              </div>
              <span className="font-mono text-xs text-muted-foreground">{data.confidenceScore}% confidence</span>
            </div>
            <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
              Sentiment: {data.sentiment}
            </span>
            <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
              Risk: {data.riskLevel}
            </span>
          </div>

          {/* Executive summary */}
          <Section title="Executive Summary">
            <p className="text-sm leading-relaxed text-foreground/90">{data.executiveSummary}</p>
          </Section>

          {/* Bull / bear */}
          <div className="grid gap-4 sm:grid-cols-2">
            <CaseCard title="Bull Case" tone="pos" points={data.bullCase} />
            <CaseCard title="Bear Case" tone="neg" points={data.bearCase} />
          </div>

          {/* Key levels */}
          <div className="grid gap-3 sm:grid-cols-2">
            <LevelCard icon={<Target className="h-4 w-4 text-pos" />} label="Support" value={data.support} />
            <LevelCard icon={<Target className="h-4 w-4 text-neg" />} label="Resistance" value={data.resistance} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Section title="Technical Analysis">
              <p className="text-sm leading-relaxed text-foreground/80">{data.technicalAnalysis}</p>
            </Section>
            <Section title="Fundamental Analysis">
              <p className="text-sm leading-relaxed text-foreground/80">{data.fundamentalAnalysis}</p>
            </Section>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Section title="Swing View">
              <p className="text-sm leading-relaxed text-foreground/80">{data.swingView}</p>
            </Section>
            <Section title="Long-Term View">
              <p className="text-sm leading-relaxed text-foreground/80">{data.longTermView}</p>
            </Section>
          </div>

          <Section title="Risk Analysis" icon={<ShieldAlert className="h-3.5 w-3.5 text-neg" />}>
            <p className="text-sm leading-relaxed text-foreground/80">{data.riskAnalysis}</p>
          </Section>

          <p className="pt-1 text-[11px] italic text-muted-foreground/70">{data.disclaimer}</p>
        </div>
      )}

      {!data && !loading && !error && (
        <p className="relative mt-4 text-sm text-muted-foreground">
          Generate an institutional-grade breakdown of {symbol} — trend regime, key levels, and bull/bear scenarios.
        </p>
      )}
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
        {icon}
        {title}
      </h4>
      {children}
    </div>
  )
}

function CaseCard({ title, tone, points }: { title: string; tone: "pos" | "neg"; points: string[] }) {
  const color = tone === "pos" ? "text-pos" : "text-neg"
  const dot = tone === "pos" ? "bg-pos" : "bg-neg"
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4">
      <h4 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${color}`}>{title}</h4>
      <ul className="space-y-1.5">
        {points?.map((p, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/80">
            <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${dot}`} />
            {p}
          </li>
        ))}
      </ul>
    </div>
  )
}

function LevelCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-sm leading-relaxed text-foreground/90">{value}</p>
    </div>
  )
}
