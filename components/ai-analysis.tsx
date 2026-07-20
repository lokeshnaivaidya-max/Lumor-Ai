"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { authClient, useSession } from "@/lib/auth-client";
import { logActivity } from "@/app/actions/activity";
import type { Indicators } from "@/lib/indicators"
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
  LogIn,
  Ban,
  Clock,
  CheckCircle2,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  ChevronDown,
  RefreshCw,
  Sparkles,
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
  probabilityReason: string
  bestTimeframe: string
  suitableFor: string[]
  scenarioBest: string
  scenarioLikely: string
  scenarioWorst: string
  maxDownside: string
  expectedUpside: string
  riskRewardNote: string
  positionVerySafe: string
  positionModerate: string
  positionAggressive: string
  positionNote: string
  bestHoldingTime: string
  holdingReason: string
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

type StreamEvent =
  | { type: "started"; symbol: string }
  | { type: "loading"; message: string }
  | { type: "complete"; analysis: Analysis; meta: unknown }
  | { type: "error"; message: string; disclaimer?: string }

function recTone(rec: Recommendation): { text: string; bg: string; border: string; ring: string } {
  switch (rec) {
    case "Strong Buy":
    case "Buy":
      return { text: "text-pos", bg: "bg-pos/12", border: "border-pos/40", ring: "oklch(0.62 0.16 168)" }
    case "Sell":
    case "Strong Sell":
      return { text: "text-neg", bg: "bg-neg/12", border: "border-neg/40", ring: "oklch(0.58 0.18 22)" }
    default:
      return { text: "text-gold", bg: "bg-gold/12", border: "border-gold/40", ring: "oklch(0.75 0.12 75)" }
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

function SkeletonCard({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/10 ${className}`} />
}

function LoadingSkeleton() {
  return (
    <div className="mt-5 space-y-4 border-t border-white/10 pt-6">
      <div className="grid gap-5 md:grid-cols-[1fr_1.6fr]">
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} className="h-24" />
        ))}
      </div>
      <div className="flex gap-2">
        <SkeletonCard className="h-8 w-32" />
        <SkeletonCard className="h-8 w-32" />
        <SkeletonCard className="h-8 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-32" />
      </div>
    </div>
  )
}

export function AiAnalysis({
  symbol,
  triggerRef,
  indicators,
}: {
  symbol: string
  triggerRef?: React.MutableRefObject<(() => void) | null>
  indicators?: Indicators | null
}) {
  const [data, setData] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [horizon, setHorizon] = useState<string>("swing")
  const [error, setError] = useState<string | null>(null)
  const [progressMsg, setProgressMsg] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const doStream = useCallback(async (sym: string, hz: string, attempt = 0) => {
    setLoading(true)
    setError(null)
    setData(null)
    setProgressMsg("Initializing…")

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // Watchdog: if the server sends no progress within the budget, free the UI
    // instead of leaving the user stuck on "Analyzing…" forever.
    const watchdog = setTimeout(() => {
      try {
        controller.abort()
      } catch {}
      setError("Analysis is taking too long. Please try again.")
      setProgressMsg("")
      setLoading(false)
    }, 35_000)

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ symbol: sym, horizon: hz }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const event: StreamEvent = JSON.parse(line.slice(6))
            if (event.type === "started") {
              setProgressMsg(`Analyzing ${event.symbol}…`)
            } else if (event.type === "loading") {
              setProgressMsg(event.message)
            } else if (event.type === "complete") {
              clearTimeout(watchdog)
              setData(event.analysis)
              setProgressMsg("")
              setLoading(false)
              setRetryCount(0)
              logActivity({ type: "analysis", title: `Analyzed ${symbol}`, ticker: symbol, href: `/markets?symbol=${symbol}` }).catch(() => {})
              return
            } else if (event.type === "error") {
              clearTimeout(watchdog)
              setError(event.message)
              setProgressMsg("")
              setLoading(false)
              return
            }
          } catch {
            continue
          }
        }
      }
      clearTimeout(watchdog)
      setLoading(false)
    } catch (err: unknown) {
      clearTimeout(watchdog)
      if (err instanceof Error && err.name === "AbortError") return
      const msg = err instanceof Error ? err.message : "Analysis failed. Retrying…"
      if (attempt < 2) {
        setProgressMsg(`Retrying… (${attempt + 1}/3)`)
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        return doStream(sym, hz, attempt + 1)
      }
      setError(msg)
      setLoading(false)
      setProgressMsg("")
    }
  }, [])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const run = useCallback(() => {
    doStream(symbol, horizon)
  }, [doStream, symbol, horizon])

  useEffect(() => {
    if (triggerRef) triggerRef.current = run
    return () => {
      if (triggerRef) triggerRef.current = null
    }
  }, [triggerRef, run])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setLoading(false)
    setProgressMsg("")
  }, [])

  const { data: session } = useSession()

  if (!session?.user) {
    return (
      <div className="relative overflow-hidden p-6 sm:p-8 text-center">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue/[0.02] to-violet/[0.02]" />
        <div className="relative mx-auto max-w-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[28px] bg-gradient-to-br from-blue/10 to-violet/10 border border-white/20">
            <LineChart className="h-8 w-8 text-blue" />
          </div>
          <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">Sign in to analyze</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Lumora AI analysis is available for authenticated users. Sign in to get AI-powered insights.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/sign-in"
              className="glass-btn glass-btn-primary rounded-full px-6 py-2.5 text-sm"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="glass-btn glass-btn-ghost rounded-full px-6 py-2.5 text-sm"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden p-5 sm:p-6">
      <div
        className="animate-pulse-glow pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-[80px]"
        style={{ background: "oklch(0.55 0.18 255 / 0.15)" }}
      />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue/20 to-violet/20 border border-white/20 text-blue">
            <LineChart className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-heading text-sm font-medium text-foreground">Lumora AI Analysis</h3>
            <p className="text-xs text-muted-foreground">Explained simply · grounded in live data</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-white/20 bg-white/10 backdrop-blur-sm p-0.5">
            {HORIZONS.map((h) => (
              <button
                key={h.id}
                onClick={() => setHorizon(h.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300 ${
                  horizon === h.id
                    ? "bg-blue text-white shadow-[0_0_14px_2px_rgba(91,141,255,0.55)] ring-2 ring-blue/60"
                    : "text-muted-foreground hover:text-foreground"
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
            className="group relative flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-gold via-amber-400 to-gold px-5 py-2 text-xs font-bold text-black shadow-[0_0_20px_rgba(212,175,55,0.45)] transition-all duration-300 hover:shadow-[0_0_28px_rgba(212,175,55,0.65)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="absolute inset-0 -translate-x-full bg-white/25 transition-transform duration-700 group-hover:translate-x-full" />
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? "Analyzing…" : "Analyze with AI"}
          </motion.button>
          {loading && (
            <button
              onClick={cancel}
              className="glass-btn glass-btn-ghost rounded-full px-3 py-1.5 text-xs"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="relative mt-5 border-t border-white/10 pt-5">
          <div className="flex items-start gap-3 rounded-[28px] border border-gold/30 bg-gold/[0.07] p-4 backdrop-blur-sm">
            <div className="flex-1 text-sm text-foreground/90">{error}</div>
            <button
              onClick={run}
              className="glass-btn glass-btn-soft shrink-0 rounded-full px-3 py-1 text-xs"
            >
              <RefreshCw className="mr-1 h-3 w-3" /> Retry
            </button>
          </div>
        </div>
      )}

      {loading && !data && (
        <div className="relative mt-5 border-t border-white/10 pt-5">
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <div className="flex h-6 w-6 items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <LineChart className="h-4 w-4 text-blue" />
              </motion.div>
            </div>
            {progressMsg || "Reading the tape…"}
          </div>
          <LoadingSkeleton />
        </div>
      )}

      {data && <Report data={data} indicators={indicators} />}

      {!data && !loading && !error && (
        <p className="relative mt-4 text-sm text-muted-foreground">
          Get a simple, honest breakdown of {symbol} — what to do, why, and what could go wrong, explained in plain
          language anyone can understand.
        </p>
      )}
    </div>
  )
}

function Report({ data, indicators }: { data: Analysis; indicators?: Indicators | null }) {
  const rec = recTone(data.recommendation)
  const conf = Math.max(0, Math.min(100, Math.round(data.confidenceScore)))
  const profit = Math.max(0, Math.min(100, Math.round(data.probabilityOfProfit)))
  const loss = Math.max(0, Math.min(100, Math.round(data.probabilityOfLoss)))
  const risk = riskTone(data.riskLevel)

  const indicatorBullets = buildIndicatorReasons(indicators)

  return (
    <div className="relative mt-5 space-y-6 border-t border-white/10 pt-6">
      <div className="grid gap-5 md:grid-cols-[1fr_1.6fr]">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.1 }}
          className="relative flex flex-col items-center justify-center gap-3 rounded-[32px] border border-white/20 bg-white/10 backdrop-blur-xl p-6"
        >
          <div
            className="pointer-events-none absolute -top-10 -left-10 h-32 w-32 rounded-full blur-[60px]"
            style={{ background: rec.ring.replace(")", " / 0.18)") }}
          />
          <span className="relative text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">AI Verdict</span>
          <div className={`relative flex items-center gap-2.5 text-2xl font-semibold ${rec.text}`}>
            <RecIcon rec={data.recommendation} />
            {data.recommendation}
          </div>
          <div className="relative flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldAlert className={`h-4 w-4 ${risk.text}`} />
            <span className={`font-semibold ${risk.text}`}>{data.riskLevel}</span>
            <span>risk</span>
          </div>
          <div className="relative mt-1 h-2 w-full max-w-[180px] overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${risk.pct}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
              className={`h-full rounded-full ${risk.bar}`}
            />
          </div>
          <div className="relative mt-2 flex flex-col items-center">
            <ConfidenceMeter value={conf} color={rec.ring} size="lg" />
            <p className="mt-1 text-center text-xs leading-relaxed text-muted-foreground">{data.confidenceNote}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 16, delay: 0.2 }}
          className={`relative overflow-hidden rounded-[32px] border-2 ${rec.border} ${rec.bg} p-5`}
        >
          <div
            className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full blur-[60px]"
            style={{ background: rec.ring.replace(")", " / 0.2)") }}
          />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
               Why this call
            </span>
            <p className="mt-3 text-sm leading-relaxed text-foreground/85">{data.recommendationReason}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <CockpitMetric icon={<LogIn />} label="Entry" value={data.entry} accent="blue" />
              <CockpitMetric icon={<ArrowUpRight />} label="Target" value={data.target} accent="emerald" />
              <CockpitMetric icon={<Ban />} label="Stop Loss" value={data.stopLoss} accent="rose" />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <CockpitMetric icon={<Clock />} label="Hold" value={data.holdingPeriod} accent="violet" />
              <CockpitMetric icon={<ArrowUpRight />} label="R:R" value={data.riskReward} accent="gold" />
              <CockpitMetric icon={<Clock />} label="Timeframe" value={data.bestTimeframe} accent="cyan" />
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-[32px] border border-white/20 bg-white/10 backdrop-blur-xl p-5"
      >
        <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-emerald">
          <CheckCircle2 className="h-3.5 w-3.5" /> Key Reasons
        </h4>
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {(data.whyBuy ?? []).slice(0, 4).map((p, i) => (
            <div key={`b-${i}`} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/85">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald" />
              {p}
            </div>
          ))}
        </div>
        {indicatorBullets.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">From the charts</p>
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {indicatorBullets.map((b, i) => (
                <div key={`i-${i}`} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/80">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${b.tone}`} />
                  {b.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="rounded-[32px] border border-rose/30 bg-rose/[0.05] p-5"
      >
        <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-rose">
          <ShieldAlert className="h-3.5 w-3.5" /> Risks &amp; What Could Go Wrong
        </h4>
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {(data.whatCouldGoWrong ?? []).slice(0, 4).map((p, i) => (
            <div key={`r-${i}`} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/85">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose" />
              {p}
            </div>
          ))}
        </div>
        {data.biggestRisk && (
          <p className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs leading-relaxed text-foreground/80">
            <span className="font-semibold text-rose">Biggest risk:</span> {data.biggestRisk}
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-[32px] border border-gold/30 bg-gold/[0.06] p-5 backdrop-blur-sm"
      >
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-gold">
          <UserCheck className="h-3.5 w-3.5" /> Summary
        </h4>
        <p className="text-sm leading-relaxed text-foreground/90">{data.beginnerExplanation}</p>
        {data.ownMoneyView && (
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">{data.ownMoneyView}</p>
        )}
        {data.aiVerdict && (
          <p className="mt-2 text-sm font-medium leading-relaxed text-foreground/90">{data.aiVerdict}</p>
        )}
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55 }}
      >
        <Section title="Probability" icon={<LineChart className="h-3.5 w-3.5 text-blue" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <ProbBar label="Chance of Profit" value={profit} tone="pos" icon={<ArrowUpRight className="h-4 w-4 text-pos" />} />
            <ProbBar label="Chance of Loss" value={loss} tone="neg" icon={<ArrowDownRight className="h-4 w-4 text-neg" />} />
          </div>
          {data.probabilityReason && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{data.probabilityReason}</p>
          )}
        </Section>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Section title="Scenarios" icon={<LineChart className="h-3.5 w-3.5 text-blue" />}>
          <div className="grid gap-3 sm:grid-cols-3">
            <ScenarioCard label="Best Case" tone="pos" value={data.scenarioBest} />
            <ScenarioCard label="Most Likely" tone="mid" value={data.scenarioLikely} />
            <ScenarioCard label="Worst Case" tone="neg" value={data.scenarioWorst} />
          </div>
        </Section>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="grid gap-3 sm:grid-cols-2"
      >
        <TimelineLevel
          icon={<TrendingUp className="h-4 w-4" />}
          label="Support"
          value={data.support}
          note={data.supportNote}
          accent="emerald"
          side="bottom"
        />
        <TimelineLevel
          icon={<TrendingDown className="h-4 w-4" />}
          label="Resistance"
          value={data.resistance}
          note={data.resistanceNote}
          accent="rose"
          side="top"
        />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <details className="group rounded-[28px] border border-white/20 bg-white/10 backdrop-blur-xl p-4">
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
      </motion.div>

      {data.quickSummary?.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.75 }}
          className="flex flex-wrap gap-2"
        >
          {data.quickSummary.slice(0, 3).map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs leading-relaxed text-foreground/80 backdrop-blur-sm">
              <CheckCircle2 className="h-3 w-3 shrink-0 text-blue" />
              {s}
            </span>
          ))}
        </motion.div>
      )}

      <p className="pt-1 text-[11px] italic text-muted-foreground/70">{data.disclaimer}</p>
    </div>
  )
}

function buildIndicatorReasons(ind: Indicators | null | undefined): { label: string; tone: string }[] {
  if (!ind) return []
  const out: { label: string; tone: string }[] = []

  if (ind.rsi != null) {
    const rsi = ind.rsi!
    const tag = rsi >= 70 ? "overbought" : rsi <= 30 ? "oversold" : "neutral"
    const tone = rsi >= 70 ? "bg-rose" : rsi <= 30 ? "bg-emerald" : "bg-gold"
    out.push({ label: `RSI ${rsi.toFixed(0)} (${tag})`, tone })
  }
  if (ind.macd) {
    const m = ind.macd!
    const bull = m.histogram >= 0
    out.push({ label: `MACD ${bull ? "bullish" : "bearish"} crossover`, tone: bull ? "bg-emerald" : "bg-rose" })
  }
  if (ind.ema20 != null && ind.ema50 != null) {
    const bull = ind.ema20! > ind.ema50!
    out.push({ label: `EMA 20 ${bull ? "above" : "below"} EMA 50`, tone: bull ? "bg-emerald" : "bg-rose" })
  }
  if (ind.vwap != null) {
    out.push({ label: "Price vs VWAP momentum", tone: "bg-blue" })
  }
  if (ind.trend) {
    const tone = ind.trend === "bullish" ? "bg-emerald" : ind.trend === "bearish" ? "bg-rose" : "bg-gold"
    out.push({ label: `Trend ${ind.trend} (${ind.trendStrength})`, tone })
  }
  return out
}

function ConfidenceMeter({ value, color, size = "sm" }: { value: number; color: string; size?: "sm" | "lg" }) {
  const dimensions = size === "lg" ? { size: 140, r: 52, strokeW: 8, fontSize: "text-xl" } : { size: 68, r: 26, strokeW: 6, fontSize: "text-sm" }
  const { size: sz, r, strokeW, fontSize } = dimensions
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <motion.div
      initial={{ rotate: -90, scale: 0 }}
      animate={{ rotate: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.15 }}
      className="relative shrink-0"
      style={{ width: sz, height: sz }}
    >
      <svg viewBox={`0 0 ${sz} ${sz}`} className="h-full w-full -rotate-90">
        <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke="oklch(0.9 0 0 / 0.08)" strokeWidth={strokeW} />
        <motion.circle
          cx={sz / 2}
          cy={sz / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className={`font-mono font-semibold text-foreground ${fontSize}`}
        >
          {value}%
        </motion.span>
      </div>
    </motion.div>
  )
}

function ProbBar({ label, value, tone, icon }: { label: string; value: number; tone: "pos" | "neg"; icon: React.ReactNode }) {
  const bar = tone === "pos" ? "bg-pos" : "bg-neg"
  const text = tone === "pos" ? "text-pos" : "text-neg"
  return (
    <div className="rounded-[28px] border border-white/20 bg-white/10 backdrop-blur-xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className={`text-sm font-semibold ${text}`}>{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${value}%`, transition: "width 0.8s ease" }} />
      </div>
    </div>
  )
}

function CockpitMetric({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: "blue" | "emerald" | "rose" | "violet" | "gold" | "cyan" }) {
  const dotMap = { blue: "bg-blue", emerald: "bg-emerald", rose: "bg-rose", violet: "bg-violet", gold: "bg-gold", cyan: "bg-cyan" }
  return (
    <motion.div whileHover={{ y: -3 }} className="flex flex-col items-center justify-center gap-1 rounded-[28px] border border-white/20 bg-white/10 backdrop-blur-xl p-3 text-center transition-all duration-300 hover:border-white/30">
      <span className="text-muted-foreground/70">{icon}</span>
      <span className="font-mono text-sm font-semibold text-foreground tabular-nums">{value}</span>
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        <span className={`inline-block h-1 w-1 rounded-full ${dotMap[accent]}`} />
        {label}
      </span>
    </motion.div>
  )
}

function ExpandableCase({ title, tone, points }: { title: string; tone: "pos" | "neg"; points: string[] }) {
  const [open, setOpen] = useState(false)
  const color = tone === "pos" ? "text-pos border-emerald/30 bg-emerald/[0.04]" : "text-neg border-rose/30 bg-rose/[0.04]"
  const dot = tone === "pos" ? "bg-pos" : "bg-neg"
  const icon = tone === "pos" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
  return (
    <motion.div layout className={`rounded-[28px] border ${color} p-4 cursor-pointer backdrop-blur-sm`} onClick={() => setOpen(!open)}>
      <div className="flex items-center justify-between">
        <h4 className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${tone === "pos" ? "text-pos" : "text-neg"}`}>
          {icon}{title}
        </h4>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-muted-foreground">
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="mt-3 space-y-1.5 overflow-hidden"
          >
            {points?.slice(0, 5).map((p, i) => (
              <motion.li
                key={i}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-2 text-sm leading-relaxed text-foreground/80"
              >
                <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${dot}`} />
                {p}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      {!open && points?.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground/70">{points.length} points — tap to expand</p>
      )}
    </motion.div>
  )
}

function TimelineLevel({ icon, label, value, note, accent, side }: { icon: React.ReactNode; label: string; value: string; note: string; accent: "emerald" | "rose"; side: "top" | "bottom" }) {
  const barColor = accent === "emerald" ? "bg-emerald/30" : "bg-rose/30"
  return (
    <motion.div whileHover={{ scale: 1.01 }} className="relative overflow-hidden rounded-[28px] border border-white/20 bg-white/10 backdrop-blur-xl p-4">
      <div className={`absolute left-0 right-0 h-1 ${side === "top" ? "top-0" : "bottom-0"} ${barColor}`} />
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
          {icon}{label}
        </span>
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.6 }}
          className="font-mono text-sm font-semibold text-foreground tabular-nums"
        >
          {value}
        </motion.span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground/75">{note}</p>
    </motion.div>
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

function ScenarioCard({ label, value, tone }: { label: string; value: string; tone: "pos" | "mid" | "neg" }) {
  const box = tone === "pos" ? "border-emerald/30 bg-emerald/[0.06]" : tone === "neg" ? "border-rose/30 bg-rose/[0.06]" : "border-gold/30 bg-gold/[0.06]"
  const text = tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : "text-gold"
  return (
    <div className={`rounded-[28px] border ${box} p-4 backdrop-blur-sm`}>
      <div className={`mb-1.5 text-xs font-semibold uppercase tracking-wide ${text}`}>{label}</div>
      <p className="text-sm leading-relaxed text-foreground/85">{value}</p>
    </div>
  )
}
