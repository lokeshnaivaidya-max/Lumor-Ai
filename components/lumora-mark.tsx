"use client"

import Image from "next/image"

export function LumoraMark({
  className = "h-8 w-8",
  showText = false,
}: {
  className?: string
  showText?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className={`relative flex items-center justify-center shrink-0 overflow-hidden ${className}`}>
        <Image
          src="/lumora-logo.png"
          alt="Lumora AI Logo"
          width={120}
          height={120}
          className="h-full w-full object-contain"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span className="font-serif text-lg font-bold tracking-tight text-[var(--text-primary)]">
            LUMOR<span className="bg-gradient-to-r from-[#38bdf8] via-[#34d399] to-[#fb7185] bg-clip-text text-transparent">A</span>
          </span>
          <span className="text-[9px] font-semibold tracking-widest text-[#3b82f6] uppercase mt-0.5">
            AI Platform
          </span>
        </div>
      )}
    </div>
  )
}

