"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import ReactMarkdown from "react-markdown"
import { Send, Plus, Trash2, User, Loader2, MessageSquare, Search, X, Paperclip, BarChart3, TrendingUp, Newspaper, Activity } from "lucide-react"
import { getConversations, getMessages, createConversation, deleteConversation } from "@/app/actions/chat"

type Conversation = { id: number; title: string; updatedAt: string; preview?: string | null; messageCount?: number }
type Msg = { id: string; role: "user" | "assistant"; content: string }

type SearchHit = { symbol: string; name: string; exchange?: string; type?: string }

const SUGGESTIONS = [
  "Analyze HDFCBANK.NS",
  "Best swing trade setup",
  "Explain RSI & MACD",
  "Key Support & Resistance",
]

const TYPING_STAGES = [
  "Reading live market data…",
  "Fetching technical indicators…",
  "Analyzing recent news…",
  "Generating investment insights…",
]

function TypingIndicator() {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStage((s) => Math.min(s + 1, TYPING_STAGES.length - 1)), 800)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex flex-col gap-2 py-1">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2 w-2 rounded-full bg-gold"
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </span>
        <span className="text-xs font-semibold text-gold">AI Processing</span>
      </div>
      <p className="text-xs text-muted-foreground transition-all duration-300">{TYPING_STAGES[stage]}</p>
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
              <div className="md-table-wrap" style={{ overflowX: "auto", borderRadius: 12, border: "1px solid var(--line)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>{children}</table>
              </div>
            )
          },
          th({ children }) {
            return <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--line-strong)", background: "var(--surface-alt)", color: "var(--text-secondary)", fontWeight: 600 }}>{children}</th>
          },
          td({ children }) {
            return <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--line)" }}>{children}</td>
          },
          code({ className, children, ...props }: any) {
            const inline = !className
            if (inline) return <code className="md-inline">{children}</code>
            return (
              <pre className="md-pre" style={{ border: "1px solid var(--line)", borderRadius: 12 }}>
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
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // Symbol / market context.
  const [symbol, setSymbol] = useState<string>("")
  const [timeframe, setTimeframe] = useState<string>("swing")
  const [quote, setQuote] = useState<{ price: number; changePercent: number; marketState: string; currency: string } | null>(null)
  const [symbolOpen, setSymbolOpen] = useState(false)
  const [symbolQ, setSymbolQ] = useState("")
  const [hits, setHits] = useState<SearchHit[]>([])
  const [searching, setSearching] = useState(false)

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
        setMessages(msgs.map((m) => ({ id: String(m.id), role: m.role as "user" | "assistant", content: m.content })))
        setTimeout(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "auto" }) }, 0)
      } finally { setLoadingMsgs(false) }
    }
    load()
  }, [activeId])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, streaming])

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
    setError(null)
    setActiveId(id)
    syncUrl({ conv: id })
  }

  async function startNew() {
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

  async function send(text: string) {
    const content = text.trim()
    if (!content || streaming) return
    setError(null)

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
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content }])
    setInput("")
    setStreaming(true)

    const assistantId = `a-${Date.now()}`
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId: convId, message: content, history, symbol: symbol || undefined, timeframe }),
      })
      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "")
        throw new Error(errText || `Request failed (${res.status})`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let full = ""

      while (true) {
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
            const evt = JSON.parse(data) as { type: string; token?: string }
            if (evt.type === "token" && evt.token) {
              full += evt.token
              setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m)))
            }
          } catch { /* ignore */ }
        }
      }

      await loadConversations()
      const fresh = await getMessages(convId)
      setMessages(fresh.map((m) => ({ id: String(m.id), role: m.role as "user" | "assistant", content: m.content })))
    } catch (e: any) {
      setError(e?.message || "Something went wrong")
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
    } finally {
      setStreaming(false)
    }
  }

  const dataSources = symbol ? ["Live quote", "Technical indicators", "Recent news", "AI analysis"] : []

  return (
    <div className="relative flex h-[calc(100vh-7rem)] gap-0 md:gap-4">
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
            <p className="body font-medium">Lumora AI</p>
            <p className="meta">Grounded in real market data</p>
          </div>

          {/* Symbol selector */}
          <div className="relative ml-auto">
            <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5" style={{ border: "1px solid var(--line)", background: "var(--surface)" }}>
              <Search className="h-3.5 w-3.5" style={{ color: "var(--text-tertiary)" }} />
              <input
                value={symbolQ}
                onChange={(e) => { setSymbolQ(e.target.value); setSymbolOpen(true) }}
                onFocus={() => setSymbolOpen(true)}
                placeholder={symbol || "Pick a symbol"}
                className="w-28 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
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

          {symbol && (
            <div className="flex items-center gap-3">
              {quote && (
                <>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                      {quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {quote.currency}
                    </p>
                    <p className="font-mono text-xs tabular-nums" style={{ color: quote.changePercent >= 0 ? "var(--pos)" : "var(--neg)" }}>
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
        <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-2 py-5 lg:px-6">
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
            messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={m.role === "user" ? { background: "var(--gold-glow)", color: "var(--gold)" } : { background: "var(--surface)", color: "var(--text-tertiary)", border: "1px solid var(--line)" }}>
                  {m.role === "user" ? <User className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${m.role === "user" ? "" : "border"}`}
                  style={m.role === "user" ? { background: "var(--gold-glow)", color: "var(--text-primary)" } : { background: "var(--surface)", borderColor: "var(--line)", color: "var(--text-primary)" }}
                >
                  {m.role === "assistant" && !m.content ? <TypingIndicator /> : <Markdown content={m.content} />}
                </div>
              </motion.div>
            ))
          )}
          <div ref={endRef} />
        </div>

        {error && <p className="meta px-5 pb-1" style={{ color: "var(--neg)" }}>{error}</p>}

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
              placeholder={symbol ? `Ask about ${symbol}…` : "Message Lumora…"}
              className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground/50"
              style={{ color: "var(--text-primary)" }}
            />
            {input.trim() && (
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
            <button
              onClick={() => send(input)}
              disabled={streaming || !input.trim()}
              className="lm-btn lm-btn--gold flex shrink-0 items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-40"
              style={{ boxShadow: "0 4px 20px -6px var(--gold-glow)" }}
            >
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </button>
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
