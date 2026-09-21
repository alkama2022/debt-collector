export const config = {
  apiBaseUrl: (import.meta as any).env.VITE_API_BASE_URL || "https://api.collectnaija.example/v1",
  appName: "CollectNaija",
  supportEmail: "support@collectnaija.com",
  currencyDefault: "NGN",
  countryDefault: "NG",
  timezoneDefault: "Africa/Lagos",
}

export const isDemo = () => localStorage.getItem("cn_demo") === "1"
