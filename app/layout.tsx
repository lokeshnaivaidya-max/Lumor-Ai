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
  title: "Lumora AI — AI-Powered Stock Insights & Institutional Intelligence",
  description:
    "Lumora AI is an advanced global stock insights platform featuring real-time market feeds, institutional AI analysis, and interactive trade planning.",
  keywords: [
    "Lumora AI",
    "AI stock analysis",
    "global markets",
    "stock insights",
    "institutional research",
    "trade planner",
  ],
  icons: {
    icon: "/lumora-logo.png",
    shortcut: "/lumora-logo.png",
    apple: "/lumora-logo.png",
  },
  openGraph: {
    title: "Lumora AI — AI-Powered Stock Insights",
    description:
      "Real-time global markets, deep AI analysis, and institutional trade planning.",
    type: "website",
    images: ["/lumora-logo.png"],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0d0f" },
  ],
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  const rawTheme = (await cookies()).get("lumora-theme")?.value ?? "system"
  const theme: "dark" | "light" | "system" =
    rawTheme === "dark" || rawTheme === "light" || rawTheme === "system" ? rawTheme : "system"
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${mono.variable} ${instrument.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=(document.cookie.match(/(?:^|; )lumora-theme=([^;]+)/)||[])[1]||"system";var d=window.matchMedia("(prefers-color-scheme: dark)").matches;if(t==="dark"||(t==="system"&&d)){document.documentElement.classList.add("dark");document.documentElement.classList.add("dark-root");}else{document.documentElement.classList.add("light-root");}}catch(e){}})();`,
          }}
        />
        <ThemeProvider initial={theme === "system" ? "system" : theme}>
          <EntranceScreen />
          <AmbientBackground />
          <PageTransition>{children}</PageTransition>
        </ThemeProvider>
      </body>
    </html>
  )
}
