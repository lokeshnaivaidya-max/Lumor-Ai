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
  theme: "light",
  resolved: "light",
  setTheme: () => {},
  cycleTheme: () => {},
})

export const useTheme = () => useContext(Ctx)

function resolve(theme: Theme): "dark" | "light" {
  if (theme === "dark") return "dark"
  if (theme === "light") return "light"
  return "light"
}

function apply(resolved: "dark" | "light") {
  if (resolved === "dark") {
    document.documentElement.classList.add("dark")
    document.documentElement.classList.add("dark-root")
    document.documentElement.classList.remove("light-root")
  } else {
    document.documentElement.classList.remove("dark")
    document.documentElement.classList.remove("dark-root")
    document.documentElement.classList.add("light-root")
  }
}

export function ThemeProvider({ children, initial }: { children: ReactNode; initial?: Theme }) {
  const [theme, setThemeState] = useState<Theme>(initial ?? "light")
  const [resolved, setResolved] = useState<"dark" | "light">(() => resolve(initial ?? "light"))

  useEffect(() => {
    const r = resolve(theme)
    setResolved(r)
    apply(r)
    try {
      document.cookie = `lumora-theme=${theme};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`
      localStorage.setItem("lumora-theme", theme)
    } catch { /* noop */ }
  }, [theme])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])

  const cycleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"))
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

