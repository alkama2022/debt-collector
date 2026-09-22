import { useParams, Link } from "react-router-dom"
import { useStore } from "../services/store"
import { formatCurrency, formatDate } from "../utils/format"
import { Card } from "../components/ui/card"
import { Badge, StatusBadge, LanguageBadge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/toast"
import { Skeleton } from "../components/ui/skeleton"
import { Languages, History } from "lucide-react"
import { Select } from "../components/ui/input"
import { ACTIVE_LANGUAGES } from "../i18n/registry"
import { translate } from "../i18n/translations"
import { liveUpdateCustomerLanguage, liveGetCustomerLanguage } from "../services/live"
import { useState } from "react"

export default function CustomerDetail() {
  const { id } = useParams()
  const { customers, invoices, payments, loading, addReminder } = useStore()
  const { push } = useToast()

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )

  const c = customers.find(x => x.id === id)
  if (!c) return (
    <div className="space-y-3">
      <Link to="/customers" className="text-sm text-slate-600 dark:text-slate-400 hover:underline">← Back to customers</Link>
      <div className="text-sm text-slate-500 dark:text-slate-400 p-8 text-center">Customer not found.</div>
    </div>
  )

  const invs = invoices.filter(i => i.customerId === c.id)
  const pays = payments.filter(p => p.invoiceId && invs.some(i => i.id === p.invoiceId))
  const [pref, setPref] = useState(c.preferredLanguage || "en")
  const [history, setHistory] = useState<{ code: string; changed_at: string }[] | null>(null)
  const [showHist, setShowHist] = useState(false)

  const updateLang = async (code: string) => {
    setPref(code)
    try { await liveUpdateCustomerLanguage(c.id, code); push(`Language updated to ${code}`, "success") } catch { push("Updated locally — will sync when online", "info") }
  }
  const loadHist = async () => {
    setShowHist(!showHist)
    if (!history) {
      try { const r = await liveGetCustomerLanguage(c.id); setHistory(r.history) } catch { setHistory(c.languageHistory ?? [{ code: c.preferredLanguage || "en", changed_at: new Date().toISOString() }]) }
    }
  }

  return (
    <div className="space-y-4">
      <Link to="/customers" className="text-sm text-slate-600 dark:text-slate-400 hover:underline">← Back to customers</Link>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-medium">
              {c.name[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                {c.name}{" "}
                <Badge tone={c.overdue ? "danger" : c.outstanding ? "warning" : "success"}>
                  {c.overdue ? "Overdue" : c.outstanding ? "Owes" : "Clear"}
                </Badge>
                <LanguageBadge code={c.preferredLanguage || "en"} />
              </h1>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {c.phone} — {c.email || "no email"} — ID: {c.customerId}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
                <Languages className="w-3 h-3" /> {translate("invoice.outstanding_balance", c.preferredLanguage || "en")}: {formatCurrency(c.outstanding)}
                <button onClick={loadHist} className="inline-flex items-center gap-1 text-violet-600 hover:underline"><History className="w-3 h-3" /> Language history</button>
              </div>
              {showHist && history && <div className="mt-2 flex flex-wrap gap-1">{history.map((h,i)=><LanguageBadge key={i} code={h.code} />)} <span className="text-xs text-slate-400">{history.length} entries</span></div>}
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-[200px]">
            <Select label="Preferred Language" value={pref} onChange={e=>updateLang(e.target.value)} options={ACTIVE_LANGUAGES.map(l=>({value:l.code, label: `${l.native_name} (${l.name})`}))} />
            <Button onClick={() => {
              const inv = invs.find(i => i.balance > 0)
              if (inv) { addReminder({ invoiceId: inv.id, channel: "whatsapp" }); push("Reminder sent — see Reminders", "success") }
              else push("No open invoice to remind", "info")
            }}>Send Reminder</Button>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Outstanding</div>
          <div className="text-lg font-bold mt-1">{formatCurrency(c.outstanding)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Overdue</div>
          <div className="text-lg font-bold mt-1 text-red-600 dark:text-red-400">{formatCurrency(c.overdue)}</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Invoice history</h3>
            <Link to="/invoices" className="text-xs text-brand-600">Create</Link>
          </div>
          <div className="mt-3 space-y-2">
            {invs.length ? invs.map(inv => (
              <Link
                key={inv.id}
                to={`/invoices/${inv.id}`}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-700/50"
              >
                <div>
                  <div className="font-mono text-sm font-medium">{inv.number}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{formatDate(inv.issueDate)} — Due {formatDate(inv.dueDate)}</div>
                </div>
                <div className="text-right">
                  <StatusBadge status={inv.status} />
                  <div className="text-sm font-medium mt-1">{formatCurrency(inv.balance)}</div>
                </div>
              </Link>
            )) : (
              <div className="text-sm text-slate-500 dark:text-slate-400 p-4 border border-dashed rounded-xl text-center">
                No invoices — create one for this customer.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold">Payment history</h3>
          <div className="mt-3 space-y-2">
            {pays.length ? pays.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-sm font-medium">{p.reference} — {p.method}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{formatDate(p.date)}</div>
                </div>
                <div className="text-right">
                  <StatusBadge status={p.status} />
                  <div className="text-sm font-medium">{formatCurrency(p.amount)}</div>
                </div>
              </div>
            )) : (
              <div className="text-sm text-slate-500 dark:text-slate-400 p-4 border border-dashed rounded-xl text-center">
                No payments recorded yet.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
