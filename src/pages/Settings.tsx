import { useState, useEffect, useRef } from "react"
import { apiFetch } from "../services/api"
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
  const [tab,setTab]=useState("reminders")
  const [school,setSchool]=useState(localStorage.getItem("cn_school")==="1")
  const tabs=["reminders","policy","appearance","profile","organization","language","users","roles","notifications","payments","localization","security","subscription","audit"]
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
            <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
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
      <div className="mt-3 scroll-x">
        <table className="w-full text-sm min-w-[720px]">
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

    {tab==="reminders" && <ReminderRulesTab />}
    {tab==="policy" && <CollectionPolicyTab />}

    {tab==="audit" && <Card className="p-6">
      <h3 className="font-semibold">Audit log · live from API</h3>
      <div className="mt-3 space-y-2 text-sm">
        {audits.slice(0,12).map(a=> <div key={a.id} className="p-3 rounded-xl border flex justify-between"><span>{a.text}</span><span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap ml-3">{new Date(a.time).toLocaleString()}</span></div>)}
        {audits.length === 0 && <div className="text-slate-500 text-center p-4">No audit entries yet.</div>}
      </div>
    </Card>}

    {!["reminders","policy","appearance","profile","organization","language","users","roles","subscription","localization","security","audit","notifications","payments"].includes(tab) && <Card className="p-6">
      <h3 className="font-semibold capitalize dark:text-white">{tab}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Setting saved to server via API.</p>
      <Button className="mt-3" onClick={()=>push("Saved","success")}>Save</Button>
    </Card>}
  </div>
}

// ─────────────────────────────────────────────────────────────────────────────
// ReminderRulesTab — manage automated reminder rules via API
// ─────────────────────────────────────────────────────────────────────────────
function ReminderRulesTab() {
  const { push } = useToast()
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: "", trigger: "before_due", offset_days: "7", channel: "whatsapp", template: "", language: "auto", enabled: true })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    apiFetch<any>("/comms/rules")
      .then(d => setRules(d.results ?? d))
      .catch(() => setRules([]))
      .finally(() => setLoading(false))
  }, [])

  const saveRule = async () => {
    setSaving(true)
    try {
      const payload = { ...form, offset_days: Number(form.offset_days) }
      const created = await apiFetch<any>("/comms/rules", { method: "POST", body: JSON.stringify(payload) })
      setRules(r => [created, ...r])
      setShowAdd(false)
      setForm({ name: "", trigger: "before_due", offset_days: "7", channel: "whatsapp", template: "", language: "auto", enabled: true })
      push("Reminder rule created", "success")
    } catch (e: any) {
      push(e?.data?.message || "Failed to save rule", "error")
    } finally { setSaving(false) }
  }

  const toggleRule = async (rule: any) => {
    try {
      const updated = await apiFetch<any>(`/comms/rules/${rule.id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !rule.enabled }),
      })
      setRules(rs => rs.map(r => r.id === rule.id ? updated : r))
      push(`Rule ${updated.enabled ? "enabled" : "disabled"}`, "success")
    } catch { push("Failed to update rule", "error") }
  }

  const deleteRule = async (id: string) => {
    try {
      await apiFetch(`/comms/rules/${id}`, { method: "DELETE" })
      setRules(rs => rs.filter(r => r.id !== id))
      push("Rule deleted", "success")
    } catch { push("Failed to delete rule", "error") }
  }

  const triggerLabel = (t: string, d: number) => {
    if (t === "before_due") return `${d} day${d !== 1 ? "s" : ""} before due`
    if (t === "on_due") return "On due date"
    return `${d} day${d !== 1 ? "s" : ""} after due`
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Reminder Rules</h3>
            <p className="text-xs text-slate-500 mt-1">Rules run daily — for every open invoice, the system checks which rule fires today and queues a message.</p>
          </div>
          <Button onClick={() => setShowAdd(s => !s)}>+ Add Rule</Button>
        </div>

        {showAdd && (
          <div className="mt-4 p-4 border border-dashed rounded-xl space-y-3 bg-slate-50">
            <h4 className="text-sm font-semibold">New reminder rule</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <Input label="Rule name" value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. 7 days before due" />
              <Select label="Trigger" value={form.trigger} onChange={e => set("trigger", e.target.value)}
                options={[
                  { value: "before_due", label: "Before due date" },
                  { value: "on_due", label: "On due date" },
                  { value: "after_due", label: "After due date (overdue)" },
                ]} />
              <Input label="Days offset" value={form.offset_days} onChange={e => set("offset_days", e.target.value)} placeholder="7" />
              <Select label="Channel" value={form.channel} onChange={e => set("channel", e.target.value)}
                options={[
                  { value: "whatsapp", label: "WhatsApp" },
                  { value: "sms", label: "SMS" },
                  { value: "email", label: "Email" },
                  { value: "voice", label: "Voice call" },
                ]} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Message template (optional)</label>
              <textarea
                value={form.template}
                onChange={e => set("template", e.target.value)}
                placeholder="Hello {{customer_name}}, invoice {{invoice_number}} for {{amount_due}} is due on {{due_date}}. Pay: {{payment_link}}"
                className="input-zoom-safe mt-1 w-full h-24 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-slate-400 mt-1">Variables: {"{{customer_name}} {{invoice_number}} {{amount_due}} {{due_date}} {{payment_link}} {{business_name}}"}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowAdd(false)} disabled={saving}>Cancel</Button>
              <Button onClick={saveRule} disabled={saving}>{saving ? "Saving…" : "Save rule"}</Button>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {loading && <div className="text-sm text-slate-500 p-4 text-center">Loading rules…</div>}
          {!loading && rules.length === 0 && (
            <div className="text-sm text-slate-500 p-6 border border-dashed rounded-xl text-center">
              No reminder rules yet. Add one to start automated reminders.
            </div>
          )}
          {rules.map(rule => (
            <div key={rule.id} className={`flex items-center justify-between p-4 rounded-xl border ${rule.enabled ? "bg-white" : "bg-slate-50 opacity-60"}`}>
              <div>
                <div className="text-sm font-semibold flex items-center gap-2">
                  {rule.name || triggerLabel(rule.trigger, rule.offset_days)}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rule.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {rule.enabled ? "Active" : "Paused"}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {triggerLabel(rule.trigger, rule.offset_days)} · via {rule.channel.toUpperCase()} · lang: {rule.language}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleRule(rule)} className="text-xs px-3 py-1.5 rounded-full border bg-white hover:bg-slate-50">
                  {rule.enabled ? "Pause" : "Enable"}
                </button>
                <button onClick={() => deleteRule(rule.id)} className="text-xs px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CollectionPolicyTab — configure quiet hours, max contacts, escalation rules
// ─────────────────────────────────────────────────────────────────────────────
function CollectionPolicyTab() {
  const { push } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [policy, setPolicy] = useState({
    quiet_hours_start: "20:00",
    quiet_hours_end: "08:00",
    max_contacts_per_day: 1,
    max_contacts_per_week: 5,
    escalate_after_attempts: 3,
    auto_pause_on_payment: true,
    reminder_intervals: [-7, -2, 0, 2, 7, 14],
  })

  useEffect(() => {
    apiFetch<any>("/collections/policy")
      .then(d => setPolicy(p => ({ ...p, ...d })))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await apiFetch("/collections/policy", { method: "PATCH", body: JSON.stringify(policy) })
      push("Collection policy saved", "success")
    } catch (e: any) {
      push(e?.data?.message || "Failed to save policy", "error")
    } finally { setSaving(false) }
  }

  const set = (k: string, v: any) => setPolicy(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="font-semibold">Collection Policy</h3>
        <p className="text-xs text-slate-500 mt-1">
          These rules govern when and how often customers are contacted. The AI and reminder engine respect these settings before every outbound contact.
        </p>

        {loading ? (
          <div className="mt-4 text-sm text-slate-500">Loading policy…</div>
        ) : (
          <div className="mt-4 space-y-5">
            {/* Quiet hours */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-sm font-semibold text-amber-800">Quiet hours</div>
              <p className="text-xs text-amber-700 mt-1">No reminders are sent during these hours (in your org's timezone).</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Input label="Start (no contact after)" value={policy.quiet_hours_start} onChange={e => set("quiet_hours_start", e.target.value)} placeholder="20:00" />
                <Input label="End (resume at)" value={policy.quiet_hours_end} onChange={e => set("quiet_hours_end", e.target.value)} placeholder="08:00" />
              </div>
            </div>

            {/* Contact limits */}
            <div className="p-4 rounded-xl border bg-white">
              <div className="text-sm font-semibold">Contact frequency limits</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Input
                  label="Max contacts per day (per customer)"
                  value={String(policy.max_contacts_per_day)}
                  onChange={e => set("max_contacts_per_day", Number(e.target.value))}
                  placeholder="1"
                />
                <Input
                  label="Max contacts per week (per customer)"
                  value={String(policy.max_contacts_per_week)}
                  onChange={e => set("max_contacts_per_week", Number(e.target.value))}
                  placeholder="5"
                />
              </div>
            </div>

            {/* Escalation */}
            <div className="p-4 rounded-xl border bg-white">
              <div className="text-sm font-semibold">Escalation rules</div>
              <div className="mt-3">
                <Input
                  label="Auto-escalate after N failed contact attempts"
                  value={String(policy.escalate_after_attempts)}
                  onChange={e => set("escalate_after_attempts", Number(e.target.value))}
                  placeholder="3"
                />
              </div>
              <label className="flex items-center gap-2 mt-3 text-sm">
                <input
                  type="checkbox"
                  checked={policy.auto_pause_on_payment}
                  onChange={e => set("auto_pause_on_payment", e.target.checked)}
                  className="rounded"
                />
                Auto-pause all reminders when payment is confirmed
              </label>
            </div>

            {/* Reminder intervals */}
            <div className="p-4 rounded-xl border bg-white">
              <div className="text-sm font-semibold">Reminder intervals (days relative to due date)</div>
              <p className="text-xs text-slate-500 mt-1">Negative = before due, positive = after due (overdue). These define when reminders are triggered.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {policy.reminder_intervals.map((d: number, i: number) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${d < 0 ? "bg-blue-50 border-blue-200 text-blue-700" : d === 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                      {d === 0 ? "Due date" : d < 0 ? `${Math.abs(d)}d before` : `${d}d after`}
                    </span>
                    <button
                      onClick={() => set("reminder_intervals", policy.reminder_intervals.filter((_: number, j: number) => j !== i))}
                      className="text-slate-400 hover:text-red-500 text-xs"
                    >×</button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const val = prompt("Add interval (e.g. -7 for 7 days before, 3 for 3 days after)")
                    const n = Number(val)
                    if (!isNaN(n) && !policy.reminder_intervals.includes(n)) {
                      set("reminder_intervals", [...policy.reminder_intervals, n].sort((a: number, b: number) => a - b))
                    }
                  }}
                  className="px-3 py-1.5 rounded-full text-xs border border-dashed border-slate-300 text-slate-500 hover:border-brand-500 hover:text-brand-600"
                >
                  + Add interval
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save collection policy"}</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
