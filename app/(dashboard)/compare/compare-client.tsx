"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Search, Brain, TrendingUp, TrendingDown, Trophy, BarChart3, ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react"

const DEMO = {
  a: { symbol: "AAPL", name: "Apple Inc.", price: 178.20, change: 1.2, marketCap: "2.85T", pe: 28.5, eps: 6.25, revenue: "391B", dividend: 0.52, beta: 1.21, rsi: 54, recommendation: "Buy", score: 74 },
  b: { symbol: "MSFT", name: "Microsoft Corp.", price: 425.30, change: 0.8, marketCap: "3.16T", pe: 35.2, eps: 12.08, revenue: "245B", dividend: 0.72, beta: 0.91, rsi: 58, recommendation: "Strong Buy", score: 82 },
}

const ALL_SYMBOLS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "NVDA", name: "NVIDIA Corp." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "MSFT", name: "Microsoft Corp." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "AMD", name: "Advanced Micro Devices" },
]

function GlowCard({ children, className, glowColor = "oklch(0.55 0.18 255 / 0.15)" }: {
  children: React.ReactNode; className?: string; glowColor?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.006 }}
      transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.6 }}
      className="group relative transform-gpu"
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 blur-xl transition-all duration-500 group-hover:opacity-100"
        style={{ boxShadow: `0 0 48px 8px ${glowColor}` }}
      />
      <div className="relative glass-card overflow-hidden rounded-3xl">{children}</div>
    </motion.div>
  )
}

export function CompareClient() {
  const [inputA, setInputA] = useState("")
  const [inputB, setInputB] = useState("")
  const [showSuggestions, setShowSuggestions] = useState<"a" | "b" | null>(null)

  const rows = [
    { label: "Current Price", a: `$${DEMO.a.price}`, b: `$${DEMO.b.price}`, winner: DEMO.a.price > DEMO.b.price ? "a" : "b" as "a" | "b", barA: 50, barB: 50 },
    { label: "Change %", a: `${DEMO.a.change > 0 ? "+" : ""}${DEMO.a.change}%`, b: `${DEMO.b.change > 0 ? "+" : ""}${DEMO.b.change}%`, winner: DEMO.a.change > DEMO.b.change ? "a" : "b", barA: DEMO.a.change > DEMO.b.change ? 60 : 40, barB: DEMO.b.change > DEMO.a.change ? 60 : 40 },
    { label: "Market Cap", a: DEMO.a.marketCap, b: DEMO.b.marketCap, winner: "b", barA: 47, barB: 53 },
    { label: "P/E Ratio", a: `${DEMO.a.pe}`, b: `${DEMO.b.pe}`, winner: DEMO.a.pe < DEMO.b.pe ? "a" : "b", barA: 55, barB: 45 },
    { label: "EPS (TTM)", a: `$${DEMO.a.eps}`, b: `$${DEMO.b.eps}`, winner: DEMO.a.eps > DEMO.b.eps ? "a" : "b", barA: 40, barB: 60 },
    { label: "Revenue", a: DEMO.a.revenue, b: DEMO.b.revenue, winner: "a", barA: 55, barB: 45 },
    { label: "Dividend Yield", a: `${DEMO.a.dividend}%`, b: `${DEMO.b.dividend}%`, winner: DEMO.a.dividend > DEMO.b.dividend ? "a" : "b", barA: 45, barB: 55 },
    { label: "Beta", a: DEMO.a.beta, b: DEMO.b.beta, winner: "b", barA: 48, barB: 52 },
    { label: "RSI (14)", a: DEMO.a.rsi, b: DEMO.b.rsi, winner: DEMO.a.rsi > DEMO.b.rsi ? "a" : "b", barA: 48, barB: 52 },
  ]

  const getSuggestions = (input: string) =>
    ALL_SYMBOLS.filter(
      (s) => s.symbol.toLowerCase().includes(input.toLowerCase()) || s.name.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 5)

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="mb-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Compare Stocks</h1>
        <p className="mt-1 text-sm text-muted-foreground">Side-by-side comparison with AI-powered insights.</p>
      </motion.div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {[["a", inputA, setInputA] as const, ["b", inputB, setInputB] as const].map(([key, val, setter], i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 + i * 0.08 }}
            className="relative"
            onFocus={() => setShowSuggestions(key)}
            onBlur={() => setTimeout(() => setShowSuggestions(null), 200)}
          >
            <div className="glass-card flex items-center gap-3 rounded-2xl px-4 py-3">
              <div className={`flex h-7 w-7 items-center justify-center rounded-xl text-[11px] font-bold text-white ${i === 0 ? "bg-blue" : "bg-emerald"}`}>
                {i + 1}
              </div>
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={val} onChange={(e) => setter(e.target.value)} placeholder={`Search symbol ${i + 1}...`}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
              {val && (
                <button onClick={() => setter("")} className="text-muted-foreground/60 hover:text-foreground text-xs">Clear</button>
              )}
            </div>
            {showSuggestions === key && val && getSuggestions(val).length > 0 && (
              <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border/40 bg-background/95 p-2 shadow-2xl backdrop-blur-2xl"
              >
                {getSuggestions(val).map((s) => (
                  <button key={s.symbol} onMouseDown={() => setter(s.symbol)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="font-medium">{s.symbol}</span>
                    <span className="text-muted-foreground">{s.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <GlowCard glowColor="oklch(0.48 0.16 280 / 0.2)">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-violet" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">AI Recommendation</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="text-emerald">{DEMO.b.symbol}</strong> scores higher on growth metrics (Azure revenue growth at 28% YoY) while <strong className="text-blue">{DEMO.a.symbol}</strong> offers stronger value metrics and brand moat. For growth-oriented portfolios, <strong className="text-emerald">MSFT is preferred</strong>.
            </p>
          </div>
        </GlowCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-6"
      >
        <GlowCard glowColor="oklch(0.55 0.18 255 / 0.12)">
          <div className="p-6">
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 ${
                  rows.filter((r) => r.winner === "a").length > rows.filter((r) => r.winner === "b").length
                    ? "bg-blue/15" : "bg-blue/5"
                }`}>
                  <Trophy className={`h-3.5 w-3.5 ${rows.filter((r) => r.winner === "a").length > rows.filter((r) => r.winner === "b").length ? "text-blue" : "text-muted-foreground/30"}`} />
                  <span className={`text-xs font-medium ${rows.filter((r) => r.winner === "a").length > rows.filter((r) => r.winner === "b").length ? "text-blue" : "text-muted-foreground/50"}`}>
                    {rows.filter((r) => r.winner === "a").length} wins
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Metric</span>
              </div>
              <div className="text-center">
                <div className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 ${
                  rows.filter((r) => r.winner === "b").length > rows.filter((r) => r.winner === "a").length
                    ? "bg-emerald/15" : "bg-emerald/5"
                }`}>
                  <Trophy className={`h-3.5 w-3.5 ${rows.filter((r) => r.winner === "b").length > rows.filter((r) => r.winner === "a").length ? "text-emerald" : "text-muted-foreground/30"}`} />
                  <span className={`text-xs font-medium ${rows.filter((r) => r.winner === "b").length > rows.filter((r) => r.winner === "a").length ? "text-emerald" : "text-muted-foreground/50"}`}>
                    {rows.filter((r) => r.winner === "b").length} wins
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-5">
              {rows.map((row) => (
                <div key={row.label}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{row.label}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`font-medium tabular-nums flex items-center gap-1 ${row.winner === "a" ? "text-blue font-semibold" : "text-muted-foreground"}`}>
                        {row.winner === "a" && <span className="h-1.5 w-1.5 rounded-full bg-blue" />}
                        {String(row.a)}
                      </span>
                      <span className="text-muted-foreground/30">vs</span>
                      <span className={`font-medium tabular-nums flex items-center gap-1 ${row.winner === "b" ? "text-emerald font-semibold" : "text-muted-foreground"}`}>
                        {String(row.b)}
                        {row.winner === "b" && <span className="h-1.5 w-1.5 rounded-full bg-emerald" />}
                      </span>
                    </div>
                  </div>
                  <div className="relative flex h-6 items-center gap-1">
                    <div className="flex-1">
                      <motion.div
                        initial={{ width: 0 }} whileInView={{ width: `${row.barA}%` }} viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        className={`h-full rounded-l-full ${
                          row.winner === "a"
                            ? "bg-gradient-to-r from-blue/50 to-blue/20"
                            : row.winner === "b"
                            ? "bg-gradient-to-r from-emerald/20 to-transparent"
                            : "bg-white/5"
                        }`}
                      />
                    </div>
                    <div className={`h-6 w-0.5 rounded-full ${row.winner === "a" ? "bg-blue" : row.winner === "b" ? "bg-emerald" : "bg-white/10"}`} />
                    <div className="flex-1">
                      <motion.div
                        initial={{ width: 0 }} whileInView={{ width: `${row.barB}%` }} viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                        className={`ml-auto h-full rounded-r-full ${
                          row.winner === "b"
                            ? "bg-gradient-to-l from-emerald/50 to-emerald/20"
                            : row.winner === "a"
                            ? "bg-gradient-to-l from-blue/20 to-transparent"
                            : "bg-white/5"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlowCard>
      </motion.div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[DEMO.a, DEMO.b].map((item, idx) => (
          <motion.div
            key={item.symbol}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 + idx * 0.1 }}
          >
            <GlowCard glowColor={idx === 0 ? "oklch(0.55 0.18 255 / 0.2)" : "oklch(0.62 0.16 168 / 0.2)"}>
              <div className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl font-heading text-sm font-bold text-white ${idx === 0 ? "bg-blue" : "bg-emerald"}`}>
                      {item.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-heading text-sm font-semibold">{item.symbol}</p>
                      <p className="text-xs text-muted-foreground/70">{item.name}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    item.recommendation === "Strong Buy" ? "bg-emerald/15 text-emerald" : "bg-blue/15 text-blue"
                  }`}>
                    {item.recommendation}
                  </span>
                </div>
                <div className="mb-5 flex items-center gap-5">
                  <div className="relative h-20 w-20 shrink-0">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(0.99 0 0 / 0.08)" strokeWidth="8" />
                      <motion.circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke={idx === 0 ? "oklch(0.55 0.18 255)" : "oklch(0.62 0.16 168)"}
                        strokeWidth="8"
                        strokeDasharray={`${(item.score / 100) * 264} 264`}
                        initial={{ strokeDasharray: "0 264" }}
                        animate={{ strokeDasharray: `${(item.score / 100) * 264} 264` }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-heading text-lg font-semibold">{item.score}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">AI Score</p>
                    <p className="text-sm font-medium text-foreground">{item.recommendation}</p>
                    <div className="flex items-center gap-1.5 text-xs">
                      {item.change >= 0
                        ? <><ArrowUpRight className="h-3.5 w-3.5 text-emerald" /><span className="text-emerald font-medium">+{item.change}%</span></>
                        : <><ArrowDownRight className="h-3.5 w-3.5 text-neg" /><span className="text-neg font-medium">{item.change}%</span></>
                      }
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/[0.03] p-3 dark:bg-white/[0.03]">
                  {[
                    { label: "P/E", value: item.pe },
                    { label: "EPS", value: `$${item.eps}` },
                    { label: "RSI", value: item.rsi },
                  ].map((m) => (
                    <div key={m.label} className="text-center">
                      <p className="text-[10px] text-muted-foreground/60">{m.label}</p>
                      <p className="text-xs font-semibold tabular-nums">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
