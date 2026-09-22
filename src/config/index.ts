// ─── API Base URL ─────────────────────────────────────────────────────────────
// Vite injects VITE_* vars at build time from the root .env file.
// For local dev: set VITE_API_BASE_URL=http://localhost:8000/api/v1 in .env
// For production: set VITE_API_BASE_URL=https://naijacollector.onrender.com/api/v1
const rawApiBase = (import.meta as any).env.VITE_API_BASE_URL as string | undefined

// Never fall back to a fake/example domain — fail loudly in dev
const apiBaseUrl = rawApiBase && !rawApiBase.includes("example")
  ? rawApiBase.replace(/\/$/, "") // strip trailing slash
  : "http://localhost:8000/api/v1" // safe local default

export const config = {
  apiBaseUrl,
  appName: "CollectNaija",
  supportEmail: "support@collectnaija.com",
  currencyDefault: "NGN",
  countryDefault: "NG",
  timezoneDefault: "Africa/Lagos",
  languageDefault: "en" as string,
  fallbackLanguage: "en" as string,
  dashboardLanguageKey: "cn_dashboard_lang",
  defaultCustomerLanguageKey: "cn_default_customer_lang",
  supportedLanguageCodes: ["en", "ha", "yo", "ig", "pcm"] as string[],
  aiCommunicationModes: [
    { value: "use_customer_preferred", label: "Use customer's preferred" },
    { value: "use_fallback", label: "Use fallback" },
    { value: "auto_detect", label: "Auto-detect" },
  ] as const,
}

export const isDemo = () => localStorage.getItem("cn_demo") === "1"

export const languageDefaults = {
  dashboard: (localStorage.getItem(config.dashboardLanguageKey) as string) || config.languageDefault,
  fallback: config.fallbackLanguage,
  defaultCustomer: (localStorage.getItem(config.defaultCustomerLanguageKey) as string) || config.languageDefault,
}
