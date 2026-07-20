import Link from "next/link"
import { LumoraMark } from "@/components/lumora-mark"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen w-full">
      <div className="ambient" />
      <div className="relative z-10 grid min-h-screen w-full lg:grid-cols-2">
        {/* Branded panel */}
        <aside className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
          <div className="pointer-events-none absolute -inset-32 opacity-60" style={{ background: "radial-gradient(circle at 20% 10%, var(--gold-glow-strong), transparent 55%)" }} />
          <Link href="/" className="relative flex items-center gap-3">
            <LumoraMark className="h-9 w-9" />
            <span className="font-serif text-xl tracking-tight">Lumora</span>
          </Link>
          <div className="relative max-w-md">
            <p className="subheading">AI Global Stock Intelligence</p>
            <h2 className="title mt-4">Clarity in every market move.</h2>
            <p className="body mt-4">
              Real-time markets, deep AI analysis, and cinematic clarity across every major exchange.
            </p>
          </div>
          <p className="relative meta">© {new Date().getFullYear()} Lumora AI</p>
        </aside>

        {/* Form area */}
        <div className="relative flex items-center justify-center px-4 py-16 sm:px-8">
          {children}
        </div>
      </div>
    </main>
  )
}
