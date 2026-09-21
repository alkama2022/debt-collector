// i18n — Nigerian Multilingual System (registry scalable, first-class en/ha/yo/ig/pcm)
export * from "./registry"
export * from "./translations"
import { translate } from "./translations"
import { DEFAULT_LANGUAGE } from "./registry"

function currentLang(): string {
  if (typeof localStorage !== "undefined") {
    return localStorage.getItem("cn_dashboard_lang") || localStorage.getItem("cn_lang") || DEFAULT_LANGUAGE
  }
  return DEFAULT_LANGUAGE
}

/** Legacy helper: t(key, fallback?) — now language-aware via dashboard setting */
export const t = (key: string, fallback?: string, vars?: Record<string, string | number>) => {
  const lang = currentLang()
  const v = translate(key, lang, vars)
  if (v === key && fallback) return fallback
  return v
}

export const locale = "en-NG"
export const currency = "NGN"
