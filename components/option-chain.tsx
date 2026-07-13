"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import useSWR from "swr"
import {
  TrendingUp, TrendingDown, Minus, Loader2, AlertCircle,
  BarChart3, Activity, Hash, Gauge, Sigma, ArrowUpDown,
  ChevronDown, DollarSign, Layers, Brain, RefreshCw,
} from "lucide-react"
import type { OptionChainData, OptionContract } from "@/lib/options"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function fmt(n: number | null | undefined, d = 2) {
  return n == null ? "—" : n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })
}

function bigNum(n: number | undefined | null) {
  if (n == null) return "—"
  if (n >= 1e7) return `${(n / 1e7).toFixed(1)}Cr`
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)}L`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toLocaleString()
}

function OptionRow({ contract, atmStrike }: { contract: OptionContract; atmStrike: number }) {
  const isCall = contract.type === "CE"
  const isATM = Math.abs(contract.strike - atmStrike) < 0.01
  const premiumPct = contract.premium > 0 && atmStrike > 0 ? (contract.premium / atmStrike) * 100 : 0

  return (
    <tr className={`border-b border-white/10 transition-colors hover:bg-white/[0.04] ${isATM ? "bg-blue/[0.06]" : ""}`}>
      <td className="px-3 py-2.5 font-mono text-sm text-foreground tabular-nums">
        {contract.strike.toFixed(0)}
      </td>
      <td className="px-3 py-2.5">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          isCall ? "bg-emerald/10 text-emerald" : "bg-rose/10 text-rose"
        }`}>
          {contract.type}
        </span>
      </td>
      <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-foreground">
        {fmt(contract.premium)}
      </td>
      <td className="px-3 py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
        {premiumPct > 0 ? `${premiumPct.toFixed(1)}%` : "—"}
      </td>
      <td className="px-3 py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
        {fmt(contract.iv, 1)}%
      </td>
      <td className="px-3 py-2.5 font-mono text-xs tabular-nums text-muted-foreground hidden lg:table-cell">
        {fmt(contract.delta, 2)}
      </td>
      <td className="px-3 py-2.5 font-mono text-xs tabular-nums text-muted-foreground hidden lg:table-cell">
        {fmt(contract.gamma, 4)}
      </td>
      <td className="px-3 py-2.5 font-mono text-xs tabular-nums text-muted-foreground hidden lg:table-cell">
        {fmt(contract.theta, 2)}
      </td>
      <td className="px-3 py-2.5 font-mono text-xs tabular-nums text-muted-foreground hidden xl:table-cell">
        {fmt(contract.vega, 2)}
      </td>
      <td className="px-3 py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
        {bigNum(contract.openInterest)}
      </td>
      <td className="px-3 py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
        {bigNum(contract.volume)}
      </td>
      <td className={`px-3 py-2.5 font-mono text-xs tabular-nums ${
        contract.changePercent > 0 ? "text-emerald" : contract.changePercent < 0 ? "text-rose" : "text-muted-foreground"
      }`}>
        {contract.changePercent !== 0 ? `${contract.changePercent > 0 ? "+" : ""}${contract.changePercent.toFixed(1)}%` : "—"}
      </td>
    </tr>
  )
}

function OIHeatmapBar({ value, max }: { value: number; max: number }) {
  if (max === 0) return null
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="h-6 w-full rounded-full bg-white/10 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, oklch(0.55 0.18 255), oklch(0.62 0.16 168))` }}
      />
    </div>
  )
}

export function OptionChain({ symbol }: { symbol: string }) {
  const { data, isLoading, error, mutate } = useSWR(
    `/api/options?symbol=${encodeURIComponent(symbol)}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 },
  )
  const [expiry, setExpiry] = useState("")
  const [expiries, setExpiries] = useState<string[]>([])

  useEffect(() => {
    if (data?.data?.expiries) {
      setExpiries(data.data.expiries)
      if (!expiry && data.data.expiries.length > 0) {
        setExpiry(data.data.expiries[0])
      }
    }
  }, [data, expiry])

  useEffect(() => {
    if (expiry && expiries.includes(expiry)) {
      mutate(`/api/options?symbol=${encodeURIComponent(symbol)}&expiry=${encodeURIComponent(expiry)}`)
    }
  }, [expiry, symbol, mutate, expiries])

  const chain: OptionChainData | null = data?.data ?? null
  const available = data?.available ?? false

  const atmStrike = useMemo(() => {
    if (!chain) return 0
    return chain.underlyingPrice
  }, [chain])

  const calls = useMemo(() => chain?.contracts?.filter((c) => c.type === "CE") ?? [], [chain])
  const puts = useMemo(() => chain?.contracts?.filter((c) => c.type === "PE") ?? [], [chain])
  const allStrikes = useMemo(() => {
    const s = new Set<number>()
    for (const c of chain?.contracts ?? []) s.add(c.strike)
    return [...s].sort((a, b) => a - b)
  }, [chain])

  const maxOI = useMemo(() => {
    if (!chain?.contracts) return 0
    return Math.max(...chain.contracts.map((c) => c.openInterest), 1)
  }, [chain])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-blue" />
        Loading options data…
      </div>
    )
  }

  if (error || (!available && !isLoading)) {
    return (
      <div className="rounded-[28px] border border-gold/30 bg-gold/[0.07] p-6 text-center backdrop-blur-sm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/20">
          <AlertCircle className="h-6 w-6 text-gold" />
        </div>
        <h4 className="font-heading text-sm font-medium text-foreground">Options data unavailable</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          {symbol} options are not available from the current data provider. Options from Yahoo Finance are available
          for US equities and ETFs with listed option chains. For Indian F&O, connect a supported broker provider.
        </p>
      </div>
    )
  }

  if (!chain || chain.contracts.length === 0) {
    return (
      <div className="rounded-[28px] border border-gold/30 bg-gold/[0.07] p-6 text-center backdrop-blur-sm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/20">
          <AlertCircle className="h-6 w-6 text-gold" />
        </div>
        <h4 className="font-heading text-sm font-medium text-foreground">Options data unavailable</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          No options contracts found for {symbol}. This instrument may not have listed options.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Underlying" value={fmt(chain.underlyingPrice)} change={`${chain.underlyingChangePercent >= 0 ? "+" : ""}${chain.underlyingChangePercent.toFixed(2)}%`} positive={chain.underlyingChangePercent >= 0} />
        <StatCard label="Put/Call Ratio" value={chain.pcr != null ? chain.pcr.toFixed(3) : "—"} />
        <StatCard label="Max Pain" value={chain.maxPain != null ? fmt(chain.maxPain, 0) : "—"} />
        <StatCard label="Total OI" value={bigNum(chain.contracts.reduce((s, c) => s + c.openInterest, 0))} />
        <StatCard label="Provider" value={chain.provider} />
      </div>

      {expiries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Expiry:</span>
          <div className="flex flex-wrap gap-1.5">
            {expiries.slice(0, 8).map((e) => (
              <button
                key={e}
                onClick={() => setExpiry(e)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                  expiry === e
                    ? "bg-blue text-white"
                    : "border border-white/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                {new Date(e).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-[28px] border border-white/20 bg-white/[0.04] backdrop-blur-sm">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-white/20 bg-white/[0.04]">
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Strike</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Premium</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">%</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">IV</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Delta</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Gamma</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Theta</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden xl:table-cell">Vega</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">OI</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Vol</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Chg%</th>
            </tr>
          </thead>
          <tbody>
            {allStrikes.map((strike) => {
              const call = calls.find((c) => c.strike === strike)
              const put = puts.find((p) => p.strike === strike)
              return (
                <OptionRow
                  key={strike}
                  contract={call ?? put!}
                  atmStrike={atmStrike}
                />
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[28px] border border-white/20 bg-white/10 p-5 backdrop-blur-xl">
          <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Layers className="h-3.5 w-3.5" /> CE Open Interest
          </h4>
          <div className="space-y-2">
            {calls.slice(0, 10).map((c) => (
              <div key={`ce-${c.strike}`} className="flex items-center gap-3">
                <span className="w-16 text-right font-mono text-xs text-foreground tabular-nums">{c.strike.toFixed(0)}</span>
                <div className="flex-1">
                  <OIHeatmapBar value={c.openInterest} max={maxOI} />
                </div>
                <span className="w-14 text-right font-mono text-xs text-muted-foreground tabular-nums">{bigNum(c.openInterest)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[28px] border border-white/20 bg-white/10 p-5 backdrop-blur-xl">
          <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Layers className="h-3.5 w-3.5" /> PE Open Interest
          </h4>
          <div className="space-y-2">
            {puts.slice(0, 10).map((p) => (
              <div key={`pe-${p.strike}`} className="flex items-center gap-3">
                <span className="w-16 text-right font-mono text-xs text-foreground tabular-nums">{p.strike.toFixed(0)}</span>
                <div className="flex-1">
                  <OIHeatmapBar value={p.openInterest} max={maxOI} />
                </div>
                <span className="w-14 text-right font-mono text-xs text-muted-foreground tabular-nums">{bigNum(p.openInterest)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, change, positive }: { label: string; value: string; change?: string; positive?: boolean }) {
  return (
    <div className="rounded-[28px] border border-white/20 bg-white/10 px-4 py-3.5 backdrop-blur-xl">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-heading text-lg font-semibold text-foreground tabular-nums">{value}</div>
      {change && (
        <div className={`mt-0.5 text-xs ${positive === true ? "text-emerald" : positive === false ? "text-rose" : "text-muted-foreground"}`}>
          {change}
        </div>
      )}
    </div>
  )
}
