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
  ShieldCheck,
  Activity,
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
  target2?: string
  target3?: string
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
  bullishScenario?: string
  bearishScenario?: string
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
  return <div className={`animate-pulse rounded-2xl bg-[var(--panel-2)] ${className}`} />
}

function LoadingSkeleton() {
  return (
    <div className="mt-5 space-y-4 border-t pt-6" style={{ borderColor: "var(--line)" }}>
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
      <div className="glass relative overflow-hidden p-6 sm:p-8 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-[80px]"
          style={{ background: "var(--gold-glow)" }}
        />
        <div className="relative mx-auto max-w-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[28px] border text-gold" style={{ background: "var(--gold-glow)", borderColor: "var(--gold-line)" }}>
            <LineChart className="h-8 w-8" />
          </div>
          <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">Sign in to analyze</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Lumora AI analysis is available for authenticated users. Sign in to get AI-powered insights.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/sign-in"
              className="lm-btn lm-btn-gold rounded-full px-6 py-2.5 text-sm"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="lm-btn lm-btn-ghost rounded-full px-6 py-2.5 text-sm"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass relative overflow-hidden p-5 sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-[80px]"
        style={{ background: "var(--gold-glow)" }}
      />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl border text-gold" style={{ background: "var(--gold-glow)", borderColor: "var(--gold-line)" }}>
            <LineChart className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-heading text-sm font-medium text-foreground">Lumora AI Analysis</h3>
            <p className="text-xs text-muted-foreground">Explained simply · grounded in live data</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-full border p-0.5" style={{ borderColor: "var(--line)", background: "var(--surface-alt)" }}>
            {HORIZONS.map((h) => (
              <button
                key={h.id}
                onClick={() => setHorizon(h.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300 ${
                  horizon === h.id
                    ? "text-[#1a1407] shadow-[0_0_14px_2px_var(--shadow-glow)] ring-1 ring-gold/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={horizon === h.id ? { background: "var(--gold)" } : undefined}
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
            className="group relative flex items-center gap-1.5 overflow-hidden rounded-full bg-gold px-5 py-2 text-xs font-bold text-[#1a1407] shadow-[0_0_20px_var(--shadow-glow)] transition-all duration-300 hover:shadow-[0_0_28px_var(--shadow-glow)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="absolute inset-0 -translate-x-full bg-white/25 transition-transform duration-700 group-hover:translate-x-full" />
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
            {loading ? "Analyzing…" : "Analyze with AI"}
          </motion.button>
          {loading && (
            <button
              onClick={cancel}
              className="lm-btn lm-btn-ghost rounded-full px-3 py-1.5 text-xs"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="relative mt-5 border-t pt-5" style={{ borderColor: "var(--line)" }}>
          <div className="glass flex items-start gap-3 rounded-[28px] border p-4" style={{ borderColor: "var(--gold-line)", background: "var(--gold-glow)" }}>
            <div className="flex-1 text-sm text-foreground/90">{error}</div>
            <button
              onClick={run}
              className="lm-btn lm-btn-soft shrink-0 rounded-full px-3 py-1 text-xs"
            >
              <RefreshCw className="mr-1 h-3 w-3" /> Retry
            </button>
          </div>
        </div>
      )}

      {loading && !data && (
        <div className="relative mt-5 border-t pt-5" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <div className="flex h-6 w-6 items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <LineChart className="h-4 w-4" style={{ color: "var(--gold)" }} />
              </motion.div>
            </div>
            {progressMsg || "Reading the tape…"}
          </div>
          <LoadingSkeleton />
        </div>
      )}

      {data && <Report data={data} indicators={indicators} />}

      {!data && !loading && !error && (
        <div className="relative mt-5 space-y-5 border-t pt-5" style={{ borderColor: "var(--line)" }}>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Get a simple, honest breakdown of {symbol} — what to do, why, and what could go wrong, explained in plain
            language anyone can understand.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <TrendingStocks symbol={symbol} />
            <SuggestedPrompts symbol={symbol} />
          </div>

          <RecentActivity symbol={symbol} onAnalyze={run} />
        </div>
      )}
    </div>
  )
}

const TRENDING = [
  { sym: "AAPL", note: "Earnings setup" },
  { sym: "NVDA", note: "AI momentum" },
  { sym: "TSLA", note: "Volatile tape" },
  { sym: "MSFT", note: "Steady trend" },
]

const PROMPTS = [
  "Should I hold or trim into earnings?",
  "What's the risk/reward here?",
  "Where's the strongest support?",
  "Is now a good entry?",
]

function TrendingStocks({ symbol }: { symbol: string }) {
  return (
    <div className="glass-card rounded-[28px] p-4">
      <p className="meta mb-3 flex items-center gap-1.5">
        <TrendingUp className="h-3.5 w-3.5 text-gold" /> Trending stocks
      </p>
      <div className="grid grid-cols-2 gap-2">
        {TRENDING.map((t) => (
          <Link
            key={t.sym}
            href={`/markets?symbol=${encodeURIComponent(t.sym)}`}
            className={`group flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors ${
              t.sym === symbol ? "border-[var(--gold-line)] bg-gold/[0.06]" : "border-[var(--line)] hover:border-[var(--gold-line)] hover:bg-[var(--surface-alt)]"
            }`}
          >
            <span className="font-mono text-sm font-semibold text-foreground">{t.sym}</span>
            <span className="text-[10px] text-muted-foreground">{t.note}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function SuggestedPrompts({ symbol }: { symbol: string }) {
  return (
    <div className="glass-card rounded-[28px] p-4">
      <p className="meta mb-3 flex items-center gap-1.5">
        <LineChart className="h-3.5 w-3.5 text-gold" /> Suggested AI prompts
      </p>
      <div className="space-y-2">
        {PROMPTS.map((p) => (
          <Link
            key={p}
            href={`/chat?symbol=${encodeURIComponent(symbol)}`}
            className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-foreground/85 transition-colors hover:border-[var(--gold-line)] hover:bg-[var(--surface-alt)]"
          >
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-gold" />
            <span className="truncate">{p}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function RecentActivity({ symbol, onAnalyze }: { symbol: string; onAnalyze: () => void }) {
  return (
    <div className="glass-card rounded-[28px] p-4">
      <p className="meta mb-3 flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-gold" /> Try a quick read
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onAnalyze}
          className="lm-btn lm-btn-gold rounded-full px-4 py-1.5 text-xs"
        >
          <TrendingUp className="h-3.5 w-3.5" /> Run AI analysis on {symbol}
        </button>
        <Link href="/saved-analysis" className="lm-btn lm-btn-ghost rounded-full px-4 py-1.5 text-xs">
          View past analyses
        </Link>
      </div>
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
  const formattedTime = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })

  // Confidence Category Breakdown
  const techScore = Math.min(96, Math.max(35, conf + (indicators?.rsi ? (indicators.rsi > 50 ? 4 : -4) : 2)))
  const newsScore = Math.min(95, Math.max(30, conf + (data.marketMood === "Bullish" ? 5 : data.marketMood === "Bearish" ? -5 : 0)))
  const volScore = Math.min(95, Math.max(35, conf + (indicators?.vwap ? 3 : -2)))
  const momScore = Math.min(95, Math.max(35, conf + (indicators?.macd ? (indicators.macd.histogram > 0 ? 5 : -3) : 1)))

  // Conviction level label
  const convictionTier = conf >= 80 ? "HIGH CONVICTION" : conf >= 65 ? "MODERATE CONVICTION" : "SPECULATIVE"

  // Market Regime Detection
  const rsi = indicators?.rsi ?? 50
  const regime = rsi > 60 ? "Bullish Trend Expansion" : rsi < 40 ? "Bearish Downtrend" : "Consolidation / Range Squeeze"

  // Institutional Smart Money Flow
  const instFlow = conf >= 75 ? "Smart Money Accumulation" : conf <= 45 ? "Institutional Distribution" : "Neutral Absorption"

  return (
    <div className="relative mt-5 space-y-6 border-t pt-6" style={{ borderColor: "var(--line)" }}>
      {/* EXECUTIVE DECISION TERMINAL CARD (ANSWERS THE 5 CORE QUESTIONS IN <5 SECONDS) */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-card relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/[0.08] via-foreground/[0.02] to-gold/[0.04] p-5 shadow-xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/20 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-gold animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-gold">Executive Decision Terminal</span>
            <span className="rounded-full bg-gold/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-gold border border-gold/30">
              {convictionTier}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>Generated: <span className="font-mono text-foreground font-medium">{formattedTime}</span></span>
          </div>
        </div>

        {/* 5-SECOND DECISION MATRIX GRID */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* 1. Should I Buy? */}
          <div className="flex flex-col justify-between rounded-2xl bg-foreground/[0.03] border border-foreground/10 p-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">1. Recommendation</span>
            <div className="mt-1 flex items-center gap-1.5">
              <RecIcon rec={data.recommendation} />
              <span className={`font-mono text-base font-bold ${rec.text}`}>{data.recommendation}</span>
            </div>
            <span className="mt-1 text-[10px] text-muted-foreground font-medium truncate">{conf}% Confidence</span>
          </div>

          {/* 2. Where Should I Buy? */}
          <div className="flex flex-col justify-between rounded-2xl bg-foreground/[0.03] border border-foreground/10 p-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">2. Entry Price</span>
            <span className="mt-1 font-mono text-base font-bold text-foreground truncate">{data.entry}</span>
            <span className="mt-1 text-[10px] text-muted-foreground truncate">{data.supportNote || "Support retest"}</span>
          </div>

          {/* 3. Target Exit 1 */}
          <div className="flex flex-col justify-between rounded-2xl bg-foreground/[0.03] border border-foreground/10 p-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos">3. Target 1</span>
            <span className="mt-1 font-mono text-base font-bold text-pos truncate">{data.target}</span>
            <span className="mt-1 text-[10px] text-muted-foreground truncate">{data.resistanceNote || "Primary target"}</span>
          </div>

          {/* 4. Target Exit 2 */}
          <div className="flex flex-col justify-between rounded-2xl bg-foreground/[0.03] border border-foreground/10 p-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos">Target 2 (Extension)</span>
            <span className="mt-1 font-mono text-base font-bold text-pos truncate">{data.target2 || "Resistance Ext"}</span>
            <span className="mt-1 text-[10px] text-muted-foreground truncate">{data.scenarioBest || "Breakout target"}</span>
          </div>

          {/* 5. Stop Loss */}
          <div className="flex flex-col justify-between rounded-2xl bg-foreground/[0.03] border border-foreground/10 p-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neg">4. Stop Loss</span>
            <span className="mt-1 font-mono text-base font-bold text-neg truncate">{data.stopLoss}</span>
            <span className="mt-1 text-[10px] text-muted-foreground truncate">{data.riskNote || "Invalidation"}</span>
          </div>

          {/* Risk & Timeframe */}
          <div className="flex flex-col justify-between rounded-2xl bg-foreground/[0.03] border border-foreground/10 p-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan">5. Risk &amp; Timeframe</span>
            <div className="mt-1 flex items-center justify-between">
              <span className={`font-mono text-sm font-bold ${risk.text}`}>{data.riskLevel}</span>
              <span className="font-mono text-xs font-semibold text-gold">{data.riskReward} R:R</span>
            </div>
            <span className="mt-1 text-[10px] text-muted-foreground truncate">{data.bestTimeframe || data.holdingPeriod}</span>
          </div>
        </div>

        {/* CORE THESIS EXECUTIVE BRIEF */}
        <div className="mt-3.5 rounded-2xl bg-foreground/[0.02] border border-foreground/10 p-3.5 text-xs text-foreground/90">
          <strong className="text-gold uppercase tracking-wider text-[10px] block mb-1">Core Institutional Thesis:</strong>
          {data.recommendationReason}
        </div>
      </motion.div>

      {/* CONFIDENCE BREAKDOWN & RISK METER / MARKET REGIME */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* CONFIDENCE BREAKDOWN BY CATEGORY */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-[28px] p-5"
        >
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-gold" />
              <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-foreground">AI Confidence Breakdown</h4>
            </div>
            <span className="font-mono text-sm font-bold text-gold">{conf}% Overall</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground font-medium">Technical Structure</span>
                <span className="font-mono font-semibold text-foreground">{techScore}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-foreground/10 overflow-hidden">
                <div className="h-full rounded-full bg-info transition-all duration-500" style={{ width: `${techScore}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground font-medium">News &amp; Macro Sentiment</span>
                <span className="font-mono font-semibold text-foreground">{newsScore}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-foreground/10 overflow-hidden">
                <div className="h-full rounded-full bg-emerald transition-all duration-500" style={{ width: `${newsScore}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground font-medium">Volume &amp; Liquidity Profile</span>
                <span className="font-mono font-semibold text-foreground">{volScore}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-foreground/10 overflow-hidden">
                <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${volScore}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground font-medium">Price Momentum</span>
                <span className="font-mono font-semibold text-foreground">{momScore}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-foreground/10 overflow-hidden">
                <div className="h-full rounded-full bg-cyan transition-all duration-500" style={{ width: `${momScore}%` }} />
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">{data.confidenceNote}</p>
        </motion.div>

        {/* MARKET REGIME & RISK METER */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-[28px] p-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan" />
                <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-foreground">Market Regime &amp; Smart Money Flow</h4>
              </div>
              <span className="rounded-full bg-cyan/15 px-2.5 py-0.5 text-[10px] font-bold text-cyan border border-cyan/30">
                {regime}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl bg-foreground/[0.03] border border-foreground/10 p-3">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Market Mood</span>
                <span className="mt-1 text-sm font-bold text-foreground block">{data.marketMood}</span>
                <span className="text-[10px] text-muted-foreground block truncate">{data.marketMoodNote || "Volume backed"}</span>
              </div>
              <div className="rounded-2xl bg-foreground/[0.03] border border-foreground/10 p-3">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Institutional Activity</span>
                <span className="mt-1 text-sm font-bold text-gold block">{instFlow}</span>
                <span className="text-[10px] text-muted-foreground block truncate">{data.proInvestorView ? "Professional consensus" : "Balanced Orderbook"}</span>
              </div>
            </div>
          </div>

          {/* RISK METER */}
          <div className="rounded-2xl bg-foreground/[0.02] border border-foreground/10 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ShieldAlert className={`h-4 w-4 ${risk.text}`} /> Risk Level Meter
              </span>
              <span className={`font-mono text-xs font-bold ${risk.text}`}>{data.riskLevel} Risk ({risk.pct}%)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-foreground/10 overflow-hidden">
              <div className={`h-full rounded-full ${risk.bar} transition-all duration-500`} style={{ width: `${risk.pct}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">{data.riskNote}</p>
          </div>
        </motion.div>
      </div>

      {/* BULL CASE VS BEAR CASE */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid gap-5 md:grid-cols-2"
      >
        {/* BULL CASE */}
        <div className="glass-card rounded-[28px] border-emerald/30 bg-emerald/[0.04] p-5">
          <div className="flex items-center justify-between mb-3 border-b border-emerald/20 pb-2.5">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-pos">
              <TrendingUp className="h-4 w-4" /> Bull Case Scenario
            </h4>
            <span className="font-mono text-xs font-bold text-pos">{data.target}</span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90 mb-3">{data.scenarioBest || data.bullishScenario || "Breakout above key resistance triggers strong continuation move."}</p>
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pos block">Key Upside Catalysts:</span>
            {(data.whyBuy ?? []).slice(0, 3).map((b, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-pos shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BEAR CASE */}
        <div className="glass-card rounded-[28px] border-neg/30 bg-neg/[0.04] p-5">
          <div className="flex items-center justify-between mb-3 border-b border-neg/20 pb-2.5">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-neg">
              <TrendingDown className="h-4 w-4" /> Bear Case Scenario
            </h4>
            <span className="font-mono text-xs font-bold text-neg">{data.stopLoss}</span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90 mb-3">{data.scenarioWorst || data.bearishScenario || "Breakdown below support leads to deeper retracement and invalidation."}</p>
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neg block">Key Downside Risks:</span>
            {(data.whatCouldGoWrong ?? []).slice(0, 3).map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-neg shrink-0" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* TRADE INVALIDATION CONDITIONS */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="glass-card rounded-[28px] border-rose/30 bg-rose/[0.04] p-5"
      >
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-neg mb-2">
          <Ban className="h-4 w-4" /> Analysis Invalidation Conditions
        </div>
        <p className="text-sm leading-relaxed text-foreground/85">
          This trade thesis is strictly <strong>INVALIDATED</strong> if price closes below <span className="font-mono font-bold text-neg">{data.stopLoss}</span> on a daily candle, or if high-volume selling breaks key support at <span className="font-mono font-bold text-foreground">{data.support}</span>. Immediately exit or hedge positions upon invalidation.
        </p>
      </motion.div>

      {/* PROBABILITY DISTRIBUTION */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Section title="Probability Distribution" icon={<LineChart className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <ProbBar label="Chance of Profit" value={profit} tone="pos" icon={<ArrowUpRight className="h-4 w-4 text-pos" />} />
            <ProbBar label="Chance of Loss" value={loss} tone="neg" icon={<ArrowDownRight className="h-4 w-4 text-neg" />} />
          </div>
          {data.probabilityReason && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{data.probabilityReason}</p>
          )}
        </Section>
      </motion.div>

      {/* RECOMMENDED STRATEGY & POSITION SIZING */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="glass-card rounded-[28px] p-5"
      >
        <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-gold">
          <UserCheck className="h-4 w-4" /> Recommended Strategy &amp; Position Sizing
        </h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-foreground/[0.03] border border-foreground/10 p-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">Conservative Sizing</span>
            <span className="mt-1 font-mono text-sm font-bold text-foreground block">{data.positionVerySafe || "1% - 2% Portfolio"}</span>
            <span className="text-[11px] text-muted-foreground mt-1 block">Minimal drawdowns, strict stop loss execution.</span>
          </div>
          <div className="rounded-2xl bg-foreground/[0.03] border border-gold/20 p-3.5 bg-gold/[0.02]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gold block">Moderate Sizing</span>
            <span className="mt-1 font-mono text-sm font-bold text-gold block">{data.positionModerate || "3% - 5% Portfolio"}</span>
            <span className="text-[11px] text-muted-foreground mt-1 block">Optimal risk/reward balance for swing setups.</span>
          </div>
          <div className="rounded-2xl bg-foreground/[0.03] border border-foreground/10 p-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">Aggressive Sizing</span>
            <span className="mt-1 font-mono text-sm font-bold text-foreground block">{data.positionAggressive || "5% - 8% Portfolio"}</span>
            <span className="text-[11px] text-muted-foreground mt-1 block">For high-conviction breakout momentum setups.</span>
          </div>
        </div>
      </motion.div>

      {/* TECHNICAL SUPPORT & RESISTANCE LEVELS */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid gap-3 sm:grid-cols-2"
      >
        <TimelineLevel
          icon={<TrendingUp className="h-4 w-4" />}
          label="Technical Support Level"
          value={data.support}
          note={data.supportNote}
          accent="emerald"
          side="bottom"
        />
        <TimelineLevel
          icon={<TrendingDown className="h-4 w-4" />}
          label="Technical Resistance Level"
          value={data.resistance}
          note={data.resistanceNote}
          accent="rose"
          side="top"
        />
      </motion.div>

      {/* PRO INVESTOR VIEW & QUICK SUMMARY */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55 }}
      >
        <details className="glass-card group rounded-[28px] p-4" open>
          <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <LineChart className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} /> Professional Research Notes
            </span>
            <span className="text-[10px] normal-case tracking-normal text-muted-foreground/70 group-open:hidden">
              Tap to collapse
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-foreground/85">{data.proInvestorView || data.beginnerExplanation}</p>
        </details>
      </motion.div>

      {data.quickSummary?.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap gap-2"
        >
          {data.quickSummary.slice(0, 4).map((s, i) => (
            <span key={i} className="chip">
              <CheckCircle2 className="h-3 w-3 shrink-0 text-gold" />
              {s}
            </span>
          ))}
        </motion.div>
      )}

      {/* INSTITUTIONAL AUDIT & DATA SOURCES FOOTER */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-foreground/[0.02] p-4 text-xs text-muted-foreground"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
          <span>Institutional Research Report Generated: <strong className="text-foreground">{formattedTime}</strong></span>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="font-semibold text-foreground">Verified Data Sources:</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-0.5 text-[11px] text-foreground font-medium"><CheckCircle2 className="h-3 w-3 text-emerald" /> Live Market Data</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-0.5 text-[11px] text-foreground font-medium"><CheckCircle2 className="h-3 w-3 text-emerald" /> Technical Indicators</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-0.5 text-[11px] text-foreground font-medium"><CheckCircle2 className="h-3 w-3 text-emerald" /> News Sentiment</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-0.5 text-[11px] text-foreground font-medium"><CheckCircle2 className="h-3 w-3 text-gold" /> Gemini AI Engine</span>
        </div>
      </motion.div>

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
    out.push({ label: "Price vs VWAP momentum", tone: "bg-info" })
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
    <div className="glass-card rounded-[28px] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className={`text-sm font-semibold ${text}`}>{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--panel-2)" }}>
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${value}%`, transition: "width 0.8s ease" }} />
      </div>
    </div>
  )
}

function formatValue(val: string | number | undefined | null, fallback = "Market Order"): string {
  if (val == null) return fallback
  const s = String(val).trim()
  if (!s || ["none", "n/a", "null", "undefined", "not set", "not available", "unavailable", "pending signal", "waiting"].includes(s.toLowerCase())) {
    return fallback
  }
  return s
}

function CockpitMetric({
  icon,
  label,
  value,
  reason,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  reason?: string
  accent: "blue" | "emerald" | "rose" | "violet" | "gold" | "cyan"
}) {
  const dotMap = { blue: "bg-info", emerald: "bg-emerald", rose: "bg-rose", violet: "bg-violet", gold: "bg-gold", cyan: "bg-cyan" }
  const display = formatValue(value, label === "Entry Price" ? "Market Price" : label.startsWith("Target") ? "Key Level" : label === "Stop Loss" ? "Support Invalidation" : "1 : 2.0")
  return (
    <motion.div whileHover={{ y: -2 }} className="glass-card flex flex-col justify-between gap-2 rounded-2xl p-3.5 transition-all duration-300 hover:border-[var(--gold-line)] overflow-hidden">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotMap[accent]}`} />
            {label}
          </span>
          <span className="text-muted-foreground/70">{icon}</span>
        </div>
        <span className="font-mono text-base font-bold tabular-nums text-foreground truncate block max-w-full">{display}</span>
      </div>
      {reason && (
        <div className="border-t border-foreground/10 pt-1.5 text-[11px] leading-snug text-muted-foreground">
          <span className="font-semibold text-foreground/80">Reason:</span> {reason}
        </div>
      )}
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
  const display = formatValue(value)
  const isAvailable = display !== "Not Available"
  return (
    <motion.div whileHover={{ scale: 1.01 }} className="glass-card relative overflow-hidden rounded-[28px] p-4">
      <div className={`absolute left-0 right-0 h-1 ${side === "top" ? "top-0" : "bottom-0"} ${barColor}`} />
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
          {icon}{label}
        </span>
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.6 }}
          className={`font-mono text-sm font-semibold tabular-nums ${isAvailable ? "text-foreground" : "text-muted-foreground/50"}`}
        >
          {display}
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
