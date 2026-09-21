import { useState } from "react"
import { useStore } from "../services/store"
import { formatCurrency, formatDate } from "../utils/format"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Modal } from "../components/ui/modal"
import { Select, Textarea } from "../components/ui/input"
import { StatusBadge } from "../components/ui/badge"
import { useToast } from "../components/ui/toast"
import { Skeleton } from "../components/ui/skeleton"

export default function Reminders() {
  const { reminders, invoices, loading, addReminder } = useStore()
  const { push } = useToast()

  const [tab, setTab] = useState<"all" | "scheduled" | "sent" | "failed" | "cancelled">("all")
  const [open, setOpen] = useState(false)
  const [selInv, setSelInv] = useState("")
  const [channel, setChannel] = useState("whatsapp")
  const [tpl, setTpl] = useState(
    "Hello {{customer_name}}, this is {{business_name}}. Invoice {{invoice_number}} for {{amount_due}} is due on {{due_date}}. Pay via {{payment_link}}."
  )
  const [saving, setSaving] = useState(false)

  const openInvoices = invoices.filter(i => i.balance > 0)
  const list = reminders.filter(r => tab === "all" || r.status === tab)

  const currentInv = invoices.find(i => i.id === (selInv || openInvoices[0]?.id))

  const previewMessage = tpl
    .replace("{{customer_name}}", currentInv?.customerName || "Customer")
    .replace("{{business_name}}", "Your Business")
    .replace("{{invoice_number}}", currentInv?.number || "INV-XXXX")
    .replace("{{amount_due}}", formatCurrency(currentInv?.balance || 0))
    .replace("{{due_date}}", currentInv?.dueDate || "—")
    .replace("{{payment_link}}", "pay.collectnaija.com/p/xxx")

  const save = async () => {
    const invId = selInv || openInvoices[0]?.id
    if (!invId) { push("Select invoice", "error"); return }
    setSaving(true)
    try {
      await addReminder({ invoiceId: invId, channel: channel as any })
      push(`Reminder scheduled via ${channel}`, "success")
      setOpen(false)
    } catch (e: any) {
      push(e?.data?.message || "Failed to schedule reminder", "error")
    } finally {
      setSaving(false)
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
          <h1 className="text-xl font-bold">Reminders</h1>
          <p className="text-sm text-slate-600">{reminders.length} reminders</p>
        </div>
        <Button onClick={() => setOpen(true)}>Create Reminder</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-1">
        {(["all", "scheduled", "sent", "failed", "cancelled"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 rounded-full text-xs font-medium border capitalize whitespace-nowrap ${tab === t ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200"}`}
          >
            {t} — {t === "all" ? reminders.length : reminders.filter(r => r.status === t).length}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="text-left p-3">Customer</th>
                <th className="text-left">Invoice</th>
                <th className="text-right">Amount</th>
                <th>Due</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Sent</th>
              </tr>
            </thead>
            <tbody>
              {list.map(r => (
                <tr key={r.id} className="border-t hover:bg-slate-50">
                  <td className="p-3 font-medium">{r.customerName || "—"}</td>
                  <td className="font-mono text-xs">{r.invoiceNumber || "—"}</td>
                  <td className="text-right">{formatCurrency(r.amount)}</td>
                  <td className="text-xs">{r.dueDate ? formatDate(r.dueDate) : "—"}</td>
                  <td className="text-xs capitalize text-center">{r.channel}</td>
                  <td className="text-center"><StatusBadge status={r.status} /></td>
                  <td className="text-xs">{r.sentAt ? formatDate(r.sentAt) : "—"}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-slate-500">
                    No reminders yet — create one to start automated follow-ups.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Create reminder">
        <div className="space-y-3">
          <Select
            label="Invoice"
            value={selInv || openInvoices[0]?.id || ""}
            onChange={e => setSelInv(e.target.value)}
            options={openInvoices.map(i => ({
              value: i.id,
              label: `${i.number} — ${i.customerName} — ${formatCurrency(i.balance)}`
            }))}
          />
          <Select
            label="Channel"
            value={channel}
            onChange={e => setChannel(e.target.value)}
            options={[
              { value: "whatsapp", label: "WhatsApp" },
              { value: "sms", label: "SMS" },
              { value: "email", label: "Email" },
            ]}
          />
          <Textarea label="Message template" value={tpl} onChange={e => setTpl(e.target.value)} />
          <div className="text-xs text-slate-500">
            Variables: {"{{customer_name}}"} {"{{business_name}}"} {"{{invoice_number}}"} {"{{amount_due}}"} {"{{due_date}}"} {"{{payment_link}}"}
          </div>
          {currentInv && (
            <div className="p-3 rounded-xl bg-slate-50 border">
              <div className="text-xs font-medium">Live preview</div>
              <div className="text-sm mt-1 text-slate-700">{previewMessage}</div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save reminder"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
