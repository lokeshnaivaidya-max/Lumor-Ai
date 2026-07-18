"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { SymbolSearch, type SearchResult } from "@/components/symbol-search"
import { AiAnalysis } from "@/components/ai-analysis"

export default function AnalyzePage() {
  const [symbol, setSymbol] = useState<string>("")

  function handleSelect(r: SearchResult) {
    setSymbol(r.symbol)
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6"
      >
        <h1 className="font-heading text-2xl tracking-tight text-foreground">Analyze a Stock</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search any stock, index, or crypto and get a clear, honest breakdown grounded in live market data.
        </p>
      </motion.div>

      <div className="mb-6">
        <SymbolSearch onSelect={handleSelect} />
        {symbol && (
          <p className="mt-2 text-xs text-muted-foreground">
            Analyzing <span className="font-mono font-medium text-foreground">{symbol}</span>
          </p>
        )}
      </div>

      {symbol ? (
        <AiAnalysis symbol={symbol} />
      ) : (
        <div className="glass-card flex h-64 items-center justify-center rounded-[32px] text-sm text-muted-foreground">
          Search a symbol above to run Lumora&apos;s AI analysis.
        </div>
      )}
    </div>
  )
}
