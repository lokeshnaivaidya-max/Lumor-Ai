"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import ReactMarkdown from "react-markdown"
import { Send, Plus, Trash2, User, Loader2, MessageSquare } from "lucide-react"
import { getConversations, getMessages, createConversation, deleteConversation } from "@/app/actions/chat"

type Conversation = { id: number; title: string; updatedAt: string; preview?: string | null; messageCount?: number }
type Msg = { id: string; role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "What's a good strategy for a beginner investor?",
  "Explain P/E ratio in simple terms",
  "How does diversification reduce risk?",
  "What factors move stock prices short term?",
]

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--text-tertiary)" }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  )
}

function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-invert max-w-none text-sm leading-relaxed">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }: any) {
            const inline = !className
            if (inline) return <code className="rounded px-1 py-0.5 text-xs font-mono" style={{ background: "rgba(255,255,255,0.1)" }}>{children}</code>
            return (
              <pre className="my-2 overflow-x-auto rounded-xl p-3 text-xs" style={{ background: "rgba(0,0,0,0.3)" }}>
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
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const loadConversations = useCallback(async () => {
    try { setConversations(await getConversations()) } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadConversations() }, [loadConversations])

  useEffect(() => {
    async function load() {
      if (!activeId) { setMessages([]); return }
      setLoadingMsgs(true)
      try {
        const msgs = await getMessages(activeId)
        setMessages(msgs.map((m) => ({ id: String(m.id), role: m.role as "user" | "assistant", content: m.content })))
      } finally { setLoadingMsgs(false) }
    }
    load()
  }, [activeId])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, streaming])

  async function selectConversation(id: number) { setError(null); setActiveId(id) }

  async function startNew() { setError(null); setActiveId(null); setMessages([]) }

  async function handleDelete(id: number) {
    try {
      await deleteConversation(id)
      if (activeId === id) { setActiveId(null); setMessages([]) }
      await loadConversations()
    } catch (e: any) { setError(e?.message || "Failed to delete") }
  }

  async function send(text: string) {
    const content = text.trim()
    if (!content || streaming) return
    setError(null)

    let convId = activeId
    if (convId == null) {
      const conv = await createConversation(content)
      convId = conv.id
      setActiveId(convId)
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
        body: JSON.stringify({ conversationId: convId, message: content, history }),
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

  return (
      <div className="relative flex h-[calc(100vh-7rem)] gap-0 md:gap-4">
      <div className="hidden w-[20%] min-w-[180px] max-w-[280px] shrink-0 flex-col gap-2 md:flex">
        <button onClick={startNew} className="lm-btn lm-btn--gold flex items-center justify-center gap-2 px-3 py-2.5 text-xs">
          <Plus className="h-3.5 w-3.5" />New chat
        </button>
        <div className="glass-strong flex-1 overflow-y-auto rounded-2xl p-2">
          {conversations.length === 0 ? (
            <p className="meta px-2 py-3">No conversations yet.</p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                  activeId === c.id ? "bg-foreground/[0.06]" : "hover:bg-foreground/[0.04]"
                }`}
              >
                <button onClick={() => selectConversation(c.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-tertiary)" }} />
                  <span className="truncate">{c.title}</span>
                </button>
                <button onClick={() => handleDelete(c.id)} className="rounded-md p-1 opacity-0 transition-opacity hover:text-[var(--rose)] group-hover:opacity-100" style={{ color: "var(--text-tertiary)" }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bento-card flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl">
        <div className="flex items-center gap-2 border-b px-5 py-3.5" style={{ borderColor: "var(--glass-border)" }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "var(--gold-glow)", color: "var(--gold)" }}>
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <p className="body font-medium">Lumora AI</p>
            <p className="meta">Grounded in real market data</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-2 py-4 lg:px-6">
          {loadingMsgs ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--text-tertiary)" }} /></div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="body">Ask Lumora about the markets</p>
              <p className="body mt-1" style={{ color: "var(--text-tertiary)" }}>Get grounded insights on stocks, strategies, and investing.</p>
              <div className="mt-5 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="glass-card rounded-2xl px-3 py-2.5 text-left text-xs transition-colors" style={{ color: "var(--text-tertiary)" }}>
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
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  m.role === "user"
                    ? "text-[var(--gold)]"
                    : "text-[var(--text-tertiary)]"
                }`} style={m.role === "user" ? { background: "var(--gold-glow)" } : { background: "var(--glass-bg)" }}>
                  {m.role === "user" ? <User className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                </div>
                <div
                  className={`max-w-[92%] rounded-2xl px-4 py-3 ${
                    m.role === "user" ? "" : ""
                  }`}
                  style={m.role === "user" ? { background: "var(--gold-glow)" } : { background: "var(--glass-bg)" }}
                >
                  {m.role === "assistant" && !m.content ? <TypingDots /> : <Markdown content={m.content} />}
                </div>
              </motion.div>
            ))
          )}
          {streaming && messages[messages.length - 1]?.content && (
            <p className="meta px-1">Generating…</p>
          )}
          <div ref={endRef} />
        </div>

        {error && <p className="meta px-5 pb-1" style={{ color: "var(--rose)" }}>{error}</p>}

        <div className="border-t p-3" style={{ borderColor: "var(--glass-border)" }}>
          <p className="meta mb-2 flex items-center gap-1.5" style={{ color: "var(--text-tertiary)" }}>
            <span aria-hidden>⚠️</span>
            Lumora AI can make mistakes. Responses are for educational purposes only and should not be considered financial advice.
          </p>
          <div className="flex items-end gap-2 rounded-2xl px-3 py-2" style={{ border: "1px solid var(--glass-border)", background: "var(--glass-bg)" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input) }
              }}
              rows={1}
              placeholder="Message Lumora…"
              className="max-h-32 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              style={{ color: "var(--text-primary)" }}
            />
            <button
              onClick={() => send(input)}
              disabled={streaming || !input.trim()}
              aria-label="Send message"
              className="lm-btn lm-btn--gold flex h-9 w-9 items-center justify-center rounded-xl p-0 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
