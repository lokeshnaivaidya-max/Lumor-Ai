"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  Sparkles,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
  ShieldCheck,
  Target,
  LogIn,
  Ban,
  Clock,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Heart,
  LineChart,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  CalendarClock,
  HelpCircle,
  Wallet,
  ListChecks,
  UserCheck,
  Flag,
} from "lucide-react"

const HORIZONS = [
  { id: "day", label: "Day" },
  { id: "swing", label: "Swing" },
  { id: "position", label: "Position" },
] as const

type Bias = "Bullish" | "Bearish" | "Neutral"
type RiskLevel = "Low" | "Medium" | "High"
type Recommendation = "Strong Buy" | "Buy" | "Hold" | "Wait" | "Sell" | "Strong Sell"

type Analysis = {
  recommendation: Recommendation
  recommendationReason: string
  confidenceScore: number
  confidenceNote: string
  quickSummary: string[]
  entry: string
  target: string
  stopLoss: string
  holdingPeriod: string
  riskReward: string
  probabilityOfProfit: number
  probabilityOfLoss: number
  bestTimeframe: string
  suitableFor: string[]
  whyBuy: string[]
  whatCouldGoWrong: string[]
  support: string
  supportNote: string
  resistance: string
  resistanceNote: string
  riskLevel: RiskLevel
  riskNote: string
  marketMood: Bias
  marketMoodNote: string
  beginnerExplanation: string
  isGoodToday: string
  biggestRisk: string
  safestWay: string
  waitOrBuyNow: string
  smallBudgetPlan: string
  largeBudgetPlan: string
  actionToday: string
  actionNext3Days: string
  actionNextWeek: string
  ownMoneyView: string
  proInvestorView: string
  aiVerdict: string
  disclaimer: string
}

/* ---- recommendation styling ---- */
function recTone(rec: Recommendation): { text: string; bg: string; border: string; ring: string } {
  switch (rec) {
    case "Strong Buy":
    case "Buy":
      return { text: "text-pos", bg: "bg-pos/12", border: "border-pos/40", ring: "oklch(0.8 0.13 168)" }
    case "Sell":
    case "Strong Sell":
      return { text: "text-neg", bg: "bg-neg/12", border: "border-neg/40", ring: "oklch(0.68 0.19 22)" }
    default:
      return { text: "text-gold", bg: "bg-gold/12", border: "border-gold/40", ring: "oklch(0.87 0.08 88)" }
  }
}

function RecIcon({ rec }: { rec: Recommendation }) {
  if (rec === "Strong Buy" || rec === "Buy") return <TrendingUp className="h-5 w-5" />
  if (rec === "Sell" || rec === "Strong Sell") return <TrendingDown className="h-5 w-5" />
  return <Minus className="h-5 w-5" />
}

function moodTone(bias: Bias) {
  if (bias === "Bullish") return "text-pos"
  if (bias === "Bearish") return "text-neg"
  return "text-muted-foreground"
}

function MoodIcon({ bias }: { bias: Bias }) {
  if (bias === "Bullish") return <TrendingUp className="h-4 w-4" />
  if (bias === "Bearish") return <TrendingDown className="h-4 w-4" />
  return <Minus className="h-4 w-4" />
}

function riskTone(level: RiskLevel) {
  if (level === "Low") return { text: "text-pos", bar: "bg-pos", pct: 33 }
  if (level === "High") return { text: "text-neg", bar: "bg-neg", pct: 100 }
  return { text: "text-gold", bar: "bg-gold", pct: 66 }
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
            <p className="text-xs text-muted-foreground">Explained simply · grounded in live data</p>
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

      {data && <Report data={data} />}

      {!data && !loading && !error && (
        <p className="relative mt-4 text-sm text-muted-foreground">
          Get a simple, honest breakdown of {symbol} — what to do, why, and what could go wrong, explained in plain
          language anyone can understand.
        </p>
      )}
    </div>
  )
}

function Report({ data }: { data: Analysis }) {
  const rec = recTone(data.recommendation)
  const conf = Math.max(0, Math.min(100, Math.round(data.confidenceScore)))
  const profit = Math.max(0, Math.min(100, Math.round(data.probabilityOfProfit)))
  const loss = Math.max(0, Math.min(100, Math.round(data.probabilityOfLoss)))
  const risk = riskTone(data.riskLevel)

  return (
    <div className="relative mt-5 space-y-6 border-t border-border/60 pt-6">
      {/* 1 + 2 — Recommendation + Confidence */}
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className={`rounded-2xl border ${rec.border} ${rec.bg} p-5`}>
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Final Recommendation
          </div>
          <div className={`mt-2 flex items-center gap-2.5 text-2xl font-semibold ${rec.text}`}>
            <RecIcon rec={data.recommendation} />
            {data.recommendation}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">{data.recommendationReason}</p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/40 p-5">
          <ConfidenceMeter value={conf} color={rec.ring} />
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Confidence</div>
            <div className="text-lg font-semibold text-foreground">{conf}%</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{data.confidenceNote}</p>
          </div>
        </div>
      </div>

      {/* 3 — Quick summary */}
      {data.quickSummary?.length > 0 && (
        <Section title="Quick Summary">
          <ul className="grid gap-2 sm:grid-cols-3">
            {data.quickSummary.slice(0, 3).map((s, i) => (
              <li key={i} className="flex gap-2 rounded-xl border border-border bg-card/30 p-3 text-sm leading-relaxed text-foreground/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {s}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 4 — If you buy today */}
      <Section title="If You Buy Today" icon={<Target className="h-3.5 w-3.5 text-accent" />}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={<LogIn className="h-4 w-4 text-pos" />} label="Entry" value={data.entry} />
          <StatCard icon={<ArrowUpRight className="h-4 w-4 text-pos" />} label="Target" value={data.target} />
          <StatCard icon={<Ban className="h-4 w-4 text-neg" />} label="Stop Loss" value={data.stopLoss} />
          <StatCard icon={<Clock className="h-4 w-4 text-primary" />} label="Hold" value={data.holdingPeriod} />
          <StatCard icon={<Scale className="h-4 w-4 text-gold" />} label="Risk : Reward" value={data.riskReward} />
          <StatCard icon={<CalendarClock className="h-4 w-4 text-primary" />} label="Best Timeframe" value={data.bestTimeframe} />
        </div>
      </Section>

      {/* Probability of profit / loss */}
      <Section title="Chances" icon={<Gauge className="h-3.5 w-3.5 text-accent" />}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ProbBar label="Chance of Profit" value={profit} tone="pos" icon={<ArrowUpRight className="h-4 w-4 text-pos" />} />
          <ProbBar label="Chance of Loss" value={loss} tone="neg" icon={<ArrowDownRight className="h-4 w-4 text-neg" />} />
        </div>
      </Section>

      {/* 5 + 6 — Why buy / what could go wrong */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ListCard title="Why Buy?" tone="pos" icon={<CheckCircle2 className="h-4 w-4 text-pos" />} points={data.whyBuy} />
        <ListCard
          title="What Could Go Wrong?"
          tone="neg"
          icon={<AlertTriangle className="h-4 w-4 text-neg" />}
          points={data.whatCouldGoWrong}
        />
      </div>

      {/* 7 — Price levels */}
      <div className="grid gap-3 sm:grid-cols-2">
        <LevelCard icon={<TrendingUp className="h-4 w-4 text-pos" />} label="Support" value={data.support} note={data.supportNote} />
        <LevelCard icon={<TrendingDown className="h-4 w-4 text-neg" />} label="Resistance" value={data.resistance} note={data.resistanceNote} />
      </div>

      {/* 8 + 9 — Risk level + Market mood */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/40 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5" /> Risk Level
            </span>
            <span className={`text-sm font-semibold ${risk.text}`}>{data.riskLevel}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
            <div className={`h-full rounded-full ${risk.bar}`} style={{ width: `${risk.pct}%` }} />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">{data.riskNote}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card/40 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Market Mood</span>
            <span className={`flex items-center gap-1.5 text-sm font-semibold ${moodTone(data.marketMood)}`}>
              <MoodIcon bias={data.marketMood} /> {data.marketMood}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">{data.marketMoodNote}</p>
        </div>
      </div>

      {/* Suitable for */}
      {data.suitableFor?.length > 0 && (
        <Section title="Suitable For" icon={<Users className="h-3.5 w-3.5 text-accent" />}>
          <div className="flex flex-wrap gap-2">
            {data.suitableFor.map((s) => (
              <span
                key={s}
                className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground/90"
              >
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* 10 — Beginner explanation */}
      <div className="rounded-2xl border border-accent/30 bg-accent/[0.06] p-5">
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
          <Heart className="h-3.5 w-3.5" /> Explained Like I&apos;m Your Family
        </h4>
        <p className="text-sm leading-relaxed text-foreground/90">{data.beginnerExplanation}</p>
      </div>

      {/* Your questions answered */}
      <Section title="Your Questions, Answered" icon={<HelpCircle className="h-3.5 w-3.5 text-accent" />}>
        <div className="grid gap-3 sm:grid-cols-2">
          <QaCard q="Is this good to buy today?" a={data.isGoodToday} />
          <QaCard q="Should I wait or buy now?" a={data.waitOrBuyNow} />
          <QaCard q="What is the biggest risk?" a={data.biggestRisk} tone="warn" />
          <QaCard q="What is the safest way in?" a={data.safestWay} tone="safe" />
        </div>
      </Section>

      {/* Budget plans */}
      <Section title="What Should I Do With My Money?" icon={<Wallet className="h-3.5 w-3.5 text-accent" />}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card/40 p-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
              <Wallet className="h-3.5 w-3.5 text-pos" /> Small Budget
            </div>
            <p className="text-sm leading-relaxed text-foreground/85">{data.smallBudgetPlan}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card/40 p-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
              <Wallet className="h-3.5 w-3.5 text-primary" /> Larger Budget
            </div>
            <p className="text-sm leading-relaxed text-foreground/85">{data.largeBudgetPlan}</p>
          </div>
        </div>
      </Section>

      {/* Simple action plan */}
      <Section title="Simple Action Plan" icon={<ListChecks className="h-3.5 w-3.5 text-accent" />}>
        <div className="grid gap-3 sm:grid-cols-3">
          <StepCard step="Today" value={data.actionToday} />
          <StepCard step="Next 3 Days" value={data.actionNext3Days} />
          <StepCard step="Next Week" value={data.actionNextWeek} />
        </div>
      </Section>

      {/* Own money view */}
      <div className="flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/[0.07] p-5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold/20 text-gold">
          <UserCheck className="h-4 w-4" />
        </span>
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-gold">
            What Would I Do With My Own Money?
          </div>
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">{data.ownMoneyView}</p>
        </div>
      </div>

      {/* 11 — Pro investor view */}
      <details className="group rounded-2xl border border-border bg-card/40 p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <LineChart className="h-3.5 w-3.5" /> Pro Investor View
          </span>
          <span className="text-[10px] normal-case tracking-normal text-muted-foreground/70 group-open:hidden">
            Tap to expand · technical
          </span>
        </summary>
        <p className="mt-3 text-sm leading-relaxed text-foreground/75">{data.proInvestorView}</p>
      </details>

      {/* 12 — Final advice in one sentence */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/20 text-primary">
          <Flag className="h-4 w-4" />
        </span>
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-primary">Final Advice</div>
          <p className="mt-1 text-sm font-medium leading-relaxed text-foreground/90">{data.aiVerdict}</p>
        </div>
      </div>

      <p className="pt-1 text-[11px] italic text-muted-foreground/70">{data.disclaimer}</p>
    </div>
  )
}

function ConfidenceMeter({ value, color }: { value: number; color: string }) {
  const r = 26
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="relative h-[68px] w-[68px] shrink-0">
      <svg viewBox="0 0 68 68" className="h-full w-full -rotate-90">
        <circle cx="34" cy="34" r={r} fill="none" stroke="oklch(0.99 0 0 / 0.1)" strokeWidth="6" />
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-mono text-sm font-semibold text-foreground">{value}%</span>
      </div>
    </div>
  )
}

function ProbBar({
  label,
  value,
  tone,
  icon,
}: {
  label: string
  value: number
  tone: "pos" | "neg"
  icon: React.ReactNode
}) {
  const bar = tone === "pos" ? "bg-pos" : "bg-neg"
  const text = tone === "pos" ? "text-pos" : "text-neg"
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className={`text-sm font-semibold ${text}`}>{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${value}%`, transition: "width 0.8s ease" }} />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 font-mono text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
        {icon}
        {title}
      </h4>
      {children}
    </div>
  )
}

function ListCard({
  title,
  tone,
  icon,
  points,
}: {
  title: string
  tone: "pos" | "neg"
  icon: React.ReactNode
  points: string[]
}) {
  const color = tone === "pos" ? "text-pos" : "text-neg"
  const dot = tone === "pos" ? "bg-pos" : "bg-neg"
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4">
      <h4 className={`mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${color}`}>
        {icon}
        {title}
      </h4>
      <ul className="space-y-1.5">
        {points?.slice(0, 4).map((p, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/80">
            <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${dot}`} />
            {p}
          </li>
        ))}
      </ul>
    </div>
  )
}

function QaCard({ q, a, tone }: { q: string; a: string; tone?: "warn" | "safe" }) {
  const accent = tone === "warn" ? "text-neg" : tone === "safe" ? "text-pos" : "text-accent"
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4">
      <p className={`mb-1 text-xs font-semibold ${accent}`}>{q}</p>
      <p className="text-sm leading-relaxed text-foreground/85">{a}</p>
    </div>
  )
}

function StepCard({ step, value }: { step: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4">
      <div className="mb-1.5 inline-flex items-center rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
        {step}
      </div>
      <p className="text-sm leading-relaxed text-foreground/85">{value}</p>
    </div>
  )
}

function LevelCard({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode
  label: string
  value: string
  note: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4">
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-mono text-sm font-semibold text-foreground">{value}</span>
      </div>
      <p className="text-sm leading-relaxed text-foreground/75">{note}</p>
    </div>
  )
}
