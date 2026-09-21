// i18n scaffolding: translation keys prepared for global expansion.
// Default locale English (Nigeria). Add locales without rewriting components.
// Usage: t("dashboard.total_outstanding") — falls back to key.

const enNG: Record<string, string> = {
  "app.tagline": "Collect what you're owed. Stay in control.",
  "nav.home": "Home", "nav.customers": "Customers", "nav.invoices": "Invoices", "nav.payments": "Payments", "nav.more": "More",
  "dashboard.greeting": "Good morning",
  "dashboard.total_outstanding": "Total Outstanding",
  "dashboard.due_today": "Due Today",
  "dashboard.overdue": "Overdue",
  "dashboard.collected_month": "Collected This Month",
  "cta.start_free": "Start Free",
  "cta.see_how": "See How It Works",
  "empty.customers.title": "No customers yet",
  "empty.customers.desc": "Add your first customer to start tracking payments.",
  "empty.invoices.title": "No invoices yet",
  "empty.payments.title": "No payments yet",
}

export const t = (key: string, fallback?: string) => enNG[key] ?? fallback ?? key
export const locale = "en-NG"
export const currency = "NGN"
