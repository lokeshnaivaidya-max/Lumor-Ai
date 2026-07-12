"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Send, Bot, User, Sparkles, Trash2, ArrowDown, Brain, Cpu, MessageSquare } from "lucide-react"

type Message = { role: "user" | "assistant"; content: string; timestamp: number }

const SUGGESTIONS = ["What's the outlook for NVDA?", "Compare AAPL and MSFT", "Explain RSI indicator for beginners", "How do I diversify my portfolio?"]

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="mt-1 shrink-0">
        <div className="rounded-xl bg-gradient-to-br from-violet/15 to-blue/15 p-2 shadow-sm">
          <Bot className="h-4 w-4 text-violet" />
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="glass-card rounded-2xl rounded-tl-md border border-border/20 px-5 py-4 shadow-sm"
      >
        <div className="flex items-center gap-2">
          {[0, 0.15, 0.3].map((d, i) => (
            <motion.span
              key={i}
              className="h-2 w-2 rounded-full bg-violet/60"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: d }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function MessageBubble({ message, index }: { message: Message; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
      className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
    >
      {message.role === "assistant" && (
        <div className="mt-1 shrink-0">
          <div className="rounded-xl bg-gradient-to-br from-violet/15 to-blue/15 p-2.5 shadow-sm">
            <Bot className="h-4 w-4 text-violet" />
          </div>
        </div>
      )}
      <div className={`max-w-[80%] ${
        message.role === "user"
          ? "rounded-2xl rounded-tr-md bg-gradient-to-br from-blue/10 via-violet/10 to-blue/10 px-4 py-3 shadow-sm"
          : "glass-card rounded-2xl rounded-tl-md border border-border/20 px-4 py-3 shadow-sm"
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground/50">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {message.role === "assistant" && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
              <Brain className="h-2.5 w-2.5" />Lumora AI
            </span>
          )}
        </div>
      </div>
      {message.role === "user" && (
        <div className="mt-1 shrink-0">
          <div className="rounded-xl bg-gradient-to-br from-primary to-violet p-2.5 shadow-sm shadow-violet/20">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
    </motion.div>
  )
}

export function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, loading])

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
    <div className="relative flex h-[calc(100vh-4rem)] flex-col">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between border-b border-border/30 bg-background/70 px-6 py-3.5 backdrop-blur-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="rounded-2xl bg-gradient-to-br from-violet to-blue p-2.5 shadow-lg shadow-violet/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald shadow-lg shadow-emerald/40"
            />
          </div>
          <div>
            <h1 className="font-heading text-sm font-medium">AI Assistant</h1>
            <p className="text-xs text-muted-foreground">Ask anything about markets</p>
          </div>
        </div>
        <AnimatePresence>
          {messages.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setMessages([])}
              className="glass-card flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Trash2 className="h-3 w-3" />Clear
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full flex-col items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
                className="mb-6 rounded-3xl bg-gradient-to-br from-violet/10 via-blue/5 to-violet/10 p-5 shadow-xl shadow-violet/5"
              >
                <Sparkles className="h-10 w-10 text-violet" />
              </motion.div>
              <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-heading text-lg font-medium">How can I help you?</motion.h2>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-1 text-sm text-muted-foreground">Ask about stocks, indicators, or portfolio strategy.</motion.p>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <motion.button
                    key={s}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setInput(s); inputRef.current?.focus() }}
                    className="glass-card rounded-2xl px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {s}
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-3xl space-y-5">
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} index={i} />
              ))}
              <AnimatePresence>
                {loading && <TypingIndicator />}
              </AnimatePresence>
              <div ref={bottomRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-border/30 bg-background/70 px-6 py-4 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="glass-card relative flex-1 rounded-2xl shadow-lg shadow-black/5">
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Ask Lumora anything..."
              className="w-full rounded-2xl bg-transparent py-3.5 pl-4 pr-14 text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
              <motion.button
                onClick={handleSend} disabled={!input.trim() || loading}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="rounded-xl bg-gradient-to-r from-violet to-blue p-2.5 text-white shadow-lg shadow-violet/20 transition-opacity disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </motion.button>
            </div>
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
