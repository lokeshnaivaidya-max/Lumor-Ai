import { Suspense } from "react"
import { ChatClient } from "./chat-client"

export const metadata = {
  title: "AI Chat — Lumora AI",
  description: "Ask Lumora anything about the markets, stocks, and investing.",
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="bento-card h-[calc(100vh-7rem)] animate-pulse" />}>
      <ChatClient />
    </Suspense>
  )
}
