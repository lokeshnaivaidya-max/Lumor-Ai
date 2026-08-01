"use client"

import Link from "next/link"
import { useSession } from "@/lib/auth-client"

interface StartFreeButtonProps {
  children?: React.ReactNode
  className?: string
}

export function StartFreeButton({
  children = "Start free",
  className = "btn btn--gold",
}: StartFreeButtonProps) {
  const { data: session } = useSession()
  const href = session?.user ? "/dashboard" : "/sign-up"

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
