/**
 * useKeyboardShortcuts — global keyboard shortcuts for power users.
 *
 * Shortcuts (only fire when not typing in an input/textarea):
 *   /        → focus global search
 *   g c      → go to Customers
 *   g i      → go to Invoices
 *   g p      → go to Payments
 *   g r      → go to Reminders
 *   g d      → go to Dashboard
 *   g a      → go to AI Agent
 *   n c      → new customer (open FAB customer modal via custom event)
 *   n i      → new invoice
 *   n p      → record payment
 *   ?        → toggle shortcut cheat-sheet overlay
 *   Escape   → close any open overlay
 */
import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"

const NAV_MAP: Record<string, string> = {
  c: "/customers",
  i: "/invoices",
  p: "/payments",
  r: "/reminders",
  d: "/dashboard",
  a: "/ai",
  s: "/settings",
  t: "/reports",
}

const CREATE_MAP: Record<string, string> = {
  c: "cn:new-customer",
  i: "cn:new-invoice",
  p: "cn:new-payment",
}

function isTyping(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  return tag === "input" || tag === "textarea" || tag === "select" || (el as HTMLElement).isContentEditable
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [lastAction, setLastAction] = useState<string | null>(null)

  const flash = (msg: string) => {
    setLastAction(msg)
    setTimeout(() => setLastAction(null), 1800)
  }

  const handleKey = useCallback((e: KeyboardEvent) => {
    // Never intercept when modifier keys are held (Ctrl/Cmd/Alt)
    if (e.ctrlKey || e.metaKey || e.altKey) return
    // Never intercept when user is typing in a field
    if (isTyping()) return

    const key = e.key.toLowerCase()

    // Toggle help overlay
    if (key === "?" || (e.shiftKey && key === "/")) {
      e.preventDefault()
      setShowHelp(h => !h)
      return
    }

    // Escape — close help
    if (key === "escape") {
      setShowHelp(false)
      setPendingKey(null)
      return
    }

    // Focus search bar
    if (key === "/" && !e.shiftKey) {
      e.preventDefault()
      const input = document.querySelector<HTMLInputElement>("[data-search]") ??
        document.querySelector<HTMLInputElement>("input[placeholder*='Search']")
      input?.focus()
      flash("Search focused")
      return
    }

    // Two-key sequences: g + nav, n + create
    if (pendingKey === "g") {
      setPendingKey(null)
      if (NAV_MAP[key]) {
        e.preventDefault()
        navigate(NAV_MAP[key])
        flash(`→ ${NAV_MAP[key]}`)
      }
      return
    }

    if (pendingKey === "n") {
      setPendingKey(null)
      if (CREATE_MAP[key]) {
        e.preventDefault()
        document.dispatchEvent(new CustomEvent(CREATE_MAP[key]))
        flash(`+ ${key === "c" ? "customer" : key === "i" ? "invoice" : "payment"}`)
      }
      return
    }

    // First key of a sequence
    if (key === "g" || key === "n") {
      setPendingKey(key)
      // Auto-clear pending key after 1.5s if no second key arrives
      setTimeout(() => setPendingKey(k => k === key ? null : k), 1500)
      return
    }
  }, [navigate, pendingKey])

  useEffect(() => {
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [handleKey])

  return { showHelp, setShowHelp, pendingKey, lastAction }
}

// ─── Shortcut help overlay ────────────────────────────────────────────────────
export function ShortcutOverlay({
  show, onClose,
}: { show: boolean; onClose: () => void }) {
  if (!show) return null

  const sections = [
    {
      title: "Navigate",
      shortcuts: [
        { keys: ["g", "d"], label: "Go to Dashboard" },
        { keys: ["g", "c"], label: "Go to Customers" },
        { keys: ["g", "i"], label: "Go to Invoices" },
        { keys: ["g", "p"], label: "Go to Payments" },
        { keys: ["g", "r"], label: "Go to Reminders" },
        { keys: ["g", "a"], label: "Go to AI Agent" },
        { keys: ["g", "s"], label: "Go to Settings" },
        { keys: ["g", "t"], label: "Go to Reports" },
      ],
    },
    {
      title: "Create",
      shortcuts: [
        { keys: ["n", "c"], label: "New customer" },
        { keys: ["n", "i"], label: "New invoice" },
        { keys: ["n", "p"], label: "Record payment" },
      ],
    },
    {
      title: "General",
      shortcuts: [
        { keys: ["/"], label: "Focus search" },
        { keys: ["?"], label: "Show this help" },
        { keys: ["Esc"], label: "Close overlays" },
      ],
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">Keyboard shortcuts</h2>
          <div className="flex items-center gap-2">
            <Kbd>?</Kbd>
            <span className="text-xs text-slate-400">to toggle</span>
            <button
              onClick={onClose}
              className="ml-2 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="p-5 grid sm:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto">
          {sections.map(section => (
            <div key={section.title}>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                {section.title}
              </div>
              <div className="space-y-2">
                {section.shortcuts.map(s => (
                  <div key={s.label} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-600 dark:text-slate-300">{s.label}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <Kbd>{k}</Kbd>
                          {i < s.keys.length - 1 && (
                            <span className="text-slate-300 text-xs">then</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400">
          Shortcuts are inactive when typing in a text field.
        </div>
      </div>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[26px] h-[22px] px-1.5 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 shadow-sm">
      {children}
    </kbd>
  )
}

// ─── Toast-style shortcut action feedback ─────────────────────────────────────
export function ShortcutActionBadge({ action }: { action: string | null }) {
  if (!action) return null
  return (
    <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
        <kbd className="font-mono opacity-70">{action}</kbd>
      </div>
    </div>
  )
}

// ─── Hook for FAB to listen to shortcut events ────────────────────────────────
export function useShortcutEvents(
  handlers: {
    onNewCustomer?: () => void
    onNewInvoice?: () => void
    onNewPayment?: () => void
  }
) {
  useEffect(() => {
    const h1 = () => handlers.onNewCustomer?.()
    const h2 = () => handlers.onNewInvoice?.()
    const h3 = () => handlers.onNewPayment?.()
    document.addEventListener("cn:new-customer", h1)
    document.addEventListener("cn:new-invoice", h2)
    document.addEventListener("cn:new-payment", h3)
    return () => {
      document.removeEventListener("cn:new-customer", h1)
      document.removeEventListener("cn:new-invoice", h2)
      document.removeEventListener("cn:new-payment", h3)
    }
  }, [handlers.onNewCustomer, handlers.onNewInvoice, handlers.onNewPayment])
}
