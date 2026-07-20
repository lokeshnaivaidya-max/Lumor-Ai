import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { AuthForm } from "@/components/auth/auth-form"
import { enabledProviders } from "@/lib/auth"
import { getCurrentUser } from "@/lib/session"

export const metadata = {
  title: "Create account — Lumora AI",
  description: "Create your Lumora account to track global markets with AI intelligence.",
}

type Provider = "google" | "yahoo" | "apple"

export default async function SignUpPage() {
  let user = null
  try {
    user = await getCurrentUser()
  } catch {
    // Auth not configured — render form anyway
  }
  if (user) redirect("/")

  return (
    <div className="relative w-full max-w-md">
      <div className="pointer-events-none absolute -inset-32 opacity-30" style={{ background: 'radial-gradient(circle at 50% 20%, var(--gold-glow-strong), transparent 60%)' }} />
      <Link
        href="/"
        className="relative flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        style={{ marginBottom: "3.5rem" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to home
      </Link>
      <AuthForm mode="sign-up" enabledProviders={enabledProviders as Provider[]} />
    </div>
  )
}
