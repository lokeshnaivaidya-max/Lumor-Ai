import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { enabledProviders } from "@/lib/auth"
import { getCurrentUser } from "@/lib/session"

export const metadata = {
  title: "Create account — Lumora AI",
  description: "Create your Lumora account to track global markets with AI intelligence.",
}

type Provider = "google" | "microsoft" | "apple"

export default async function SignUpPage() {
  const user = await getCurrentUser()
  if (user) redirect("/dashboard")

  return (
    <AuthForm mode="sign-up" enabledProviders={enabledProviders as Provider[]} />
  )
}
