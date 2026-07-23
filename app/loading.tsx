import Image from "next/image"
import { AmbientBackground } from "@/components/ambient-background"

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[99990] flex flex-col items-center justify-center bg-[var(--bg)] backdrop-blur-xl">
      <AmbientBackground />
      <div className="relative z-10 flex flex-col items-center text-center p-6">
        <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-white/5 border border-[var(--line-strong)] p-1.5 shadow-lg animate-pulse">
          <Image
            src="/lumora-logo.png"
            alt="Lumora AI"
            fill
            className="object-contain p-1"
            priority
          />
        </div>
        <span className="font-serif text-2xl font-bold tracking-tight mt-4 text-[var(--text-primary)]">
          LUMOR<span className="bg-gradient-to-r from-[#38bdf8] via-[#34d399] to-[#fb7185] bg-clip-text text-transparent">A</span> AI
        </span>
        <p className="text-xs font-mono uppercase tracking-widest text-[var(--text-tertiary)] mt-1.5">
          Loading AI Workspace&hellip;
        </p>
      </div>
    </div>
  )
}

