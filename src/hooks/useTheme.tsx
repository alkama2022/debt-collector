import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"
type Resolved = "light" | "dark"

type Ctx = {
  theme: Theme
  resolved: Resolved
  setTheme: (t: Theme) => void
  toggle: () => void
}

const ThemeCtx = createContext<Ctx>(null as any)

function getSystem(): Resolved {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function apply(theme: Resolved) {
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.style.colorScheme = theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const v = localStorage.getItem("cn_theme") as Theme | null
    if (v === "light" || v === "dark" || v === "system") return v
    return "system"
  })
  const [resolved, setResolved] = useState<Resolved>(() => {
    const v = localStorage.getItem("cn_theme") as Theme | null
    if (v === "dark") return "dark"
    if (v === "light") return "light"
    return getSystem()
  })

  useEffect(() => {
    const r: Resolved = theme === "system" ? getSystem() : theme
    setResolved(r)
    apply(r)
    localStorage.setItem("cn_theme", theme)
  }, [theme])

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      if (theme === "system") {
        const r = getSystem()
        setResolved(r)
        apply(r)
      }
    }
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [theme])

  const toggle = () => setTheme(resolved === "dark" ? "light" : "dark")

  return <ThemeCtx.Provider value={{ theme, resolved, setTheme, toggle }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
