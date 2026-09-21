export type LanguageCode = "en" | "ha" | "yo" | "ig" | "pcm" | "ff" | "kr" | "tiv"

export interface Language {
  code: LanguageCode
  name: string
  native_name: string
  locale: string
  active: boolean
  flag?: string
}

/**
 * Nigerian Multilingual Registry — scalable.
 * Add new entries with active:true to surface in selectors without rewriting components.
 * Inactive languages are returned by API but hidden in UI until backend enables.
 */
export const LANGUAGES: Language[] = [
  { code: "en",  name: "English",           native_name: "English",          locale: "en-NG", active: true,  flag: "🇳🇬" },
  { code: "ha",  name: "Hausa",             native_name: "Hausa",             locale: "ha-NG", active: true,  flag: "🇳🇬" },
  { code: "yo",  name: "Yoruba",            native_name: "Yorùbá",            locale: "yo-NG", active: true,  flag: "🇳🇬" },
  { code: "ig",  name: "Igbo",              native_name: "Igbo",              locale: "ig-NG", active: true,  flag: "🇳🇬" },
  { code: "pcm", name: "Nigerian Pidgin",   native_name: "Naija Pidgin",      locale: "pcm-NG", active: true,  flag: "🇳🇬" },
  // Future — registered but inactive until backend enables
  { code: "ff",  name: "Fula",              native_name: "Fulfulde",          locale: "ff-NG", active: false, flag: "🇳🇬" },
  { code: "kr",  name: "Kanuri",            native_name: "Kanuri",            locale: "kr-NG", active: false, flag: "🇳🇬" },
  { code: "tiv", name: "Tiv",               native_name: "Tiv",               locale: "tiv-NG", active: false, flag: "🇳🇬" },
]

export const ACTIVE_LANGUAGES: Language[] = LANGUAGES.filter(l => l.active)
export const INACTIVE_LANGUAGES: Language[] = LANGUAGES.filter(l => !l.active)

export function getLanguage(code: string | null | undefined): Language | undefined {
  if (!code) return undefined
  return LANGUAGES.find(l => l.code === code.toLowerCase() as LanguageCode)
}

export function isActive(code: string | null | undefined): boolean {
  if (!code) return false
  const lang = getLanguage(code)
  return !!lang?.active
}

export function getActiveCodes(): LanguageCode[] {
  return ACTIVE_LANGUAGES.map(l => l.code)
}

/** Human label e.g. "Yorùbá (Yoruba)" */
export function displayLanguage(code: string | null | undefined): string {
  const l = getLanguage(code || "en")
  if (!l) return code || "Unknown"
  return `${l.native_name} (${l.name})`
}

export const DEFAULT_LANGUAGE: LanguageCode = "en"
export const DEFAULT_FALLBACK: LanguageCode = "en"
