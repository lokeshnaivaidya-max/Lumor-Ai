"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "motion/react"
import { Send, Bot, User, Sparkles, Trash2 } from "lucide-react"

type Message = { role: "user" | "assistant"; content: string; timestamp: number }

const SUGGESTIONS = ["What's the outlook for NVDA?", "Compare AAPL and MSFT", "Explain RSI indicator for beginners", "How do I diversify my portfolio?"]

export function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return
    setMessages((prev) => [...prev, { role: "user", content: input.trim(), timestamp: Date.now() }])
    setInput("")
    setLoading(true)
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: genResponse(input.trim()), timestamp: Date.now() }])
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between border-b border-border/40 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet/10 p-2"><Bot className="h-5 w-5 text-violet" /></div>
          <div><h1 className="font-heading text-sm font-medium">AI Assistant</h1><p className="text-xs text-muted-foreground">Ask anything about markets</p></div>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="glass-card flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <Trash2 className="h-3 w-3" />Clear
          </button>
        )}
      </motion.div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="mb-6 rounded-2xl bg-violet/10 p-4"><Sparkles className="h-8 w-8 text-violet" /></div>
            <h2 className="font-heading text-lg font-medium">How can I help you?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ask about stocks, indicators, or portfolio strategy.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setInput(s)}
                  className="glass-card rounded-full px-4 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
              >
                {m.role === "assistant" && <div className="mt-0.5 shrink-0 rounded-xl bg-violet/10 p-2"><Bot className="h-4 w-4 text-violet" /></div>}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-primary/10 text-foreground" : "glass-card"}`}>
                  <p className="text-sm leading-relaxed">{m.content}</p>
                </div>
                {m.role === "user" && <div className="mt-0.5 shrink-0 rounded-xl bg-primary/10 p-2"><User className="h-4 w-4 text-primary" /></div>}
              </motion.div>
            ))}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="rounded-xl bg-violet/10 p-2"><Bot className="h-4 w-4 text-violet" /></div>
                <div className="glass-card max-w-[80%] rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-border/40 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="glass-card relative flex-1 rounded-2xl">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Ask Lumora anything..."
              className="w-full rounded-2xl bg-transparent py-3 pl-4 pr-12 text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <button onClick={handleSend} disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-primary to-violet p-2 text-white transition-opacity disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function genResponse(q: string): string {
  const l = q.toLowerCase()
  if (l.includes("nvda") || l.includes("nvidia")) return "**NVIDIA (NVDA)** continues to show strong momentum in the AI chip space. With RSI at 62, the stock is in neutral-bullish territory. Key support at $845, resistance at $920. The company's data center revenue grew 154% YoY, and with the upcoming Blackwell architecture launch, analyst sentiment remains overwhelmingly positive. However, valuation at 35x forward P/E suggests elevated expectations — any miss could trigger a correction."
  if (l.includes("aapl") && l.includes("msft") && l.includes("compare")) return "**AAPL vs MSFT — Quick Comparison:**\n\n**Apple (AAPL):** P/E 28x | Revenue growth 2% YoY | Services segment growing 14% | Strong brand loyalty, but hardware cyclicality remains a risk.\n\n**Microsoft (MSFT):** P/E 35x | Revenue growth 16% YoY | Azure growing 28% | OpenAI partnership gives AI leadership. More diversified revenue base.\n\n**Verdict:** MSFT has stronger growth drivers, while AAPL offers defensive quality."
  if (l.includes("rsi")) return "The **Relative Strength Index (RSI)** is a momentum oscillator that measures the speed and magnitude of recent price changes. It ranges from 0 to 100. Traditionally, RSI above 70 indicates overbought conditions (potential sell signal), while below 30 suggests oversold (potential buy signal). For beginners: think of it as a 'crowdedness' meter — when too many people have bought, a reversal may be due."
  if (l.includes("diversify") || l.includes("portfolio")) return "A well-diversified portfolio typically includes exposure to **different sectors, asset classes, and geographies**. A common starting point is the 60/40 split (60% equities, 40% bonds). Consider adding exposure to:\n- International markets (emerging + developed)\n- Different sectors (tech, healthcare, energy, financials)\n- Asset classes (bonds, REITs, commodities)\n- Various market caps (large, mid, small)"
  return "Great question! Based on current market data, I'd need to run a full analysis to give you accurate insights. Could you specify a particular stock or topic you're interested in? I can help with company analysis, technical indicators, market trends, portfolio strategy, or explaining financial concepts."
}
