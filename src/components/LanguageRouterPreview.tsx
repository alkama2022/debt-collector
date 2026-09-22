import { useState } from "react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Input, Select, Textarea } from "./ui/input"
import { Badge, LanguageBadge } from "./ui/badge"
import { Languages, Sparkles, ArrowRight, AlertCircle } from "lucide-react"
import { ACTIVE_LANGUAGES, getLanguage } from "../i18n/registry"
import { translate } from "../i18n/translations"
import { liveDetectLanguage, liveResolveResponseLanguage, liveGetCustomerLanguage } from "../services/live"
import { useStore } from "../services/store"
import { formatCurrency } from "../utils/format"

export default function LanguageRouterPreview() {
  const { customers } = useStore()
  const [text, setText] = useState("Barka da yauwa, ina bin bashin ku")
  const [customerId, setCustomerId] = useState("")
  const [fallback, setFallback] = useState("en")
  const [mode, setMode] = useState<"use_customer_preferred" | "use_fallback" | "auto_detect">("auto_detect")

  const [detecting, setDetecting] = useState(false)
  const [detectRes, setDetectRes] = useState<{ detected_language: string; confidence: number; alternatives?: {code:string;confidence:number}[] } | null>(null)
  const [resolveRes, setResolveRes] = useState<{ response_language: string; source: string; detected?: string; confidence?: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [customerLang, setCustomerLang] = useState<string | null>(null)

  const doDetect = async () => {
    setError(null); setDetecting(true)
    try {
      const r = await liveDetectLanguage(text)
      setDetectRes(r)
      // also try resolve if customer selected
      if (customerId || text) {
        try {
          const res = await liveResolveResponseLanguage({ customerId: customerId || undefined, text })
          setResolveRes(res)
        } catch { /* ignore */ }
      }
      if (customerId) {
        try {
          const cl = await liveGetCustomerLanguage(customerId)
          setCustomerLang(cl.preferred_language)
        } catch { /* ignore */ }
      }
    } catch (e: any) {
      // Fallback local heuristic when API unavailable (demo)
      const t = text.toLowerCase()
      let heuristic = "en"; let conf = 0.52
      if (/sannu|bark|ina|yauwa|bashi|ragowar/.test(t)) { heuristic = "ha"; conf = 0.88 }
      else if (/p[eẹ]l[eẹ]|ku|ow[oọ]|ella|gbogbo/.test(t)) { heuristic = "yo"; conf = 0.86 }
      else if (/ndewo|ego|daalụ|kedu/.test(t)) { heuristic = "ig"; conf = 0.84 }
      else if (/wey|abeg|na |dey|don |how far/.test(t)) { heuristic = "pcm"; conf = 0.81 }
      setDetectRes({ detected_language: heuristic, confidence: conf, alternatives: [{ code: "en", confidence: 0.32 }] })
      setError(e?.data?.message ?? "API unavailable — showing local heuristic preview")
      // local resolve simulation
      const custLang = customerId ? customers.find(c => c.id === customerId)?.preferredLanguage : undefined
      let response = fallback
      let source: string = "fallback"
      if (mode === "use_customer_preferred" && custLang) { response = custLang; source = "customer_preferred" }
      else if (mode === "auto_detect") { response = heuristic; source = "auto_detected" }
      setResolveRes({ response_language: response, source, detected: heuristic, confidence: conf })
      if (custLang) setCustomerLang(custLang)
    } finally { setDetecting(false) }
  }

  const previewTemplate = (lang: string) => translate("reminder.template.overdue", lang, {
    name: "Musa", invoice: "INV-1024", amount: formatCurrency(25000), due_date: "20 Aug 2026"
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white"><Languages className="w-5 h-5" /></div>
        <div>
          <h2 className="font-semibold">Language Router Preview</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Detector demo: input text → detected language + confidence → response language resolution</p>
        </div>
      </div>

      <Card className="p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Select label="Customer (optional)" value={customerId} onChange={e => setCustomerId(e.target.value)} options={[{ value: "", label: "— No customer / generic text —" }, ...customers.map(c => ({ value: c.id, label: `${c.name} — ${c.preferredLanguage ?? "en"}` }))]} />
          <Select label="AI Communication Mode (preview)" value={mode} onChange={e => setMode(e.target.value as any)} options={[{ value: "use_customer_preferred", label: "Use customer's preferred" }, { value: "use_fallback", label: "Use fallback" }, { value: "auto_detect", label: "Auto-detect" }]} />
        </div>
        <Textarea label="Input text to detect language" value={text} onChange={e => setText(e.target.value)} placeholder='Try: "Barka da safiya" (Hausa) or "Ṣé owó mi wà?" (Yoruba) or "Wetin dey sup" (Pidgin)' rows={3} />
        <div className="grid md:grid-cols-2 gap-3">
          <Select label="Fallback language" value={fallback} onChange={e => setFallback(e.target.value)} options={ACTIVE_LANGUAGES.map(l => ({ value: l.code, label: `${l.native_name} (${l.name})` }))} />
          <div className="flex items-end">
            <Button onClick={doDetect} disabled={detecting || !text.trim()} className="w-full gap-2">
              <Sparkles className="w-4 h-4" /> {detecting ? "Detecting…" : "Detect & Resolve"}
            </Button>
          </div>
        </div>
        {error && <div className="flex gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}
      </Card>

      {(detectRes || resolveRes) && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-semibold text-sm">Detection Result</h3>
            {detectRes ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <LanguageBadge code={detectRes.detected_language} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{getLanguage(detectRes.detected_language)?.native_name}</span>
                  <Badge tone="info">{Math.round(detectRes.confidence * 100)}% confidence</Badge>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-violet-600" style={{ width: `${Math.round(detectRes.confidence * 100)}%` }} />
                </div>
                {detectRes.alternatives?.length ? (
                  <div className="text-xs text-slate-500 dark:text-slate-400">Alternatives: {detectRes.alternatives.map(a => `${a.code} ${Math.round(a.confidence*100)}%`).join(" · ")}</div>
                ) : null}
                {customerLang && <div className="text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border">Customer preferred: <LanguageBadge code={customerLang} /></div>}
              </div>
            ) : <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">No detection yet.</div>}
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-sm">Response Language Resolution</h3>
            {resolveRes ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Respond in</span> <LanguageBadge code={resolveRes.response_language} />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <Badge tone="neutral">{resolveRes.source.replace("_", " ")}</Badge>
                </div>
                {resolveRes.detected && <div className="text-xs text-slate-500 dark:text-slate-400">Detected: {resolveRes.detected} · {resolveRes.confidence ? Math.round(resolveRes.confidence*100)+"%" : ""}</div>}
                <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-sm leading-relaxed">
                  {previewTemplate(resolveRes.response_language)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Template: reminder.template.overdue with {"{{name}}, {{invoice}}, {{amount}}, {{due_date}}"}</div>
              </div>
            ) : <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">Click Detect & Resolve.</div>}
          </Card>
        </div>
      )}

      <Card className="p-5">
        <h3 className="font-semibold text-sm">Supported Languages</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {ACTIVE_LANGUAGES.map(l => (
            <span key={l.code} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white dark:bg-slate-800 text-xs font-medium">
              {l.flag} {l.native_name} <span className="text-slate-500 dark:text-slate-400">({l.code})</span>
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">Registry is scalable: add ff/kr/tiv with active:true to surface automatically. Detection routes to X-Org-Language / Accept-Language headers.</p>
      </Card>
    </div>
  )
}
