import { NextResponse } from "next/server"
import { getEmailHistory, getActiveProviderName } from "@/lib/email"
import { getCurrentUser } from "@/lib/session"

export async function GET() {
  const user = await getCurrentUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userEmail = user.email.trim().toLowerCase()
  const allLogs = getEmailHistory()
  const provider = getActiveProviderName()

  // Filter logs strictly to ONLY records sent to the current user's email address
  const userLogs = allLogs.filter(
    (log) => log.to && log.to.trim().toLowerCase() === userEmail
  )

  return NextResponse.json({
    logs: userLogs,
    provider,
    count: userLogs.length,
  })
}

