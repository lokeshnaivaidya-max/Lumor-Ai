import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { AuthForm } from "@/components/auth/auth-form"
import { enabledProviders } from "@/lib/auth"
import { getCurrentUser } from "@/lib/session"

export const metadata = {
  title: "Sign in — Lumora AI",
  description: "Sign in to your Lumora terminal and portfolio.",
}

type Provider = "google" | "yahoo" | "apple"

export default async function SignInPage() {
  let user = null
  try {
    user = await getCurrentUser()
  } catch {
    // Auth not configured — render form anyway
  }
  if (user) redirect("/dashboard")

  return (
    <div className="relative w-full max-w-md">
      <Link
        href="/"
        className="absolute -top-14 left-0 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to home
      </Link>
      <AuthForm mode="sign-in" enabledProviders={enabledProviders as Provider[]} />
    </div>
  )
}
