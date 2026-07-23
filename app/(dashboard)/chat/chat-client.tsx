"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import ReactMarkdown from "react-markdown"
import {
  Send,
  Plus,
  Trash2,
  User,
  Loader2,
  MessageSquare,
  Search,
  X,
  Paperclip,
  Activity,
  Check,
  CheckCircle2,
  StopCircle,
  Square,
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
} from "lucide-react"
import { getConversations, getMessages, createConversation, deleteConversation } from "@/app/actions/chat"
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendBrowserNotification,
} from "@/lib/notifications"

type Conversation = { id: number; title: string; updatedAt: string; preview?: string | null; messageCount?: number }
type Msg = { id: string; role: "user" | "assistant"; content: string; isComplete?: boolean; thinkingSteps?: string[] }

type SearchHit = { symbol: string; name: string; exchange?: string; type?: string }

const SUGGESTIONS = [
  "Analyze HDFCBANK.NS",
  "Best swing trade setup",
  "Explain RSI & MACD",
  "Key Support & Resistance",
]

const THINKING_STEPS = [
  "Reading Live Market Data",
  "Technical Indicators Processed",
  "News Sentiment Analyzed",
  "Risk Assessment Complete",
  "Generating Institutional Recommendation...",
]

function ThinkingSequence({
  currentStep,
  isFinished,
}: {
  currentStep: number // 1 to 5
  isFinished: boolean
}) {
  const [expanded, setExpanded] = useState(!isFinished)

  useEffect(() => {
    if (isFinished) {
      const t = setTimeout(() => setExpanded(false), 800)
      return () => clearTimeout(t)
    } else {
      setExpanded(true)
    }
  }, [isFinished])

  return (
    <div className="my-2 rounded-2xl border border-gold/20 bg-foreground/[0.02] p-3 text-xs shadow-inner">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex cursor-pointer items-center justify-between font-mono font-medium text-gold select-none"
      >
        <div className="flex items-center gap-2">
          {isFinished ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <motion.span
              className="h-2.5 w-2.5 rounded-full bg-gold"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
          <span className="tracking-wide">
            {isFinished ? "Institutional Analysis Complete" : "AI Thinking Sequence"}
          </span>
        </div>
        <button type="button" className="text-muted-foreground hover:text-foreground">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-2.5 space-y-1.5 overflow-hidden border-t border-foreground/10 pt-2 font-mono text-[11px]"
          >
            {THINKING_STEPS.map((stepLabel, idx) => {
              const stepNum = idx + 1
              const isDone = isFinished || currentStep > stepNum
              const isCurrent = !isFinished && currentStep === stepNum
              const isPending = !isFinished && currentStep < stepNum

              return (
                <div key={stepLabel} className="flex items-center gap-2">
                  {isDone ? (
                    <span className="font-bold text-emerald-400">✓</span>
                  ) : isCurrent ? (
                    <span className="animate-pulse text-gold">●</span>
                  ) : (
                    <span className="text-muted-foreground/40">○</span>
                  )}
                  <span
                    className={
                      isDone
                        ? "text-foreground/90 font-medium"
                        : isCurrent
                        ? "text-gold font-bold animate-pulse"
                        : "text-muted-foreground/50"
                    }
                  >
                    {stepLabel}
                  </span>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Markdown({ content }: { content: string }) {
  return (
    <div className="md-prose">
      <ReactMarkdown
        components={{
          table({ children }) {
            return (
              <div className="md-table-wrap my-3 overflow-x-auto rounded-xl border border-[var(--line)] bg-foreground/[0.01]">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>{children}</table>
              </div>
            )
          },
          th({ children }) {
            return (
              <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--line-strong)", background: "var(--surface-alt)", color: "var(--text-secondary)", fontWeight: 600 }}>
                {children}
              </th>
            )
          },
          td({ children }) {
            return <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--line)" }}>{children}</td>
          },
          code({ className, children, ...props }: any) {
            const inline = !className
            if (inline) return <code className="md-inline">{children}</code>
            return (
              <pre className="md-pre my-2 overflow-x-auto rounded-xl border border-[var(--line)] bg-foreground/[0.03] p-3 text-xs font-mono">
                <code className={className} {...props}>{children}</code>
              </pre>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export function ChatClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [thinkingStep, setThinkingStep] = useState<number>(0) // 0 means not thinking
  const [thinkingFinished, setThinkingFinished] = useState(false)
  const [activeAssistantId, setActiveAssistantId] = useState<string | null>(null)

  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // AbortController ref for interrupting generation
  const abortControllerRef = useRef<AbortController | null>(null)
  const isInterruptedRef = useRef(false)

  // Typing animation refs
  const fullTextBufferRef = useRef<string>("")
  const displayedTextRef = useRef<string>("")
  const animationFrameRef = useRef<number | null>(null)

  // Push notifications state
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("unsupported")

  // Symbol / market context.
  const [symbol, setSymbol] = useState<string>("")
  const [timeframe, setTimeframe] = useState<string>("swing")
  const [quote, setQuote] = useState<{ price: number; changePercent: number; marketState: string; currency: string } | null>(null)
  const [symbolOpen, setSymbolOpen] = useState(false)
  const [symbolQ, setSymbolQ] = useState("")
  const [hits, setHits] = useState<SearchHit[]>([])
  const [searching, setSearching] = useState(false)

  // User manual scroll detection
  const isUserScrolledUpRef = useRef(false)

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const isBottom = scrollHeight - scrollTop - clientHeight < 80
    isUserScrolledUpRef.current = !isBottom
  }

  const scrollToBottom = useCallback((smooth = true) => {
    if (isUserScrolledUpRef.current) return
    endRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" })
  }, [])

  useEffect(() => {
    setPushPermission(getNotificationPermission())
  }, [])

  const handleTogglePush = async () => {
    const res = await requestNotificationPermission()
    setPushPermission(res)
  }

  const loadConversations = useCallback(async () => {
    try { setConversations(await getConversations()) } catch { /* ignore */ }
  }, [])

  // Hydrate from URL (?c=conversationId&symbol=...).
  useEffect(() => {
    const c = searchParams.get("c")
    const s = searchParams.get("symbol")
    if (c) setActiveId(Number(c))
    if (s) {
      setSymbol(s)
      fetchQuote(s)
    }
    loadConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchQuote(sym: string) {
    try {
      const res = await fetch(`/api/quote?symbols=${encodeURIComponent(sym)}`)
      const data = await res.json()
      const q = data.quotes?.[0]
      if (q) setQuote({ price: q.price, changePercent: q.changePercent, marketState: q.marketState, currency: q.currency })
    } catch { /* ignore */ }
  }

  useEffect(() => {
    async function load() {
      if (!activeId) { setMessages([]); return }
      setLoadingMsgs(true)
      try {
        const msgs = await getMessages(activeId)
        setMessages(
          msgs.map((m) => ({
            id: String(m.id),
            role: m.role as "user" | "assistant",
            content: m.content,
            isComplete: true,
          }))
        )
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }, 50)
      } finally { setLoadingMsgs(false) }
    }
    load()
  }, [activeId])

  function syncUrl(next: { conv?: number | null; sym?: string }) {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    if (next.conv !== undefined) {
      if (next.conv == null) params.delete("c")
      else params.set("c", String(next.conv))
    }
    if (next.sym !== undefined) {
      if (!next.sym) params.delete("symbol")
      else params.set("symbol", next.sym)
    }
    router.replace(`/chat?${params.toString()}`, { scroll: false })
  }

  async function selectConversation(id: number) {
    if (streaming) handleStopGenerating()
    setError(null)
    setActiveId(id)
    syncUrl({ conv: id })
  }

  async function startNew() {
    if (streaming) handleStopGenerating()
    setError(null)
    setActiveId(null)
    setMessages([])
    syncUrl({ conv: null })
  }

  async function handleDelete(id: number) {
    try {
      await deleteConversation(id)
      if (activeId === id) { setActiveId(null); setMessages([]); syncUrl({ conv: null }) }
      await loadConversations()
    } catch (e: any) { setError(e?.message || "Failed to delete") }
  }

  async function pickSymbol(hit: SearchHit) {
    setSymbol(hit.symbol)
    setSymbolOpen(false)
    setSymbolQ("")
    setHits([])
    fetchQuote(hit.symbol)
    syncUrl({ sym: hit.symbol })
  }

  useEffect(() => {
    if (!symbolQ.trim()) { setHits([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(symbolQ)}`)
        const data = await res.json()
        setHits((data.results || []).slice(0, 6))
      } catch { setHits([]) } finally { setSearching(false) }
    }, 250)
    return () => clearTimeout(t)
  }, [symbolQ])

  // Stop / Interrupt generation function
  const handleStopGenerating = useCallback(() => {
    isInterruptedRef.current = true
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setStreaming(false)
    setThinkingStep(0)
    setThinkingFinished(true)

    if (activeAssistantId) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === activeAssistantId
            ? { ...m, content: displayedTextRef.current || m.content || "[Generation stopped]", isComplete: true }
            : m
        )
      )
    }
  }, [activeAssistantId])

  // Realistic token typing loop
  const startTypingEngine = (assistantId: string, onComplete: () => void) => {
    let lastTime = performance.now()

    const step = (now: number) => {
      if (isInterruptedRef.current) return

      const delta = now - lastTime
      const currentLen = displayedTextRef.current.length
      const targetLen = fullTextBufferRef.current.length

      if (currentLen < targetLen) {
        // Calculate characters to advance based on remaining lag
        const remaining = targetLen - currentLen
        const charsToAdd = Math.max(1, Math.min(6, Math.floor(remaining / 3)))

        const nextChars = fullTextBufferRef.current.slice(currentLen, currentLen + charsToAdd)
        displayedTextRef.current += nextChars

        // Check for punctuation pauses
        const lastChar = nextChars[nextChars.length - 1]
        const isPunctuation = [".", "!", "?", "\n"].includes(lastChar)
        const delay = isPunctuation ? 90 : 16

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: displayedTextRef.current } : m))
        )
        scrollToBottom(false)

        setTimeout(() => {
          if (!isInterruptedRef.current) {
            animationFrameRef.current = requestAnimationFrame(step)
          }
        }, delay)
      } else {
        // Equal length reached
        if (streaming) {
          // Still receiving SSE tokens, wait for buffer updates
          animationFrameRef.current = requestAnimationFrame(step)
        } else {
          // Finished receiving & finished typing
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: displayedTextRef.current, isComplete: true } : m))
          )
          scrollToBottom(true)
          onComplete()
        }
      }
      lastTime = now
    }

    animationFrameRef.current = requestAnimationFrame(step)
  }

  async function send(text: string) {
    const content = text.trim()
    if (!content || streaming) return
    setError(null)
    isInterruptedRef.current = false
    isUserScrolledUpRef.current = false

    let convId = activeId
    if (convId == null) {
      const conv = await createConversation(content)
      convId = conv.id
      setActiveId(convId)
      syncUrl({ conv: convId })
      setConversations((prev) => [
        { id: conv.id, title: conv.title, updatedAt: new Date(conv.updatedAt).toISOString() },
        ...prev,
      ])
    }

    const history = messages
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content, isComplete: true }])
    setInput("")
    setStreaming(true)
    setThinkingStep(1)
    setThinkingFinished(false)

    const assistantId = `a-${Date.now()}`
    setActiveAssistantId(assistantId)
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", isComplete: false }])

    fullTextBufferRef.current = ""
    displayedTextRef.current = ""

    // Create fresh AbortController
    const controller = new AbortController()
    abortControllerRef.current = controller

    // Timer fallback for thinking sequence steps
    let currentStepTimer = 1
    const stepInterval = setInterval(() => {
      if (currentStepTimer < 5) {
        currentStepTimer += 1
        setThinkingStep(currentStepTimer)
      }
    }, 700)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId: convId, message: content, history, symbol: symbol || undefined, timeframe }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "")
        throw new Error(errText || `Request failed (${res.status})`)
      }

      // Start token typing engine
      startTypingEngine(assistantId, () => {
        // On typing complete
        sendBrowserNotification("Lumora AI Analysis Ready", {
          body: displayedTextRef.current.slice(0, 100) + "…",
          requireBackground: true,
        })
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        if (isInterruptedRef.current) break
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        let idx: number
        while ((idx = buffer.indexOf("\n\n")) >= 0) {
          const chunk = buffer.slice(0, idx)
          buffer = buffer.slice(idx + 2)
          const dataLine = chunk.split("\n").find((l) => l.startsWith("data:"))
          if (!dataLine) continue
          const data = dataLine.slice(5).trim()
          if (data === "[DONE]") continue

          try {
            const evt = JSON.parse(data) as { type: string; token?: string; step?: number }
            if (evt.type === "thinking" && typeof evt.step === "number") {
              setThinkingStep(evt.step)
            } else if (evt.type === "token" && evt.token) {
              clearInterval(stepInterval)
              setThinkingStep(5)
              setThinkingFinished(true)
              fullTextBufferRef.current += evt.token
            }
          } catch { /* ignore */ }
        }
      }

      clearInterval(stepInterval)
      setThinkingFinished(true)
      await loadConversations()
    } catch (e: any) {
      clearInterval(stepInterval)
      if (e?.name === "AbortError" || isInterruptedRef.current) {
        // Handled cleanly by stop generating
        return
      }
      setError(e?.message || "Something went wrong")
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
    } finally {
      clearInterval(stepInterval)
      setStreaming(false)
      abortControllerRef.current = null
    }
  }

  const dataSources = symbol ? ["Live quote", "Technical indicators", "Recent news", "AI analysis"] : []

  return (
    <div className="relative flex h-[calc(100vh-7rem)] gap-0 md:gap-4 select-none">
      {/* Conversation history */}
      <div className="glass hidden w-[20%] min-w-[220px] max-w-[300px] shrink-0 flex-col gap-3 rounded-3xl p-3 md:flex">
        <button onClick={startNew} className="lm-btn lm-btn--gold flex items-center justify-center gap-2 px-3 py-2.5 text-xs">
          <Plus className="h-3.5 w-3.5" />New chat
        </button>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="meta px-2 py-3">No conversations yet.</p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={`group mb-1 flex items-center justify-between rounded-2xl px-1 transition-colors duration-200 ${
                  activeId === c.id ? "bg-gold/10" : "hover:bg-foreground/[0.04]"
                }`}
              >
                <button
                  onClick={() => selectConversation(c.id)}
                  className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl px-3 py-2 text-left text-sm transition-colors ${
                    activeId === c.id ? "text-gold font-medium" : "text-[var(--text-secondary)]"
                  }`}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                    style={activeId === c.id ? { background: "var(--gold-glow)", color: "var(--gold)" } : { background: "var(--surface)", color: "var(--text-tertiary)" }}
                  >
                    <MessageSquare className="h-3 w-3" />
                  </span>
                  <span className="truncate">{c.title}</span>
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  aria-label="Delete conversation"
                  className="mr-1.5 rounded-lg p-1.5 opacity-0 transition-all hover:bg-foreground/[0.06] hover:text-[var(--neg)] group-hover:opacity-100"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main */}
      <div className="glass-card flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3 lg:px-5" style={{ borderColor: "var(--line)" }}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--gold-glow)", color: "var(--gold)" }}>
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="body font-semibold">Lumora AI</p>
              <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 font-mono text-[10px] font-bold text-gold uppercase">
                <Sparkles className="h-2.5 w-2.5" /> Streaming Engine
              </span>
            </div>
            <p className="meta">Grounded in real market data</p>
          </div>

          {/* Browser push notification toggle */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleTogglePush}
              title={pushPermission === "granted" ? "Browser Push Notifications Active" : "Enable Browser Notifications"}
              className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                pushPermission === "granted"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-foreground/15 bg-foreground/[0.03] text-muted-foreground hover:text-foreground"
              }`}
            >
              {pushPermission === "granted" ? <Bell className="h-3.5 w-3.5 text-emerald-400" /> : <BellOff className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">
                {pushPermission === "granted" ? "Push Active" : "Enable Alerts"}
              </span>
            </button>

            {/* Symbol selector */}
            <div className="relative">
              <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5" style={{ border: "1px solid var(--line)", background: "var(--surface)" }}>
                <Search className="h-3.5 w-3.5" style={{ color: "var(--text-tertiary)" }} />
                <input
                  value={symbolQ}
                  onChange={(e) => { setSymbolQ(e.target.value); setSymbolOpen(true) }}
                  onFocus={() => setSymbolOpen(true)}
                  placeholder={symbol || "Pick a symbol"}
                  className="w-24 sm:w-28 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 select-text"
                  style={{ color: "var(--text-primary)" }}
                />
                {symbol && (
                  <button onClick={() => { setSymbol(""); syncUrl({ sym: "" }); setQuote(null) }} aria-label="Clear symbol" className="p-0.5">
                    <X className="h-3.5 w-3.5" style={{ color: "var(--text-tertiary)" }} />
                  </button>
                )}
              </div>
              <AnimatePresence>
                {symbolOpen && (symbolQ.trim() || hits.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="glass absolute right-0 z-50 mt-1.5 w-64 overflow-hidden rounded-2xl shadow-2xl"
                  >
                    {searching ? (
                      <p className="px-3 py-2 text-xs" style={{ color: "var(--text-tertiary)" }}>Searching…</p>
                    ) : hits.length === 0 ? (
                      <p className="px-3 py-2 text-xs" style={{ color: "var(--text-tertiary)" }}>No matches</p>
                    ) : (
                      hits.map((h) => (
                        <button
                          key={h.symbol}
                          onClick={() => pickSymbol(h)}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-foreground/[0.04]"
                        >
                          <span className="font-mono text-xs font-semibold">{h.symbol}</span>
                          <span className="truncate pl-2 text-xs" style={{ color: "var(--text-tertiary)" }}>{h.name}</span>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {symbol && (
            <div className="hidden sm:flex items-center gap-3 border-l border-foreground/10 pl-3">
              {quote && (
                <>
                  <div className="text-right">
                    <p className="font-mono text-xs font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                      {quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {quote.currency}
                    </p>
                    <p className="font-mono text-[10px] tabular-nums" style={{ color: quote.changePercent >= 0 ? "var(--pos)" : "var(--neg)" }}>
                      {quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%
                    </p>
                  </div>
                  <span
                    className="chip rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                    style={{
                      color: quote.marketState === "REGULAR" ? "var(--pos)" : "var(--text-tertiary)",
                      background: quote.marketState === "REGULAR" ? "var(--pos-glow)" : "var(--surface)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    {quote.marketState}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Data source chips */}
        {dataSources.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-b px-4 py-2 lg:px-5" style={{ borderColor: "var(--line)" }}>
            <span className="meta mr-1" style={{ color: "var(--text-tertiary)" }}>Connected:</span>
            {dataSources.map((s) => (
              <span key={s} className="chip chip-gold flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]">
                <Activity className="h-2.5 w-2.5" />{s}
              </span>
            ))}
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 space-y-5 overflow-y-auto px-3 py-5 lg:px-6 select-text">
          {loadingMsgs ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--text-tertiary)" }} /></div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--gold-glow)", color: "var(--gold)" }}>
                <MessageSquare className="h-7 w-7" />
              </div>
              <p className="heading-sm">Ask Lumora about the markets</p>
              <p className="body mt-1.5" style={{ color: "var(--text-tertiary)" }}>Get grounded insights on stocks, strategies, and investing.</p>
              <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => setInput(s)} className="glass-card group rounded-2xl px-4 py-3 text-left text-xs transition-all duration-200 hover:border-gold/30" style={{ color: "var(--text-secondary)", border: "1px solid var(--line)" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isLatestAssistant = m.role === "assistant" && idx === messages.length - 1
              const showThinking = isLatestAssistant && streaming && !m.content

              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={m.role === "user" ? { background: "var(--gold-glow)", color: "var(--gold)" } : { background: "var(--surface)", color: "var(--text-tertiary)", border: "1px solid var(--line)" }}>
                    {m.role === "user" ? <User className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                  </div>
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${m.role === "user" ? "" : "border"}`}
                    style={m.role === "user" ? { background: "var(--gold-glow)", color: "var(--text-primary)" } : { background: "var(--surface)", borderColor: "var(--line)", color: "var(--text-primary)" }}
                  >
                    {m.role === "assistant" && (
                      <ThinkingSequence
                        currentStep={thinkingStep}
                        isFinished={m.isComplete || (m.content.length > 0 && !streaming)}
                      />
                    )}

                    {m.content ? (
                      <div>
                        <Markdown content={m.content} />
                        {m.role === "assistant" && m.isComplete && (
                          <div className="mt-3 flex items-center justify-between border-t border-foreground/10 pt-2 text-[10px] font-mono text-muted-foreground/80">
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                              <ShieldCheck className="h-3 w-3" /> Grounded Analysis Complete
                            </span>
                            <span>Educational only</span>
                          </div>
                        )}
                      </div>
                    ) : showThinking ? (
                      <div className="py-1 text-xs text-muted-foreground font-mono italic">
                        Processing market model context...
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
          <div ref={endRef} />
        </div>

        {error && <p className="meta px-5 pb-1 text-rose-400">{error}</p>}

        {/* Suggested prompts - only shown before starting conversation */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-2 lg:px-5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                disabled={streaming}
                className="chip rounded-full px-3 py-1.5 text-[11px] transition-all duration-200 hover:bg-gold/10 hover:text-gold disabled:opacity-50"
                style={{ border: "1px solid var(--line)" }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Composer */}
        <div className="border-t p-3" style={{ borderColor: "var(--line)" }}>
          <div className="glass flex items-end gap-2 rounded-2xl px-3 py-2" style={{ border: "1px solid var(--line)" }}>
            <button
              type="button"
              aria-label="Attach"
              className="mb-0.5 shrink-0 rounded-lg p-1.5 transition-colors hover:bg-foreground/[0.06]"
              style={{ color: "var(--text-tertiary)" }}
              onClick={() => setError("Attachments are not supported yet.")}
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input) }
              }}
              rows={1}
              disabled={streaming}
              placeholder={streaming ? "Lumora AI is analyzing..." : symbol ? `Ask about ${symbol}…` : "Message Lumora…"}
              className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground/50 select-text disabled:opacity-60"
              style={{ color: "var(--text-primary)" }}
            />
            {input.trim() && !streaming && (
              <button
                type="button"
                aria-label="Clear input"
                onClick={() => setInput("")}
                className="mb-0.5 shrink-0 rounded-lg p-1.5 transition-colors hover:bg-foreground/[0.06] hover:text-[var(--neg)]"
                style={{ color: "var(--text-tertiary)" }}
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {streaming ? (
              <button
                type="button"
                onClick={handleStopGenerating}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={() => send(input)}
                disabled={!input.trim()}
                className="lm-btn lm-btn--gold flex shrink-0 items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-40"
                style={{ boxShadow: "0 4px 20px -6px var(--gold-glow)" }}
              >
                <Send className="h-4 w-4" />
                Send
              </button>
            )}
          </div>
          <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-muted-foreground/60">
            <span>For informational purposes only. Not financial advice.</span>
            <span className="hidden sm:inline">Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  )
}
