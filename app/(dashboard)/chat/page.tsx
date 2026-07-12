import { ChatClient } from "./chat-client"

export const metadata = {
  title: "AI Chat — Lumora AI",
  description: "Ask Lumora anything about the markets, stocks, and investing.",
}

export default function ChatPage() {
  return <ChatClient />
}
