export const config = {
  apiBaseUrl: (import.meta as any).env.VITE_API_BASE_URL || "https://api.collectnaija.example/v1",
  appName: "CollectNaija",
  supportEmail: "support@collectnaija.com",
  currencyDefault: "NGN",
  countryDefault: "NG",
  timezoneDefault: "Africa/Lagos",
  languageDefault: "en" as const,
  fallbackLanguage: "en" as const,
  dashboardLanguageKey: "cn_dashboard_lang",
  defaultCustomerLanguageKey: "cn_default_customer_lang",
  supportedLanguageCodes: ["en", "ha", "yo", "ig", "pcm"] as const,
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
