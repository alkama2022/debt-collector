import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { useStore } from "../services/store"
import { formatCurrency } from "../utils/format"
import { Card } from "../components/ui/card"
import { Input, Select } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Badge, LanguageBadge } from "../components/ui/badge"
import { EmptyState } from "../components/ui/empty"
import { Modal } from "../components/ui/modal"
import { useToast } from "../components/ui/toast"
import { Skeleton } from "../components/ui/skeleton"
import { Search, Plus, Users, Languages, History } from "lucide-react"
import { ACTIVE_LANGUAGES } from "../i18n/registry"
import { translate } from "../i18n/translations"
import { liveGetCustomerLanguage } from "../services/live"

const langOptions = ACTIVE_LANGUAGES.map(l => ({ value: l.code, label: `${l.native_name} — ${l.name}` }))

export default function Customers() {
  const { customers, invoices, loading, addCustomer, addReminder } = useStore()
  const { push } = useToast()

  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<"all" | "overdue" | "archived">("all")
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [preferredLang, setPreferredLang] = useState("en")
  const [saving, setSaving] = useState(false)
  const [historyCustomer, setHistoryCustomer] = useState<string | null>(null)
  const [history, setHistory] = useState<{ code: string; changed_at: string; changed_by?: string }[] | null>(null)

  const list = useMemo(() => customers.filter(c => {
    const m = q
      ? c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.customerId.toLowerCase().includes(q.toLowerCase()) ||
        (c.phone || "").includes(q) ||
        (c.preferredLanguage || "").toLowerCase().includes(q.toLowerCase())
      : true
    const f =
      filter === "overdue" ? c.overdue > 0 :
      filter === "archived" ? c.status === "archived" :
      c.status === "active"
    return m && f
  }), [customers, q, filter])

  const add = async () => {
    if (!name) { push("Name required", "error"); return }
    setSaving(true)
    try {
      await addCustomer({ name, phone, email, preferred_language: preferredLang })
      push(translate("customer.created", preferredLang, { name }), "success")
      setOpen(false)
      setName(""); setPhone(""); setEmail(""); setPreferredLang("en")
    } catch (e: any) {
      push(e?.data?.message || "Failed to create customer", "error")
    } finally {
      setSaving(false)
    }
  }

  const openHistory = async (cId: string) => {
    setHistoryCustomer(cId)
    setHistory(null)
    try {
      const r = await liveGetCustomerLanguage(cId)
      setHistory(r.history ?? [])
    } catch {
      const local = customers.find(x => x.id === cId)?.languageHistory ?? []
      setHistory(local.length ? local : [{ code: customers.find(x=>x.id===cId)?.preferredLanguage ?? "en", changed_at: new Date().toISOString() }])
    }
  }

  if (loading) return (
    <div className="space-y-3">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Customers</h1>
          <p className="text-sm text-slate-600">{customers.length} customers · Multilingual</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Customer
        </Button>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by name, ID, phone or language"
            className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "overdue", "archived"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl text-sm font-medium border capitalize ${filter === f ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200"}`}>{f}</button>
          ))}
        </div>
      </Card>

      {list.length === 0 ? (
        <EmptyState
          title="No customers yet"
          desc="Add your first customer to start tracking payments."
          icon={<Users className="w-6 h-6" />}
          action={{ label: "Add Customer", onClick: () => setOpen(true) }}
        />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="grid md:hidden gap-3">
            {list.map(c => (
              <Card key={c.id} className="p-4">
                <div className="flex justify-between">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium">{c.name[0]}</div>
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">{c.name} <LanguageBadge code={c.preferredLanguage || "en"} /></div>
                      <div className="text-xs text-slate-500">{c.customerId} — {c.phone}</div>
                    </div>
                  </div>
                  <Badge tone={c.overdue ? "danger" : c.outstanding ? "warning" : "success"}>
                    {c.overdue ? "Overdue" : c.outstanding ? "Owes" : "Clear"}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => openHistory(c.id)} className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline"><History className="w-3 h-3" /> Language history</button>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Languages className="w-3 h-3" /> {translate("invoice.outstanding_balance", c.preferredLanguage || "en")}: {formatCurrency(c.outstanding)}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 border">
                    <div className="text-xs text-slate-500">{translate("dashboard.outstanding_balance", c.preferredLanguage || "en")}</div>
                    <div className="text-sm font-semibold">{formatCurrency(c.outstanding)}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-red-50 border border-red-200">
                    <div className="text-xs text-red-700">Overdue</div>
                    <div className="text-sm font-semibold text-red-700">{formatCurrency(c.overdue)}</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link to={`/customers/${c.id}`} className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-center text-sm font-medium min-h-[44px] flex items-center justify-center">View</Link>
                  <button onClick={() => {
                    const inv = invoices.find(i => i.customerId === c.id && i.balance > 0)
                    if (inv) { addReminder({ invoiceId: inv.id, channel: "whatsapp" }); push(`WhatsApp queued for ${c.name}`, "success") }
                    else push("No invoice to remind on — create one first", "info")
                  }} className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium min-h-[44px]">Remind</button>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left">Language</th>
                    <th className="text-left">ID</th>
                    <th className="text-right">Outstanding</th>
                    <th className="text-right">Overdue</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(c => (
                    <tr key={c.id} className="border-t border-slate-200 hover:bg-slate-50">
                      <td className="p-3">
                        <Link to={`/customers/${c.id}`} className="font-medium hover:underline">{c.name}</Link>
                        <div className="text-xs text-slate-500">{c.phone} — {c.email || "no email"}</div>
                      </td>
                      <td><LanguageBadge code={c.preferredLanguage || "en"} /></td>
                      <td className="font-mono text-xs">{c.customerId}</td>
                      <td className="text-right font-medium">{formatCurrency(c.outstanding)}</td>
                      <td className="text-right">
                        <span className={c.overdue ? "text-red-600 font-medium" : "text-slate-500"}>{formatCurrency(c.overdue)}</span>
                      </td>
                      <td className="text-right pr-3">
                        <div className="inline-flex items-center gap-1">
                          <button onClick={() => openHistory(c.id)} className="px-2 py-1.5 rounded-full border bg-white text-xs font-medium inline-flex items-center gap-1"><History className="w-3 h-3" /> History</button>
                          <Link to={`/customers/${c.id}`} className="px-3 py-1.5 rounded-full border bg-white text-xs font-medium">View</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add customer">
        <div className="space-y-3">
          <Input label="Customer name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Musa Ibrahim" />
          <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0803 ..." />
          <Input label="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} placeholder="musa@example.com" />
          <Select label="Preferred Language" value={preferredLang} onChange={e => setPreferredLang(e.target.value)} options={langOptions} />
          <p className="text-xs text-slate-500 flex items-center gap-1"><Languages className="w-3 h-3" /> Reminders will be sent in this language. You can change it per customer later.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={add} disabled={saving}>{saving ? "Saving..." : "Save customer"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!historyCustomer} onClose={() => setHistoryCustomer(null)} title="Language history">
        <div className="space-y-2">
          {!history ? <div className="text-sm text-slate-500">Loading…</div> : history.length === 0 ? <div className="text-sm text-slate-500">No history yet.</div> : history.map((h, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border bg-white">
              <LanguageBadge code={h.code} />
              <span className="text-xs text-slate-500">{new Date(h.changed_at).toLocaleString()} {h.changed_by ? `· ${h.changed_by}` : ""}</span>
            </div>
          ))}
          <div className="text-xs text-slate-500">Audit trail persisted per customer. Update via PATCH /customers/:id/language with preferred_language.</div>
        </div>
      </Modal>
    </div>
  )
}
