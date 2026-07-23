"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { SWRConfig } from "swr"

type Theme = "dark" | "light" | "system"

interface ThemeContext {
  theme: Theme
  resolved: "dark" | "light"
  setTheme: (t: Theme) => void
  cycleTheme: () => void
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

const Ctx = createContext<ThemeContext>({
  theme: "system",
  resolved: "light",
  setTheme: () => {},
  cycleTheme: () => {},
})

export const useTheme = () => useContext(Ctx)

function resolve(theme: Theme): "dark" | "light" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }
  return theme
}

function apply(resolved: "dark" | "light") {
  document.documentElement.classList.toggle("dark", resolved === "dark")
  document.documentElement.classList.toggle("dark-root", resolved === "dark")
  document.documentElement.classList.toggle("light-root", resolved === "light")
}

export function ThemeProvider({ children, initial }: { children: ReactNode; initial?: Theme }) {
  const [theme, setThemeState] = useState<Theme>(initial ?? "system")
  const [resolved, setResolved] = useState<"dark" | "light">("light")

  useEffect(() => {
    const r = resolve(theme)
    setResolved(r)
    apply(r)
    try {
      document.cookie = `lumora-theme=${theme};path=/;max-age=${365 * 24 * 60 * 60}`
    } catch { /* noop */ }
  }, [theme])

  useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      const r = resolve("system")
      setResolved(r)
      apply(r)
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])

  const cycleTheme = useCallback(() => {
    setThemeState((prev) => {
      if (prev === "dark") return "light"
      if (prev === "light") return "system"
      return "dark"
    })
  }, [])

  return (
    <Ctx.Provider value={{ theme, resolved, setTheme, cycleTheme }}>
      <SWRConfig
        value={{
          fetcher,
          dedupingInterval: 12000,
          revalidateOnFocus: false,
          keepPreviousData: true,
        }}
      >
        {children}
      </SWRConfig>
    </Ctx.Provider>
  )
}

