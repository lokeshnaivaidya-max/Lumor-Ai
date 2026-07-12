"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Search, Brain, TrendingUp, TrendingDown, BarChart3, Activity } from "lucide-react"

const DEMO_COMPARE = {
  a: { symbol: "AAPL", name: "Apple Inc.", price: 178.20, change: 1.2, marketCap: "2.85T", pe: 28.5, eps: 6.25, revenue: "391B", dividend: 0.52, beta: 1.21, rsi: 54, recommendation: "Buy", score: 74 },
  b: { symbol: "MSFT", name: "Microsoft Corp.", price: 425.30, change: 0.8, marketCap: "3.16T", pe: 35.2, eps: 12.08, revenue: "245B", dividend: 0.72, beta: 0.91, rsi: 58, recommendation: "Strong Buy", score: 82 },
}

export function CompareClient() {
  const [symbolA] = useState("AAPL")
  const [symbolB] = useState("MSFT")
  const [inputA, setInputA] = useState("")
  const [inputB, setInputB] = useState("")

  const rows = [
    { label: "Current Price", a: `$${DEMO_COMPARE.a.price}`, b: `$${DEMO_COMPARE.b.price}`, type: "number" },
    { label: "Change %", a: `${DEMO_COMPARE.a.change > 0 ? "+" : ""}${DEMO_COMPARE.a.change}%`, b: `${DEMO_COMPARE.b.change > 0 ? "+" : ""}${DEMO_COMPARE.b.change}%`, type: DEMO_COMPARE.a.change > DEMO_COMPARE.b.change ? "positive" : "negative" },
    { label: "Market Cap", a: DEMO_COMPARE.a.marketCap, b: DEMO_COMPARE.b.marketCap, type: "number" },
    { label: "P/E Ratio", a: DEMO_COMPARE.a.pe, b: DEMO_COMPARE.b.pe, type: DEMO_COMPARE.a.pe < DEMO_COMPARE.b.pe ? "positive" : "negative" },
    { label: "EPS (TTM)", a: `$${DEMO_COMPARE.a.eps}`, b: `$${DEMO_COMPARE.b.eps}`, type: "number" },
    { label: "Revenue", a: DEMO_COMPARE.a.revenue, b: DEMO_COMPARE.b.revenue, type: "number" },
    { label: "Dividend Yield", a: `${DEMO_COMPARE.a.dividend}%`, b: `${DEMO_COMPARE.b.dividend}%`, type: "number" },
    { label: "Beta", a: DEMO_COMPARE.a.beta, b: DEMO_COMPARE.b.beta, type: "number" },
    { label: "RSI (14)", a: DEMO_COMPARE.a.rsi, b: DEMO_COMPARE.b.rsi, type: "number" },
  ]

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Compare Stocks</h1>
        <p className="mt-1 text-sm text-muted-foreground">Side-by-side comparison with AI-powered insights.</p>
      </motion.div>

      {/* AI Recommendation Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 glass-panel edge-light rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple/10 via-primary/5 to-emerald/10 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-purple" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">AI Recommendation</span>
          </div>
          <p className="text-sm">
            <strong className="text-emerald">{DEMO_COMPARE.b.symbol}</strong> scores higher on growth metrics
            (P/E expansion potential, Azure revenue growth at 28% YoY) while <strong className="text-blue">{DEMO_COMPARE.a.symbol}</strong>
            offers stronger value metrics and brand moat. For growth-oriented portfolios, <strong className="text-emerald">MSFT is preferred</strong>.
          </p>
        </div>
      </motion.div>

      {/* Search inputs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {[inputA, inputB].map((val, i) => (
          <div key={i} className="glass relative rounded-2xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={val}
              onChange={(e) => i === 0 ? setInputA(e.target.value) : setInputB(e.target.value)}
              placeholder={`Search symbol ${i + 1}...`}
              className="w-full rounded-2xl bg-transparent py-3 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel edge-light rounded-2xl overflow-hidden">
        <div className="grid grid-cols-3 gap-px bg-border/30">
          <div className="bg-background/80 p-4">
            <p className="text-xs font-medium text-muted-foreground">Metric</p>
          </div>
          <div className="bg-background/80 p-4 text-center">
            <p className="text-sm font-semibold">{symbolA}</p>
            <p className="text-xs text-muted-foreground">{DEMO_COMPARE.a.name}</p>
          </div>
          <div className="bg-background/80 p-4 text-center">
            <p className="text-sm font-semibold">{symbolB}</p>
            <p className="text-xs text-muted-foreground">{DEMO_COMPARE.b.name}</p>
          </div>
          {rows.map((row) => (
            <div key={row.label} className="contents">
              <div className="bg-background/50 p-4">
                <p className="text-sm text-muted-foreground">{row.label}</p>
              </div>
              <div className={`bg-background/50 p-4 text-center ${row.type === "positive" ? "text-emerald" : row.type === "negative" ? "text-neg" : ""}`}>
                <p className="text-sm font-medium">{String(row.a)}</p>
              </div>
              <div className={`bg-background/50 p-4 text-center ${row.type === "positive" ? "text-emerald" : row.type === "negative" ? "text-neg" : ""}`}>
                <p className="text-sm font-medium">{String(row.b)}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* AI Scores */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[DEMO_COMPARE.a, DEMO_COMPARE.b].map((item) => (
          <div key={item.symbol} className="glass-panel edge-light rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">{item.symbol}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                item.recommendation === "Strong Buy" ? "bg-emerald/15 text-emerald" : "bg-blue/15 text-blue"
              }`}>{item.recommendation}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(0.99 0 0 / 0.08)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(0.7 0.13 250)" strokeWidth="8"
                    strokeDasharray={`${(item.score / 100) * 264} 264`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold">{item.score}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>AI Score</p>
                <p className="text-foreground font-medium mt-0.5">{item.recommendation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
