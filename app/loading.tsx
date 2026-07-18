import { AmbientBackground } from "@/components/ambient-background"

export default function GlobalLoading() {
  return (
    <div className="lm-scene">
      <AmbientBackground />
      <div className="lm-light" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[oklch(0.91_0.01_75)] border-t-transparent" />
        <p className="dm-meta mt-6">Loading&hellip;</p>
      </div>
    </div>
  )
}
