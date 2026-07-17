"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence, useSpring, useMotionValue } from "motion/react"
import {
  TrendingUp, TrendingDown, BarChart3,
  Clock, ChevronDown, AlertTriangle,
  RefreshCw, ArrowUpRight, ArrowDownRight, ArrowRight, Search,
  Loader2,
} from "lucide-react"
import { SymbolSearch } from "@/components/symbol-search"

type HoldingPeriod = "1 day" | "1 week" | "1 month" | "3 months" | "6 months" | "1 year"

const HOLDING_OPTIONS: { label: string; value: HoldingPeriod }[] = [
  { label: "1 Day", value: "1 day" },
  { label: "1 Week", value: "1 week" },
  { label: "1 Month", value: "1 month" },
  { label: "3 Months", value: "3 months" },
  { label: "6 Months", value: "6 months" },
  { label: "1 Year", value: "1 year" },
]

type RiskLevel = "Low" | "Medium" | "High"

const RISK_OPTIONS: { label: string; value: RiskLevel; desc: string }[] = [
  { label: "Low", value: "Low", desc: "Conservative" },
  { label: "Medium", value: "Medium", desc: "Balanced" },
  { label: "High", value: "High", desc: "Aggressive" },
]

type AnalysisResult = {
  recommendation: "Buy" | "Wait"
  recommendationReason: string
  betterEntry: string
  investmentRequired: number
  estimatedProfit: number
  estimatedLoss: number
  riskRewardRatio: string
  confidenceScore: number
  probabilityOfProfit: number
  probabilityOfLoss: number
  suggestedTarget: string
  suggestedStopLoss: string
  beginnerExplanation: string
  supportResistance?: string
  positionSizing?: string
}

function SpotlightFollow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const rawX = useMotionValue(-500)
  const rawY = useMotionValue(-500)
  const x = useSpring(rawX, { stiffness: 65, damping: 25, mass: 0.8 })
  const y = useSpring(rawY, { stiffness: 65, damping: 25, mass: 0.8 })

  const handleMove = useCallback((e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (r) { rawX.set(e.clientX - r.left); rawY.set(e.clientY - r.top) }
  }, [rawX, rawY])

  return (
    <div ref={ref} onMouseMove={handleMove} className="relative">
      <motion.div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden>
        <motion.div
          className="absolute left-0 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ x, y, background: "radial-gradient(circle at center, oklch(0.55 0.18 255 / 0.06), transparent 60%)" }}
        />
        <motion.div
          className="absolute left-0 top-0 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ x, y, background: "radial-gradient(circle at center, oklch(0.62 0.16 168 / 0.04), transparent 60%)" }}
        />
      </motion.div>
      {children}
    </div>
  )
}

function GlassCard({ children, className = "", glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return (
    <div className={`group relative overflow-hidden rounded-[28px] border border-white/20 bg-white/15 backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:bg-white/20 hover:shadow-xl ${className}`}>
      {glow && (
        <div className="pointer-events-none absolute -inset-1 rounded-[30px] opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: "linear-gradient(135deg, oklch(0.55 0.18 255 / 0.15), oklch(0.62 0.16 168 / 0.1))" }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-[28px]" />
      <div className="relative">{children}</div>
    </div>
  )
}

function RecommendationBadge({ rec }: { rec: "Buy" | "Wait" }) {
  const isBuy = rec === "Buy"
  return (
    <motion.div
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 18, mass: 0.8 }}
      className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 ${
        isBuy
          ? "bg-emerald/15 text-emerald border border-emerald/20"
          : "bg-gold/15 text-gold border border-gold/20"
      }`}
    >
      <motion.div
        animate={isBuy ? { scale: [1, 1.15, 1] } : { rotate: [0, -8, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {isBuy ? <TrendingUp className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
      </motion.div>
      <span className="font-heading text-lg font-bold tracking-tight">{rec}</span>
    </motion.div>
  )
}

function ConfidenceGauge({ score }: { score: number }) {
  const angle = (score / 100) * 180
  const color = score >= 70 ? "oklch(0.62 0.16 168)" : score >= 40 ? "oklch(0.75 0.12 75)" : "oklch(0.58 0.18 22)"

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        <svg width="120" height="68" viewBox="0 0 120 68" className="overflow-visible">
          <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="oklch(0.85 0.01 85 / 0.3)" strokeWidth="8" strokeLinecap="round" />
          <motion.path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(angle / 180) * 157} 157`}
            initial={{ strokeDasharray: "0 157" }}
            animate={{ strokeDasharray: `${(angle / 180) * 157} 157` }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.circle
            cx={10 + (Math.cos(Math.PI - (angle * Math.PI) / 180) * 50)}
            cy={60 - (Math.sin(Math.PI - (angle * Math.PI) / 180) * 50)}
            r="5"
            fill={color}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          />
        </svg>
        <motion.span
          className="absolute bottom-0 font-heading text-2xl font-bold tabular-nums"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          style={{ color }}
        >
          {score}%
        </motion.span>
      </div>
      <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Confidence</span>
    </div>
  )
}

function ProbabilityBars({ profit, loss }: { profit: number; loss: number }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-semibold text-emerald flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Profit
          </span>
          <span className="font-mono font-bold text-emerald tabular-nums">{profit}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/30">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald/60 to-emerald"
            initial={{ width: 0 }}
            animate={{ width: `${profit}%` }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-semibold text-neg flex items-center gap-1">
            <TrendingDown className="h-3 w-3" /> Loss
          </span>
          <span className="font-mono font-bold text-neg tabular-nums">{loss}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/30">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-neg/60 to-neg"
            initial={{ width: 0 }}
            animate={{ width: `${loss}%` }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
    </div>
  )
}

function RiskRewardVisual({ ratio }: { ratio: string }) {
  const parts = ratio.replace("1:", "").split(":")
  const reward = parseFloat(parts[0]) || 1
  const total = 1 + reward
  const riskPct = (1 / total) * 100
  const rewardPct = (reward / total) * 100

  return (
    <div className="space-y-2">
      <div className="flex h-8 overflow-hidden rounded-xl">
        <motion.div
          className="flex items-center justify-center bg-neg/20 text-[10px] font-bold text-neg"
          initial={{ width: 0 }}
          animate={{ width: `${riskPct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Risk 1
        </motion.div>
        <motion.div
          className="flex items-center justify-center bg-emerald/20 text-[10px] font-bold text-emerald"
          initial={{ width: 0 }}
          animate={{ width: `${rewardPct}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          Reward {reward.toFixed(1)}
        </motion.div>
      </div>
      <div className="text-center">
        <span className="font-heading text-sm font-semibold text-foreground">
          {ratio}
        </span>
      </div>
    </div>
  )
}

function AnimatedValue({ value, prefix = "", suffix = "", className = "" }: {
  value: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  return (
    <motion.span
      className={`font-heading text-xl font-semibold tracking-tight tabular-nums ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {prefix}{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}
    </motion.span>
  )
}

function parseNaturalLanguage(text: string): Partial<{
  buyPrice: number
  quantity: number
  budget: number
  target: number
  stopLoss: number
}> {
  const result: ReturnType<typeof parseNaturalLanguage> = {}
  const lower = text.toLowerCase()

  const priceMatch = lower.match(/(?:buy at|price|at|entry)\s*(?:rs\.?|₹|inr|rupees?|\$|usd)?\s*(\d+[\d,.]*)/i)
  if (priceMatch) result.buyPrice = parseFloat(priceMatch[1].replace(/,/g, ""))

  const budgetMatch = lower.match(/(?:budget|invest|spend|capital)\s*(?:rs\.?|₹|inr|rupees?|\$|usd)?\s*(\d+[\d,.]*)/i)
  if (budgetMatch) result.budget = parseFloat(budgetMatch[1].replace(/,/g, ""))

  const qtyMatch = lower.match(/(?:quantity|qty|shares?|units?)\s*(?:of\s*)?(\d+)/i)
  if (qtyMatch) result.quantity = parseInt(qtyMatch[1], 10)

  if (!qtyMatch) {
    const numOnly = lower.match(/(\d+)\s*(?:shares?|units?|qty)/i)
    if (numOnly) result.quantity = parseInt(numOnly[1], 10)
  }

  const targetMatch = lower.match(/(?:target|goal|aim)\s*(?:rs\.?|₹|inr|rupees?|\$|usd)?\s*(\d+[\d,.]*)/i)
  if (targetMatch) result.target = parseFloat(targetMatch[1].replace(/,/g, ""))

  const stopMatch = lower.match(/(?:stop loss|stoploss|stop|sl)\s*(?:rs\.?|₹|inr|rupees?|\$|usd)?\s*(\d+[\d,.]*)/i)
  if (stopMatch) result.stopLoss = parseFloat(stopMatch[1].replace(/,/g, ""))

  return result
}

export function TradePlannerClient() {
  const [symbol, setSymbol] = useState("")
  const [buyPrice, setBuyPrice] = useState("")
  const [quantity, setQuantity] = useState("")
  const [budget, setBudget] = useState("")
  const [target, setTarget] = useState("")
  const [stopLoss, setStopLoss] = useState("")
  const [holdingPeriod, setHoldingPeriod] = useState<HoldingPeriod>("1 month")
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("Medium")
  const [nlInput, setNlInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState("")
  const [showHoldingDropdown, setShowHoldingDropdown] = useState(false)
  const [showRiskDropdown, setShowRiskDropdown] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  const computedBudget = buyPrice && quantity
    ? (parseFloat(buyPrice) * parseFloat(quantity)).toFixed(2)
    : ""

  const handleBudgetChange = (val: string) => {
    setBudget(val)
    if (buyPrice && val) {
      const q = Math.floor(parseFloat(val) / parseFloat(buyPrice))
      if (q > 0 && !quantity) setQuantity(q.toString())
    }
  }

  const handleNlParse = () => {
    if (!nlInput.trim()) return
    const parsed = parseNaturalLanguage(nlInput)
    if (parsed.buyPrice) setBuyPrice(parsed.buyPrice.toString())
    if (parsed.quantity) setQuantity(parsed.quantity.toString())
    if (parsed.budget) setBudget(parsed.budget.toString())
    if (parsed.target) setTarget(parsed.target.toString())
    if (parsed.stopLoss) setStopLoss(parsed.stopLoss.toString())
  }

  const formValid = symbol && buyPrice && quantity

  const handleAnalyze = async () => {
    if (!formValid) return
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/trade-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          buyPrice: parseFloat(buyPrice),
          quantity: parseInt(quantity, 10),
          budget: budget ? parseFloat(budget) : parseFloat(computedBudget),
          target: target ? parseFloat(target) : null,
          stopLoss: stopLoss ? parseFloat(stopLoss) : null,
          holdingPeriod,
          riskLevel,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Analysis failed")
      setResult(data)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const bPrice = parseFloat(buyPrice) || 0
  const qty = parseInt(quantity, 10) || 0
  const tgt = parseFloat(target) || 0
  const sl = parseFloat(stopLoss) || 0
  const totCost = bPrice * qty
  const profitAmt = tgt > 0 ? (tgt - bPrice) * qty : 0
  const lossAmt = sl > 0 ? (bPrice - sl) * qty : 0
  const profitPct = tgt > 0 ? ((tgt - bPrice) / bPrice) * 100 : 0
  const lossPct = sl > 0 ? ((bPrice - sl) / bPrice) * 100 : 0
  const rrRatio = lossAmt > 0 ? (profitAmt / lossAmt).toFixed(2) : "—"
  const breakevenPrice = bPrice
  const posSizePct = budget ? (totCost / parseFloat(budget)) * 100 : 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[28px] bg-blue/10 border border-white/20">
            <BarChart3 className="h-6 w-6 text-blue" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              AI Trade Planner
            </h1>
            <p className="text-sm text-muted-foreground">
              Plan, analyze, and optimize your trades with AI-powered insights
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column — Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 space-y-6"
        >
          <SpotlightFollow>
            <GlassCard className="p-6">
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                  <span className="font-heading text-sm font-semibold tracking-tight">Trade Details</span>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Symbol
                  </label>
                  <SymbolSearch onSelect={(r) => setSymbol(r.symbol)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Buy Price
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={buyPrice}
                      onChange={(e) => setBuyPrice(e.target.value)}
                      placeholder="0.00"
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Quantity
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="0"
                      className="glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Budget (auto-calculated)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={budget || computedBudget}
                    onChange={(e) => handleBudgetChange(e.target.value)}
                    placeholder="0.00"
                    className="glass-input text-blue font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Target Price
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      placeholder="Optional"
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Stop Loss
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      placeholder="Optional"
                      className="glass-input"
                    />
                  </div>
                </div>

                {/* Holding Period */}
                <div className="relative">
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Holding Period
                  </label>
                  <button
                    onClick={() => setShowHoldingDropdown(!showHoldingDropdown)}
                    className="glass-input flex items-center justify-between text-left"
                  >
                    <span>{HOLDING_OPTIONS.find((o) => o.value === holdingPeriod)?.label}</span>
                    <motion.div animate={{ rotate: showHoldingDropdown ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {showHoldingDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/20 bg-white/20 backdrop-blur-2xl shadow-xl"
                      >
                        {HOLDING_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => { setHoldingPeriod(opt.value); setShowHoldingDropdown(false) }}
                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${
                              holdingPeriod === opt.value ? "text-blue font-semibold" : "text-muted-foreground"
                            }`}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Risk Level */}
                <div className="relative">
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Risk Level
                  </label>
                  <button
                    onClick={() => setShowRiskDropdown(!showRiskDropdown)}
                    className="glass-input flex items-center justify-between text-left"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${
                        riskLevel === "Low" ? "bg-emerald" : riskLevel === "Medium" ? "bg-gold" : "bg-neg"
                      }`} />
                      {riskLevel}
                    </span>
                    <motion.div animate={{ rotate: showRiskDropdown ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {showRiskDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/20 bg-white/20 backdrop-blur-2xl shadow-xl"
                      >
                        {RISK_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => { setRiskLevel(opt.value); setShowRiskDropdown(false) }}
                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${
                              riskLevel === opt.value ? "text-blue font-semibold" : "text-muted-foreground"
                            }`}
                          >
                            <span className={`h-2 w-2 rounded-full ${
                              opt.value === "Low" ? "bg-emerald" : opt.value === "Medium" ? "bg-gold" : "bg-neg"
                            }`} />
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{opt.desc}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Natural Language */}
                <div className="border-t border-white/10 pt-4">
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Describe your trade plan
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nlInput}
                      onChange={(e) => setNlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleNlParse()
                      }}
                      placeholder="e.g. I want to buy at ₹999, my budget is ₹50,000..."
                      className="glass-input flex-1 text-sm"
                    />
                    <button
                      onClick={handleNlParse}
                      className="glass-btn glass-btn-soft shrink-0"
                      title="Parse natural language"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    Try: &ldquo;Buy at ₹999&rdquo; &middot; &ldquo;Budget ₹50,000&rdquo; &middot; &ldquo;I want 59 shares&rdquo;
                  </p>
                </div>

                <motion.button
                  onClick={handleAnalyze}
                  disabled={!formValid || loading}
                  whileHover={formValid && !loading ? { scale: 1.02 } : {}}
                  whileTap={formValid && !loading ? { scale: 0.98 } : {}}
                  className={`glass-btn glass-btn-primary w-full mt-2 ${
                    !formValid || loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Analyze Trade Plan
                    </>
                  )}
                </motion.button>
              </div>
            </GlassCard>
          </SpotlightFollow>

          {/* Bonus Calculators */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
                    <span className="font-heading text-xs font-semibold tracking-tight text-foreground/80">Bonus Calculators</span>
            </div>
            {bPrice > 0 && qty > 0 && (
              <>
                {tgt > 0 && (
                  <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald/10">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] tracking-wider text-muted-foreground uppercase">Profit</span>
                        <p className="font-mono text-sm font-semibold text-emerald tabular-nums">
                          +{profitAmt.toFixed(2)} ({profitPct.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                )}
                {sl > 0 && (
                  <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neg/10">
                        <TrendingDown className="h-3.5 w-3.5 text-neg" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] tracking-wider text-muted-foreground uppercase">Loss</span>
                        <p className="font-mono text-sm font-semibold text-neg tabular-nums">
                          -{lossAmt.toFixed(2)} ({lossPct.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                )}
                <GlassCard className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] tracking-wider text-muted-foreground uppercase">Position Size</p>
                      <p className="font-mono text-sm font-semibold text-foreground tabular-nums">
                        {qty} shares x {bPrice} = {totCost.toFixed(2)}
                        {budget ? ` (${posSizePct.toFixed(1)}% of budget)` : ""}
                      </p>
                    </div>
                  </div>
                </GlassCard>
                {tgt > 0 && sl > 0 && (
                  <>
                    <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] tracking-wider text-muted-foreground uppercase">Risk/Reward Ratio</p>
                        <p className="font-mono text-sm font-semibold text-foreground tabular-nums">
                          1:{rrRatio}
                        </p>
                      </div>
                    </div>
                    </GlassCard>
                    <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] tracking-wider text-muted-foreground uppercase">Break-even Price</p>
                        <p className="font-mono text-sm font-semibold text-foreground tabular-nums">
                          {breakevenPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    </GlassCard>
                  </>
                )}
              </>
            )}
            {(!bPrice || !qty) && (
              <GlassCard className="p-4">
                <p className="text-xs text-muted-foreground text-center py-2">
                  Enter buy price & quantity to see bonus calculators
                </p>
              </GlassCard>
            )}
          </div>
        </motion.div>

        {/* Right Column — Results */}
        <motion.div
          ref={resultsRef}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-[28px] border border-neg/20 bg-neg/5 backdrop-blur-sm p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-neg" />
                <p className="text-sm text-neg">{error}</p>
              </div>
            </motion.div>
          )}

          {!result && !loading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 rounded-[32px] border border-white/20 bg-white/15 backdrop-blur-xl p-12 text-center"
            >
              <h3 className="font-heading text-lg font-semibold text-foreground">Ready to Plan</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Fill in your trade details on the left and click Analyze to get AI-powered insights on your trade plan.
              </p>
            </motion.div>
          )}

          {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-full min-h-[400px] flex-col items-center justify-center gap-6 rounded-[32px] border border-white/20 bg-white/15 backdrop-blur-xl p-12"
              >
                <div className="space-y-2 text-center">
                  <h3 className="font-heading text-lg font-semibold text-foreground">Analyzing Your Trade Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    Calculating risk metrics and generating AI insights...
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-2 w-2 rounded-full bg-blue"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
          )}

          <AnimatePresence>
            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                {/* Recommendation */}
                <GlassCard glow className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <RecommendationBadge rec={result.recommendation} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{result.recommendationReason}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Better Entry: {result.betterEntry}
                        </p>
                      </div>
                    </div>
                    <ConfidenceGauge score={result.confidenceScore} />
                  </div>
                </GlassCard>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <GlassCard className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue/10">
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                          Investment
                        </p>
                        <AnimatedValue value={result.investmentRequired} prefix="₹" className="!text-lg" />
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald/10">
                        <ArrowUpRight className="h-4 w-4 text-emerald" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                          Est. Profit
                        </p>
                        <AnimatedValue value={result.estimatedProfit} prefix="₹" className="!text-lg !text-emerald" />
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neg/10">
                        <ArrowDownRight className="h-4 w-4 text-neg" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                          Est. Loss
                        </p>
                        <AnimatedValue value={Math.abs(result.estimatedLoss)} prefix="₹" className="!text-lg !text-neg" />
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet/10">
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                          Target
                        </p>
                        <p className="font-heading text-lg font-semibold tracking-tight text-foreground tabular-nums">
                          {result.suggestedTarget}
                        </p>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                          Stop Loss
                        </p>
                        <p className="font-heading text-lg font-semibold tracking-tight text-foreground tabular-nums">
                          {result.suggestedStopLoss}
                        </p>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald/10">
                        <RefreshCw className="h-4 w-4 text-emerald" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                          R:R
                        </p>
                        <div className="mt-1">
                          <RiskRewardVisual ratio={result.riskRewardRatio} />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </div>

                {/* Probability & AI Explanation */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <GlassCard className="p-5">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-3">
                      <BarChart3 className="h-4 w-4 text-blue" />
                      <span className="font-heading text-xs font-semibold tracking-tight text-foreground">
                        Probability
                      </span>
                    </div>
                    <ProbabilityBars profit={result.probabilityOfProfit} loss={result.probabilityOfLoss} />
                  </GlassCard>

                  <GlassCard className="p-5">
                    <div className="border-b border-white/10 pb-3 mb-3">
                      <span className="font-heading text-xs font-semibold tracking-tight text-foreground">
                        AI Explanation
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {result.beginnerExplanation}
                    </p>
                  </GlassCard>
                </div>

                <motion.button
                  onClick={handleAnalyze}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass-btn glass-btn-ghost w-full"
                >
                  <RefreshCw className="h-4 w-4" />
                  Re-analyze Trade Plan
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
