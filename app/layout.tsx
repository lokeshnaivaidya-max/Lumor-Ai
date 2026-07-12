import type { Metadata, Viewport } from "next"
import { Sora, Inter, JetBrains_Mono, Instrument_Serif } from "next/font/google"
import "./globals.css"

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
})

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-serif",
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
  themeColor: "#08111F",
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
      className={`${sora.variable} ${inter.variable} ${mono.variable} ${instrument.variable} bg-background`}
    >
      <body className="antialiased">{children}</body>
    </html>
  )
}
