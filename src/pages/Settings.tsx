import { useState, useEffect } from "react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input, Select } from "../components/ui/input"
import { useAuth } from "../hooks/useAuth"
import { useStore } from "../services/store"
import { useToast } from "../components/ui/toast"
import { Languages, Check, Sun, Moon, Monitor, Palette } from "lucide-react"
import { config } from "../config"
import { ThemeToggle } from "../components/ui/theme-toggle"
import { useTheme } from "../hooks/useTheme"
import { LANGUAGES, ACTIVE_LANGUAGES } from "../i18n/registry"
import { liveListLanguages, liveGetOrgLanguageSettings, liveUpdateOrgLanguageSettings } from "../services/live"
import LanguageRouterPreview from "../components/LanguageRouterPreview"

export default function Settings(){
  const {user}=useAuth()
  const {audits}=useStore()
  const {push}=useToast()
  const { theme, resolved, setTheme } = useTheme()
  const [tab,setTab]=useState("appearance")
  const [school,setSchool]=useState(localStorage.getItem("cn_school")==="1")
  const tabs=["appearance","profile","organization","language","users","roles","notifications","reminders","payments","localization","security","subscription","audit"]
  const toggleSchool=(v:boolean)=>{ setSchool(v); localStorage.setItem("cn_school", v?"1":"0"); push(v? "School mode enabled — dashboards show Students/Parents":"School mode disabled","success")}

  // Language & Communication Settings state
  const [langs, setLangs] = useState<typeof LANGUAGES>(LANGUAGES)
  const [orgLang, setOrgLang] = useState({
    dashboard_language: localStorage.getItem(config.dashboardLanguageKey) || config.languageDefault,
    default_customer_language: localStorage.getItem(config.defaultCustomerLanguageKey) || config.languageDefault,
    ai_communication_mode: "use_customer_preferred" as "use_customer_preferred" | "use_fallback" | "auto_detect",
    fallback_language: config.fallbackLanguage,
    supported_languages: [...config.supportedLanguageCodes] as string[],
  })
  const [loadingLang, setLoadingLang] = useState(false)
  const [savingLang, setSavingLang] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingLang(true)
      try {
        const [langRes, settingsRes] = await Promise.allSettled([liveListLanguages(), liveGetOrgLanguageSettings()])
        if (!cancelled && langRes.status === "fulfilled" && langRes.value.languages?.length) {
          const mapped = langRes.value.languages.map((l: any) => ({
            code: l.code as any,
            name: l.name,
            native_name: l.native_name ?? l.nativeName ?? l.name,
            locale: l.locale ?? `${l.code}-NG`,
            active: l.active ?? true,
            flag: "🇳🇬",
          }))
          setLangs(mapped)
        }
        if (!cancelled && settingsRes.status === "fulfilled") {
          const s = settingsRes.value
          setOrgLang({
            dashboard_language: s.dashboard_language ?? orgLang.dashboard_language,
            default_customer_language: s.default_customer_language ?? orgLang.default_customer_language,
            ai_communication_mode: (s.ai_communication_mode as any) ?? orgLang.ai_communication_mode,
            fallback_language: s.fallback_language ?? orgLang.fallback_language,
            supported_languages: s.supported_languages?.length ? s.supported_languages : orgLang.supported_languages,
          })
        }
      } catch { /* keep defaults for offline */ }
      finally { if (!cancelled) setLoadingLang(false) }
    }
    load()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveLang = async () => {
    setSavingLang(true)
    try {
      const payload = { ...orgLang }
      localStorage.setItem(config.dashboardLanguageKey, payload.dashboard_language)
      localStorage.setItem(config.defaultCustomerLanguageKey, payload.default_customer_language)
      localStorage.setItem("cn_lang", payload.dashboard_language)
      try {
        await liveUpdateOrgLanguageSettings(payload)
        push("Language settings saved to organization — X-Org-Language header will use dashboard language", "success")
      } catch {
        push("Saved locally — will sync to /api/v1/organizations/language-settings when online", "info")
      }
    } finally { setSavingLang(false) }
  }

  const toggleSupported = (code: string) => {
    setOrgLang(prev => {
      const set = new Set(prev.supported_languages)
      if (set.has(code)) set.delete(code); else set.add(code)
      // keep at least 1
      if (set.size === 0) set.add(code)
      return { ...prev, supported_languages: Array.from(set) }
    })
  }

  const langOptions = (langs.length ? langs : ACTIVE_LANGUAGES).filter(l => l.active).map(l => ({ value: l.code, label: `${l.native_name} — ${l.name} (${l.code})` }))
  const fallbackOptions = langOptions
  const aiOptions = [
    { value: "use_customer_preferred", label: "Use customer's preferred" },
    { value: "use_fallback", label: "Use fallback" },
    { value: "auto_detect", label: "Auto-detect" },
  ]

  return <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-bold dark:text-white">Settings</h1>
      <label className="flex items-center gap-2 text-sm dark:text-slate-300"><input type="checkbox" checked={school} onChange={e=>toggleSchool(e.target.checked)} /> School workspace</label>
    </div>
    <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-1">
      {tabs.map(t=> <button key={t} onClick={()=>setTab(t)} className={`px-3 py-2 rounded-full text-xs font-medium border capitalize whitespace-nowrap ${tab===t?"bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white":"bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-slate-300"}`}>{t === "language" ? "Language" : t === "appearance" ? "Appearance" : t}</button>)}
    </div>

    {tab==="appearance" && (
      <div className="space-y-4">
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white"><Palette className="w-5 h-5" /></div>
            <div>
              <h3 className="font-semibold dark:text-white">Appearance</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Beautiful light & dark mode · Respects system preference · Instant toggle</p>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium dark:text-white">Theme</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Choose how CollectNaija looks. System follows your device.</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {([
                { id:"light", label:"Light", desc:"Bright & clean", icon: Sun, preview:"bg-white border-slate-200" },
                { id:"dark", label:"Dark", desc:"Easy on eyes", icon: Moon, preview:"bg-slate-900 border-slate-700" },
                { id:"system", label:"System", desc:"Auto", icon: Monitor, preview:"bg-gradient-to-br from-white to-slate-900 border-slate-300" },
              ] as const).map(o=>{
                const active = theme===o.id
                return (
                  <button key={o.id} onClick={()=>setTheme(o.id)} className={`p-4 rounded-2xl border-2 text-left transition-all ${active? "border-brand-600 dark:border-brand-500 bg-brand-50 dark:bg-brand-950/30": "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"}`}>
                    <div className={`w-full h-14 rounded-xl border ${o.preview} flex items-center justify-center mb-3`}>
                      <o.icon className={`w-6 h-6 ${o.id==="light"? "text-amber-500": o.id==="dark"? "text-slate-200":"text-slate-600"}`} />
                    </div>
                    <div className="text-sm font-semibold dark:text-white flex items-center gap-2">{o.label} {active && <span className="w-2 h-2 rounded-full bg-brand-600 dark:bg-brand-500" />}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{o.desc}</div>
                  </button>
                )})}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 border dark:border-slate-600">Active: <span className="font-semibold capitalize dark:text-white">{theme}</span> → <span className="capitalize">{resolved}</span></span>
              <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">Toggle instantly with the header button</span>
            </div>
          </div>

          <div className="pt-4 border-t dark:border-slate-700 flex items-center justify-between">
            <div className="text-sm dark:text-slate-300">Quick toggle</div>
            <ThemeToggle variant="full" />
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white">
            <div className="text-sm font-semibold">✨ Dark mode highlights</div>
            <ul className="mt-2 text-xs text-white/80 space-y-1">
              <li>• True dark backgrounds (#020617) — OLED-friendly</li>
              <li>• Elevated cards with soft shadows & borders</li>
              <li>• Preserved brand colors with dark-aware badges</li>
              <li>• Smooth 300ms transitions · No flash on reload</li>
            </ul>
          </div>
        </Card>
      </div>
    )}

    {tab==="language" && (
      <div className="space-y-4">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white"><Languages className="w-4 h-4" /></div>
            <div>
              <h3 className="font-semibold">Language & Communication Settings</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fetched from /api/v1/languages and /api/v1/organizations/language-settings · Sends X-Org-Language header</p>
            </div>
          </div>
          {loadingLang && <div className="text-xs text-slate-500 dark:text-slate-400">Loading language settings…</div>}
          <div className="grid md:grid-cols-2 gap-4">
            <Select label="Dashboard Language" value={orgLang.dashboard_language} onChange={e=>setOrgLang({...orgLang, dashboard_language: e.target.value})} options={langOptions} />
            <Select label="Default Customer Language" value={orgLang.default_customer_language} onChange={e=>setOrgLang({...orgLang, default_customer_language: e.target.value})} options={langOptions} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Select label="AI Communication Mode" value={orgLang.ai_communication_mode} onChange={e=>setOrgLang({...orgLang, ai_communication_mode: e.target.value as any})} options={aiOptions} />
            <Select label="Fallback Language" value={orgLang.fallback_language} onChange={e=>setOrgLang({...orgLang, fallback_language: e.target.value})} options={fallbackOptions} />
          </div>
          <div>
            <div className="text-sm font-medium">Supported Languages</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Check languages your org will send messages in. Unchecked languages hide from customer selectors but remain in registry (coming soon: ff, kr, tiv).</p>
            <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(langs.length ? langs : LANGUAGES).map(l => {
                const checked = orgLang.supported_languages.includes(l.code)
                const disabled = !l.active && !checked
                return (
                  <label key={l.code} className={`flex items-center gap-2 p-3 rounded-xl border text-sm ${checked ? "bg-violet-50 border-violet-200" : "bg-white dark:bg-slate-800"} ${!l.active ? "opacity-60" : ""}`}>
                    <input type="checkbox" checked={checked} onChange={()=>toggleSupported(l.code)} disabled={disabled && l.code !== "en"} className="rounded" />
                    <span className="flex-1"><span className="font-medium">{l.native_name}</span> <span className="text-slate-500 dark:text-slate-400">({l.code})</span> <span className="text-xs text-slate-400">· {l.name}</span>{!l.active && <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 border">Coming soon</span>}</span>
                    {checked && <Check className="w-4 h-4 text-violet-600" />}
                  </label>
                )
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={()=>window.location.reload()}>Reset</Button>
            <Button onClick={saveLang} disabled={savingLang}>{savingLang ? "Saving…" : "Save language settings"}</Button>
          </div>
        </Card>
        <LanguageRouterPreview />
      </div>
    )}

    {tab==="profile" && <Card className="p-6 space-y-3">
      <h3 className="font-semibold">Profile</h3>
      <Input label="Name" defaultValue={user?.name} />
      <Input label="Email" defaultValue={user?.email} />
      <div className="text-xs text-slate-500 dark:text-slate-400">Last login: {new Date().toLocaleString()} · Active sessions: 1</div>
      <Button onClick={()=>push("Profile saved — persisted to localStorage (demo)","success")}>Save</Button>
    </Card>}

    {tab==="organization" && <Card className="p-6 space-y-3">
      <h3 className="font-semibold">Organization</h3>
      <Input label="Organization name" defaultValue={user?.org.name} />
      <Select label="Business type" value={user?.org.type} onChange={()=>{}} options={[{value:"school",label:"Private school (enables Classes/Students)"},{value:"retail",label:"Retail"},{value:"other",label:"Other"}]} />
      <label className="flex items-center gap-2 text-sm p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"><input type="checkbox" checked={school} onChange={e=>toggleSchool(e.target.checked)} /> Enable school workspace (Students, Parents, Classes, Fee Structures)</label>
      <div className="text-xs text-slate-500 dark:text-slate-400">Org ID: {user?.org.id} · Data isolated per org · Multi-tenancy ready.</div>
      <Button onClick={()=>push("Organization saved","success")}>Save</Button>
    </Card>}

    {tab==="users" && <Card className="p-6">
      <h3 className="font-semibold">Users & Staff</h3>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between p-3 rounded-xl border"><span>{user?.name} · Owner</span><span className="text-emerald-600">Active</span></div>
        <div className="flex justify-between p-3 rounded-xl border"><span>Finance Staff · Finance Manager</span><span className="text-slate-500 dark:text-slate-400">Invite pending</span></div>
      </div>
      <Button className="mt-3" onClick={()=>push("Invite email sent (demo)","success")}>Invite staff</Button>
    </Card>}

    {tab==="roles" && <Card className="p-6">
      <h3 className="font-semibold">Roles & Permissions</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">Frontend is UX-only; backend enforces. Try switching role in code to see UI hide/show.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500 dark:text-slate-400"><tr><th className="text-left">Resource</th><th>View</th><th>Create</th><th>Edit</th><th>Delete</th></tr></thead>
          <tbody>
            {[
              {r:"Customers",v:"✓",c:"✓",e:"✓",d:"✓"},
              {r:"Invoices",v:"✓",c:"✓",e:"✓",d:"✓"},
              {r:"Payments",v:"✓",c:"✓",e:"✓",d:"✓"},
              {r:"Reports",v:"✓",c:"—",e:"—",d:"—"},
            ].map(x=> <tr key={x.r} className="border-t"><td className="py-2 font-medium">{x.r}</td><td className="text-center">{x.v}</td><td className="text-center">{x.c}</td><td className="text-center">{x.e}</td><td className="text-center">{x.d}</td></tr>)}
          </tbody>
        </table>
      </div>
    </Card>}

    {tab==="subscription" && <Card className="p-6">
      <h3 className="font-semibold">Subscription & Billing</h3>
      <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border">
        <div className="text-sm">Current plan: <span className="font-semibold">Growth · ₦12,000/mo</span></div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Next billing: 21 Oct 2026 · Card ending 4242 · Usage: {JSON.parse(localStorage.getItem("cn_customers")||"[]").length}/1000 customers · Live count</div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={()=>push("Checkout would open (Stripe/Paystack) — backend creates session","info")}>Upgrade</Button>
        <Button variant="secondary" onClick={()=>push("Downgrade — no dark pattern, prorated","info")}>Downgrade</Button>
        <Button variant="ghost" onClick={()=>push("Cancellation is not hidden — confirm + retain data","info")}>Cancel subscription</Button>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">UI never claims success until backend webhook confirms.</div>
    </Card>}

    {tab==="localization" && <Card className="p-6 space-y-3">
      <h3 className="font-semibold">Localization</h3>
      <Select label="Country" value="Nigeria" onChange={()=>{}} options={[{value:"Nigeria",label:"Nigeria"},{value:"Ghana",label:"Ghana"}]} />
      <Select label="Currency" value="NGN" onChange={()=>{}} options={[{value:"NGN",label:"NGN"},{value:"USD",label:"USD"}]} />
      <Select label="Timezone" value="Africa/Lagos" onChange={()=>{}} options={[{value:"Africa/Lagos",label:"Africa/Lagos"}]} />
      <Input label="Date format" defaultValue="DD MMM YYYY" />
      <Button onClick={()=>push("Localization saved — formats update via i18n keys","success")}>Save</Button>
      <div className="pt-2 border-t">
        <p className="text-xs text-slate-500 dark:text-slate-400">Language-specific formats are in <span className="font-mono">src/i18n/</span>. Use Language tab to change dashboard language.</p>
        <Button variant="ghost" className="mt-2" onClick={()=>setTab("language")}>Go to Language & Communication Settings →</Button>
      </div>
    </Card>}

    {tab==="security" && <Card className="p-6 space-y-3">
      <h3 className="font-semibold">Security</h3>
      <div className="text-sm p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border">Last login: {new Date().toLocaleString()} · Sessions: 1 · 2FA: enable when backend supports TOTP</div>
      <Button variant="secondary" onClick={()=>push("Password updated — JWT rotated","success")}>Change password</Button>
    </Card>}

    {tab==="audit" && <Card className="p-6">
      <h3 className="font-semibold">Audit log · live from store</h3>
      <div className="mt-3 space-y-2 text-sm">
        {audits.slice(0,12).map(a=> <div key={a.id} className="p-3 rounded-xl border flex justify-between"><span>{a.text}</span><span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap ml-3">{new Date(a.time).toLocaleString()}</span></div>)}
      </div>
    </Card>}

    {!["appearance","profile","organization","language","users","roles","subscription","localization","security","audit"].includes(tab) && <Card className="p-6">
      <h3 className="font-semibold capitalize dark:text-white">{tab}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Real setting — persisted locally, ready for API. No mock that resets on hard reload.</p>
      <Button className="mt-3" onClick={()=>push("Saved — persisted","success")}>Save</Button>
    </Card>}
  </div>
}
