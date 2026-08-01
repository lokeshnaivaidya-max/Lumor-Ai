"use client"

import { useState, useEffect } from "react"
import { Mail, CheckCircle2, XCircle, RefreshCw, Server, Clock, AlertCircle } from "lucide-react"

type EmailLogItem = {
  correlationId: string
  timestamp: string
  to: string
  subject: string
  provider: string
  messageId: string | null
  success: boolean
  retryCount: number
  latency: number
  accepted: string[]
  rejected: string[]
  error: string | null
}

export function EmailHistoryWidget() {
  const [logs, setLogs] = useState<EmailLogItem[]>([])
  const [provider, setProvider] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  async function fetchHistory() {
    try {
      setRefreshing(true)
      const res = await fetch("/api/email-history")
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
        setProvider(data.provider || "System SMTP")
      }
    } catch (err) {
      console.warn("Failed to fetch email history", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHistory()
    const interval = setInterval(fetchHistory, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bento-card p-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Email Delivery Monitor</h3>
            <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1.5 mt-0.5">
              <Server className="h-3 w-3" /> Provider: <span className="font-mono font-medium text-[var(--text-secondary)]">{provider || "Checking..."}</span>
            </p>
          </div>
        </div>

        <button
          onClick={fetchHistory}
          disabled={refreshing}
          className="btn btn--outline py-1.5 px-3 text-xs flex items-center gap-1.5"
          title="Refresh delivery status"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center text-xs text-[var(--text-tertiary)]">
          <RefreshCw className="h-4 w-4 animate-spin mr-2" /> Loading email dispatch history...
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
          <Mail className="h-8 w-8 text-[var(--text-tertiary)] mx-auto mb-2 opacity-60" />
          <p className="text-xs font-medium text-[var(--text-secondary)]">No email activity recorded in this session</p>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1 max-w-sm mx-auto">
            Verification and password reset emails will log delivery status, latency, and provider responses here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
          {logs.map((log) => {
            const timeFormatted = new Date(log.timestamp).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              day: "numeric",
              month: "short",
            })

            return (
              <div
                key={log.correlationId || log.timestamp}
                className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3.5 transition-all hover:bg-[var(--panel-2)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {log.success ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Delivered
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                        <XCircle className="h-3 w-3" /> Failed
                      </span>
                    )}
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{log.subject}</span>
                  </div>

                  <span className="text-[10px] font-mono text-[var(--text-tertiary)] flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {timeFormatted} (IST)
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between text-xs text-[var(--text-secondary)] gap-2">
                  <span className="font-mono text-[11px]">To: <strong className="text-[var(--text-primary)]">{log.to}</strong></span>
                  <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
                    Latency: {log.latency}ms • Provider: {log.provider}
                  </span>
                </div>

                {log.error && (
                  <div className="mt-2.5 rounded-lg bg-rose-500/10 p-2 text-[11px] text-rose-600 dark:text-rose-400 flex items-start gap-1.5 font-mono">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span className="break-all">{log.error}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
