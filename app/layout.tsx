import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Cinzel } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

// Cinzel — an inscriptional serif that mirrors the LUMORA wordmark.
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cinzel",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Lumora — AI Global Stock Intelligence",
  description:
    "Lumora is an AI-powered global stock intelligence platform. Real-time markets, deep AI analysis, and cinematic clarity across every major exchange.",
  keywords: [
    "AI stock analysis",
    "global markets",
    "investment intelligence",
    "technical analysis",
    "Lumora",
  ],
  openGraph: {
    title: "Lumora — AI Global Stock Intelligence",
    description:
      "Real-time markets, deep AI analysis, and cinematic clarity across every major exchange.",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: "#1a2030",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} bg-background`}
    >
      <body className="antialiased">{children}</body>
    </html>
  )
}
