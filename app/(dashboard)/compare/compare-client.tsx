"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Search, Brain } from "lucide-react"

const DEMO = {
  a: { symbol: "AAPL", name: "Apple Inc.", price: 178.20, change: 1.2, marketCap: "2.85T", pe: 28.5, eps: 6.25, revenue: "391B", dividend: 0.52, beta: 1.21, rsi: 54, recommendation: "Buy", score: 74 },
  b: { symbol: "MSFT", name: "Microsoft Corp.", price: 425.30, change: 0.8, marketCap: "3.16T", pe: 35.2, eps: 12.08, revenue: "245B", dividend: 0.72, beta: 0.91, rsi: 58, recommendation: "Strong Buy", score: 82 },
}

export function CompareClient() {
  const [inputA, setInputA] = useState("")
  const [inputB, setInputB] = useState("")
  const rows = [
    { label: "Current Price", a: `$${DEMO.a.price}`, b: `$${DEMO.b.price}`, t: "" },
    { label: "Change %", a: `${DEMO.a.change > 0 ? "+" : ""}${DEMO.a.change}%`, b: `${DEMO.b.change > 0 ? "+" : ""}${DEMO.b.change}%`, t: DEMO.a.change > DEMO.b.change ? "pos" : "neg" },
    { label: "Market Cap", a: DEMO.a.marketCap, b: DEMO.b.marketCap, t: "" },
    { label: "P/E Ratio", a: DEMO.a.pe, b: DEMO.b.pe, t: DEMO.a.pe < DEMO.b.pe ? "pos" : "neg" },
    { label: "EPS (TTM)", a: `$${DEMO.a.eps}`, b: `$${DEMO.b.eps}`, t: "" },
    { label: "Revenue", a: DEMO.a.revenue, b: DEMO.b.revenue, t: "" },
    { label: "Dividend Yield", a: `${DEMO.a.dividend}%`, b: `${DEMO.b.dividend}%`, t: "" },
    { label: "Beta", a: DEMO.a.beta, b: DEMO.b.beta, t: "" },
    { label: "RSI (14)", a: DEMO.a.rsi, b: DEMO.b.rsi, t: "" },
  ]

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Compare Stocks</h1>
        <p className="mt-1 text-sm text-muted-foreground">Side-by-side comparison with AI-powered insights.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 glass-card edge-light rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-violet/10 via-primary/5 to-emerald/10 p-5">
          <div className="flex items-center gap-2 mb-2"><Brain className="h-4 w-4 text-violet" /><span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">AI Recommendation</span></div>
          <p className="text-sm"><strong className="text-emerald">{DEMO.b.symbol}</strong> scores higher on growth metrics (Azure revenue growth at 28% YoY) while <strong className="text-blue">{DEMO.a.symbol}</strong> offers stronger value metrics and brand moat. For growth-oriented portfolios, <strong className="text-emerald">MSFT is preferred</strong>.</p>
        </div>
      </motion.div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {[inputA, inputB].map((val, i) => (
          <div key={i} className="glass-card relative rounded-2xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={val} onChange={(e) => i === 0 ? setInputA(e.target.value) : setInputB(e.target.value)}
              placeholder={`Search symbol ${i + 1}...`} className="w-full rounded-2xl bg-transparent py-3 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden">
        <div className="grid grid-cols-3 gap-px bg-border/30">
          <div className="bg-background/80 p-4"><p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Metric</p></div>
          <div className="bg-background/80 p-4 text-center"><p className="font-heading text-sm font-semibold">{DEMO.a.symbol}</p><p className="text-xs text-muted-foreground">{DEMO.a.name}</p></div>
          <div className="bg-background/80 p-4 text-center"><p className="font-heading text-sm font-semibold">{DEMO.b.symbol}</p><p className="text-xs text-muted-foreground">{DEMO.b.name}</p></div>
          {rows.map((row) => (
            <div key={row.label} className="contents">
              <div className="bg-background/50 p-4"><p className="text-sm text-muted-foreground">{row.label}</p></div>
              <div className={`bg-background/50 p-4 text-center ${row.t === "pos" ? "text-emerald" : row.t === "neg" ? "text-neg" : ""}`}><p className="text-sm font-medium tabular-nums">{String(row.a)}</p></div>
              <div className={`bg-background/50 p-4 text-center ${row.t === "pos" ? "text-emerald" : row.t === "neg" ? "text-neg" : ""}`}><p className="text-sm font-medium tabular-nums">{String(row.b)}</p></div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[DEMO.a, DEMO.b].map((item) => (
          <div key={item.symbol} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-heading text-sm font-semibold">{item.symbol}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${item.recommendation === "Strong Buy" ? "bg-emerald/15 text-emerald" : "bg-blue/15 text-blue"}`}>{item.recommendation}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(0.99 0 0 / 0.08)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(0.65 0.2 255)" strokeWidth="8"
                    strokeDasharray={`${(item.score / 100) * 264} 264`} className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="font-heading text-sm font-semibold">{item.score}</span></div>
              </div>
              <div className="text-xs text-muted-foreground"><p>AI Score</p><p className="text-foreground font-medium mt-0.5">{item.recommendation}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
