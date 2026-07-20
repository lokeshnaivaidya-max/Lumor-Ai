import type { Metadata, Viewport } from "next"
import { cookies } from "next/headers"
import { Sora, Inter, JetBrains_Mono, Instrument_Serif } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AmbientBackground } from "@/components/ambient-background"
import { PageTransition } from "@/components/page-transition"
import { EntranceScreen } from "@/components/entrance-screen"
import type { ReactNode } from "react"
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
  weight: ["300", "400", "500", "600"],
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
  themeColor: "#0a0a0c",
  width: "device-width",
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  const theme = (await cookies()).get("lumora-theme")?.value ?? "light"
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${mono.variable} ${instrument.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{document.documentElement.classList.add("dark");}catch(e){}})();`,
          }}
        />
        <ThemeProvider initial="dark">
          <EntranceScreen />
          <AmbientBackground />
          <PageTransition>{children}</PageTransition>
        </ThemeProvider>
      </body>
    </html>
  )
}
