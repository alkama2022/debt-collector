import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "../../hooks/useTheme"

export function ThemeToggle({ variant = "icon" }: { variant?: "icon" | "full" }) {
  const { theme, resolved, setTheme, toggle } = useTheme()

  if (variant === "full") {
    return (
      <div className="flex items-center gap-1 p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        {([
          { v: "light", icon: Sun, label: "Light" },
          { v: "system", icon: Monitor, label: "Auto" },
          { v: "dark", icon: Moon, label: "Dark" },
        ] as const).map(({ v, icon: Icon, label }) => (
          <button
            key={v}
            onClick={() => setTheme(v)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              theme === v
                ? "bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
            title={label}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${resolved === "dark" ? "light" : "dark"} mode`}
      title={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="relative w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden group hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
    >
      <Sun className={`w-4 h-4 text-amber-500 absolute transition-all duration-300 ${resolved === "dark" ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`} />
      <Moon className={`w-4 h-4 text-slate-200 absolute transition-all duration-300 ${resolved === "dark" ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"}`} />
    </button>
  )
}

// Inline select for settings page
export function ThemeSelect() {
  const { theme, setTheme } = useTheme()
  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as any)}
      className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
    >
      <option value="light">☀️ Light</option>
      <option value="dark">🌙 Dark</option>
      <option value="system">🖥️ System</option>
    </select>
  )
}
