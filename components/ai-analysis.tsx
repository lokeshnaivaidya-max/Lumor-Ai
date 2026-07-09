"use client"

import { useRef, useState } from "react"
import Markdown from "react-markdown"
import { Sparkles, Loader2, Square } from "lucide-react"

const HORIZONS = [
  { id: "day", label: "Day" },
  { id: "swing", label: "Swing" },
  { id: "position", label: "Position" },
] as const

export function AiAnalysis({ symbol }: { symbol: string }) {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [horizon, setHorizon] = useState<string>("swing")
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  async function run() {
    setLoading(true)
    setError(null)
    setText("")
    const controller = new AbortController()
    controllerRef.current = controller
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, horizon }),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) {
        setError(await res.text().catch(() => "Analysis failed."))
        setLoading(false)
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setText((prev) => prev + decoder.decode(value, { stream: true }))
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError("Analysis interrupted.")
    } finally {
      setLoading(false)
    }
  }

  function stop() {
    controllerRef.current?.abort()
    setLoading(false)
  }

  return (
    <div className="rounded-2xl border border-accent/25 bg-gradient-to-b from-accent/[0.06] to-transparent p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-medium text-foreground">Lumora AI Analysis</h3>
            <p className="text-xs text-muted-foreground">Grounded in live price + technicals</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-border bg-card/60 p-0.5">
            {HORIZONS.map((h) => (
              <button
                key={h.id}
                onClick={() => setHorizon(h.id)}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  horizon === h.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
          {loading ? (
            <button
              onClick={stop}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-foreground"
            >
              <Square className="h-3 w-3" /> Stop
            </button>
          ) : (
            <button
              onClick={run}
              className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground transition-transform hover:scale-[1.03]"
            >
              <Sparkles className="h-3.5 w-3.5" /> Analyze
            </button>
          )}
        </div>
      </div>

      {(text || loading || error) && (
        <div className="mt-5 border-t border-border/60 pt-5">
          {error && <p className="text-sm text-[var(--neg)]">{error}</p>}
          {loading && !text && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              Reading the tape…
            </div>
          )}
          {text && (
            <article className="lumora-prose">
              <Markdown>{text}</Markdown>
              {loading && <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-accent align-middle" />}
            </article>
          )}
        </div>
      )}

      {!text && !loading && !error && (
        <p className="mt-4 text-sm text-muted-foreground">
          Generate an institutional-grade breakdown of {symbol} — trend regime, key levels, and bull/bear scenarios.
        </p>
      )}
    </div>
  )
}
