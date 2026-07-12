import { AmbientBackground } from "@/components/ambient-background"
import { CursorGlow } from "@/components/cursor-glow"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AmbientBackground />
      <CursorGlow />
      <div className="mesh-bg fixed inset-0 opacity-40" />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        {children}
      </main>
    </>
  )
}
