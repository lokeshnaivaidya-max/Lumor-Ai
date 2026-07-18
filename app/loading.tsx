import { AmbientBackground } from "@/components/ambient-background"

export default function GlobalLoading() {
  return (
    <div className="scene">
      <AmbientBackground />
      <div className="relative z-10 flex flex-col items-center">
        <div className="skeleton h-6 w-6 rounded-full" />
        <p className="meta mt-6">Loading&hellip;</p>
      </div>
    </div>
  )
}
