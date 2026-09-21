import type { LanguageCode } from "./registry"

type Dict = Record<string, string>

const en: Dict = {
  // navigation / app
  "app.tagline": "Collect what you're owed. Stay in control.",
  "nav.home": "Home", "nav.customers": "Customers", "nav.invoices": "Invoices", "nav.payments": "Payments",
  // dashboard
  "dashboard.greeting": "Good morning",
  "dashboard.total_outstanding": "Total Outstanding",
  "dashboard.due_today": "Due Today",
  "dashboard.overdue": "Overdue",
  "dashboard.collected_month": "Collected This Month",
  "dashboard.outstanding_balance": "Outstanding balance",
  // customer
  "customer.add": "Add Customer",
  "customer.preferred_language": "Preferred Language",
  "customer.language_badge": "Preferred: {{language}}",
  "customer.language_history": "Language history",
  "customer.created": "{{name}} added",
  // invoice
  "invoice.total": "Total",
  "invoice.balance": "Balance",
  "invoice.outstanding_balance": "Outstanding balance",
  "invoice.amount_due": "Amount due: {{amount}}",
  // common
  "common.save": "Save",
  "common.cancel": "Cancel",
  // reminders / templates with {{vars}}
  "reminder.template.overdue": "Hello {{name}}, your invoice {{invoice}} of {{amount}} is overdue since {{due_date}}. Please pay promptly. Reply STOP to opt out.",
  "reminder.template.due_soon": "Hi {{name}}, friendly reminder: invoice {{invoice}} ({{amount}}) is due on {{due_date}}.",
  "reminder.template.receipt": "Thank you {{name}} — we received {{amount}} for invoice {{invoice}}. Outstanding balance: {{balance}}.",
  // empty states
  "empty.customers.title": "No customers yet",
  "empty.customers.desc": "Add your first customer to start tracking payments.",
}

const ha: Dict = {
  "app.tagline": "Karɓi kuɗinka. Kasance cikin iko.",
  "nav.home": "Gida", "nav.customers": "Abokan ciniki", "nav.invoices": "Rasitai", "nav.payments": "Biyan kuɗi",
  "dashboard.greeting": "Barka da safiya",
  "dashboard.total_outstanding": "Jimillar bashin da ake bi",
  "dashboard.due_today": "Na yau",
  "dashboard.overdue": "Ya wuce lokaci",
  "dashboard.collected_month": "Abin da aka karɓa a wannan wata",
  "dashboard.outstanding_balance": "Ragowar bashi",
  "customer.add": "Ƙara abokin ciniki",
  "customer.preferred_language": "Harshen da aka fi so",
  "customer.language_badge": "Harshe: {{language}}",
  "customer.language_history": "Tarihin harshe",
  "customer.created": "An ƙara {{name}}",
  "invoice.total": "Jimilla",
  "invoice.balance": "Ragowa",
  "invoice.outstanding_balance": "Ragowar bashi",
  "invoice.amount_due": "Kuɗin da ake bi: {{amount}}",
  "common.save": "Ajiye",
  "common.cancel": "Soke",
  "reminder.template.overdue": "Sannu {{name}}, rasit ɗinka {{invoice}} na {{amount}} ya wuce lokaci tun {{due_date}}. Don Allah biya da wuri. Amsa STOP don fita.",
  "reminder.template.due_soon": "Sannu {{name}}, tunatarwa: rasit {{invoice}} ({{amount}}) zai cika a {{due_date}}.",
  "reminder.template.receipt": "Na gode {{name}} — mun karɓi {{amount}} na rasit {{invoice}}. Ragowar bashi: {{balance}}.",
  "empty.customers.title": "Babu abokan ciniki tukuna",
  "empty.customers.desc": "Ƙara abokin cinikinka na farko don fara bibiyar biyan kuɗi.",
}

const yo: Dict = {
  "app.tagline": "Gba owó rẹ. Máa wà ní ìṣàkóso.",
  "nav.home": "Ilé", "nav.customers": "Oníbàárà", "nav.invoices": "Rísíìtì", "nav.payments": "Ìsanwó",
  "dashboard.greeting": "Ẹ kú àárọ̀",
  "dashboard.total_outstanding": "Gbogbo owó tí wọn jẹ",
  "dashboard.due_today": "Tó yẹ lónìí",
  "dashboard.overdue": "Tó ti kọjá",
  "dashboard.collected_month": "Tí a gbà ní oṣù yìí",
  "dashboard.outstanding_balance": "Iwọn owó tó kù",
  "customer.add": "Fi oníbàárà kún",
  "customer.preferred_language": "Èdè ayanfẹ́",
  "customer.language_badge": "Èdè: {{language}}",
  "customer.language_history": "Ìtàn èdè",
  "customer.created": "A ti fi {{name}} kún",
  "invoice.total": "Lápapọ̀",
  "invoice.balance": "Iyókù",
  "invoice.outstanding_balance": "Iwọn owó tó kù",
  "invoice.amount_due": "Owó tó yẹ: {{amount}}",
  "common.save": "Fipamọ́",
  "common.cancel": "Fagilé",
  "reminder.template.overdue": "Pẹlẹ o {{name}}, rísíìtì rẹ {{invoice}} ti {{amount}} ti kọjá ọjọ́ {{due_date}}. Jọwọ sanwó kíákíá. Firanṣẹ STOP láti jáde.",
  "reminder.template.due_soon": "Pẹlẹ {{name}}, ìránnilétí: rísíìtì {{invoice}} ({{amount}}) yóò tó ní {{due_date}}.",
  "reminder.template.receipt": "Ẹ ṣeun {{name}} — a gbà {{amount}} fún rísíìtì {{invoice}}. Iwọn owó tó kù: {{balance}}.",
  "empty.customers.title": "Kò sí oníbàárà síbẹ̀",
  "empty.customers.desc": "Fi oníbàárà àkọ́kọ́ rẹ kún láti bẹ̀rẹ̀ títọpin owó.",
}

const ig: Dict = {
  "app.tagline": "Nata ụgwọ gị. Nọrọ na njikwa.",
  "nav.home": "Ụlọ", "nav.customers": "Ndị ahịa", "nav.invoices": "Akwụkwọ ụgwọ", "nav.payments": "Ịkwụ ụgwọ",
  "dashboard.greeting": "Ụtụtụ ọma",
  "dashboard.total_outstanding": "Ngụkọta ụgwọ a na-achọ",
  "dashboard.due_today": "Taa",
  "dashboard.overdue": "Gafere oge",
  "dashboard.collected_month": "Anatara n'ọnwa a",
  "dashboard.outstanding_balance": "Ego fọdụrụ",
  "customer.add": "Tinye onye ahịa",
  "customer.preferred_language": "Asụsụ kachasị amasị",
  "customer.language_badge": "Asụsụ: {{language}}",
  "customer.language_history": "Akụkọ asụsụ",
  "customer.created": "Atinyela {{name}}",
  "invoice.total": "Mkpokọta",
  "invoice.balance": "Fọdụrụ",
  "invoice.outstanding_balance": "Ego fọdụrụ",
  "invoice.amount_due": "Ego ruru: {{amount}}",
  "common.save": "Chekwaa",
  "common.cancel": "Kagbuo",
  "reminder.template.overdue": "Ndewo {{name}}, akwụkwọ ụgwọ gị {{invoice}} nke {{amount}} agafeela oge kemgbe {{due_date}}. Biko kwụọ ngwa ngwa. Zaa STOP ị pụọ.",
  "reminder.template.due_soon": "Ndewo {{name}}, ncheta: akwụkwọ ụgwọ {{invoice}} ({{amount}}) ga-eru na {{due_date}}.",
  "reminder.template.receipt": "Daalụ {{name}} — anyị anatala {{amount}} maka akwụkwọ ụgwọ {{invoice}}. Ego fọdụrụ: {{balance}}.",
  "empty.customers.title": "Enweghị ndị ahịa ọzọ",
  "empty.customers.desc": "Tinye onye ahịa mbụ gị ka ịmalite nsochi ịkwụ ụgwọ.",
}

const pcm: Dict = {
  "app.tagline": "Collect your money. Stay for top.",
  "nav.home": "House", "nav.customers": "Customers", "nav.invoices": "Invoice", "nav.payments": "Payment",
  "dashboard.greeting": "Good morning",
  "dashboard.total_outstanding": "All money wey people dey owe",
  "dashboard.due_today": "Wey due today",
  "dashboard.overdue": "Wey don pass due date",
  "dashboard.collected_month": "Wey we collect dis month",
  "dashboard.outstanding_balance": "Money wey remain",
  "customer.add": "Add customer",
  "customer.preferred_language": "Language wey you like pass",
  "customer.language_badge": "Language: {{language}}",
  "customer.language_history": "Language history",
  "customer.created": "We don add {{name}}",
  "invoice.total": "Total",
  "invoice.balance": "Remain",
  "invoice.outstanding_balance": "Money wey remain",
  "invoice.amount_due": "Money wey you go pay: {{amount}}",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "reminder.template.overdue": "Hello {{name}}, your invoice {{invoice}} wey be {{amount}} don overdue since {{due_date}}. Abeg pay quick. Reply STOP if you no wan get message again.",
  "reminder.template.due_soon": "Hi {{name}}, na reminder be this: invoice {{invoice}} ({{amount}}) go due for {{due_date}}.",
  "reminder.template.receipt": "Thank you {{name}} — we don collect {{amount}} for invoice {{invoice}}. Money wey remain na {{balance}}.",
  "empty.customers.title": "No customer yet",
  "empty.customers.desc": "Add your first customer make you start to dey track payment.",
}

export const translations: Record<LanguageCode, Dict> = { en, ha, yo, ig, pcm, ff: en, kr: en, tiv: en }

/** Fallback chain: requested -> en */
export function translate(key: string, lang: string = "en", vars?: Record<string, string | number>): string {
  const code = (lang.toLowerCase() as LanguageCode)
  const dict = translations[code] ?? en
  let str = dict[key] ?? en[key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{{${k}}}`, String(v))
    }
  }
  return str
}

/** Convenience: curried translator hook-like */
export function getTranslator(lang: string) {
  return (key: string, vars?: Record<string, string | number>) => translate(key, lang, vars)
}

export const SUPPORTED_UI_KEYS = Object.keys(en)
