import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { enabledProviders } from "@/lib/auth"
import { getCurrentUser } from "@/lib/session"

export const metadata = {
  title: "Sign in — Lumora AI",
  description: "Sign in to your Lumora terminal and portfolio.",
}

type Provider = "google" | "microsoft" | "apple"

export default async function SignInPage() {
  const user = await getCurrentUser()
  if (user) redirect("/dashboard")

  return (
    <AuthForm mode="sign-in" enabledProviders={enabledProviders as Provider[]} />
  )
}
