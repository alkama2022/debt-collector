import { useState, useMemo } from "react"
import { useStore } from "../services/store"
import { formatCurrency, formatDate } from "../utils/format"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Modal } from "../components/ui/modal"
import { Input, Select, Textarea } from "../components/ui/input"
import { StatusBadge } from "../components/ui/badge"
import { useToast } from "../components/ui/toast"
import { Skeleton } from "../components/ui/skeleton"
import { CreditCard } from "lucide-react"
import { downloadReceiptPdf, triggerBlobDownload } from "../services/live"
import { ConfettiBurst } from "../components/ui/confetti"
import { EmptyPayments } from "../components/ui/empty"

export default function Payments() {
  const { payments, invoices, loading, addPayment } = useStore()
  const { push } = useToast()

  const [open, setOpen] = useState(false)
  const [openReceipt, setOpenReceipt] = useState<any>(null)
  const [q, setQ] = useState("")
  const [selInv, setSelInv] = useState("")
  const [method, setMethod] = useState("Bank transfer")
  const [amount, setAmount] = useState("50000")
  const [ref, setRef] = useState("PAY-" + Math.floor(10000 + Math.random() * 90000))
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [confettiKey, setConfettiKey] = useState(0)

  const list = useMemo(() => payments.filter(p =>
    !q ||
    p.reference.toLowerCase().includes(q.toLowerCase()) ||
    p.customerName.toLowerCase().includes(q.toLowerCase())
  ), [payments, q])

  const openInvoices = invoices.filter(i => i.balance > 0)

  const handleDownloadReceipt = async (paymentId: string, receiptName: string) => {
    try {
      const blob = await downloadReceiptPdf(paymentId)
      triggerBlobDownload(blob, `${receiptName}.pdf`)
      push("Receipt PDF downloaded — backend-generated", "success")
    } catch {
      push("Failed to download receipt — backend not reachable or payment not found", "error")
    }
  }

  const submit = async () => {
    const invId = selInv || openInvoices[0]?.id
    const inv = invoices.find(i => i.id === invId)
    if (!inv) { push("Select invoice", "error"); return }
    const n = Number(amount.replace(/[^0-9]/g, ""))
    if (!n) { push("Enter valid amount", "error"); return }
    if (n > inv.balance) { push(`Amount exceeds balance ${formatCurrency(inv.balance)}`, "error"); return }

    setSaving(true)
    try {
      await addPayment({ invoiceId: inv.id, amount: n, method, ref, notes })
      const remaining = inv.balance - n
      push(`Payment recorded — ${formatCurrency(n)}`, "success")
      setConfettiKey(k => k + 1)
      try { navigator.vibrate?.([40, 30, 40]) } catch {}
      setOpen(false)
      // Find the created payment id for receipt download (optimistic: use last payment)
      const created = payments[0] // will be updated on next refresh; fallback to invoice
      setOpenReceipt({ amount: n, method, ref, date: new Date().toISOString(), customer: inv.customerName, invoice: inv.number, remaining, paymentId: created?.id || inv.id })
      setRef("PAY-" + Math.floor(10000 + Math.random() * 90000))
    } catch (e: any) {
      push(e?.data?.message || "Failed to record payment", "error")
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
      <ConfettiBurst trigger={confettiKey} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Payments</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{payments.length} payments {confettiKey > 0 ? "• 🎉 last payment celebrated!" : ""}</p>
        </div>
        <Button onClick={() => setOpen(true)}>Record Payment</Button>
      </div>

      <Card className="p-4">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search payment, customer, invoice"
          className="w-full md:w-80 h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-500 dark:text-slate-400">
              <tr>
                <th className="text-left p-3">Reference</th>
                <th className="text-left">Customer</th>
                <th className="text-left">Invoice</th>
                <th className="text-right">Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {list.map(p => (
                <tr key={p.id} className="border-t hover:bg-slate-50 dark:bg-slate-700/50">
                  <td className="p-3 font-mono font-medium">{p.reference}</td>
                  <td>{p.customerName}</td>
                  <td className="font-mono text-xs">{p.invoiceNumber}</td>
                  <td className="text-right font-medium">{formatCurrency(p.amount)}</td>
                  <td className="text-center text-xs">{p.method}</td>
                  <td className="text-center"><StatusBadge status={p.status} /></td>
                  <td className="text-xs">{formatDate(p.date)}</td>
                </tr>
              ))}
              {list.length === 0 && payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <div className="p-6">
                      <EmptyPayments onRecord={() => setOpen(true)} />
                    </div>
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No payments match this search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record payment modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Record payment">
        <div className="space-y-3">
          <Select
            label="Invoice"
            value={selInv || openInvoices[0]?.id || ""}
            onChange={e => setSelInv(e.target.value)}
            options={openInvoices.map(i => ({
              value: i.id,
              label: `${i.number} — ${i.customerName} — bal ${formatCurrency(i.balance)}`
            }))}
          />
          <Input label="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
          {(selInv || openInvoices[0]?.id) && (
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Balance: {formatCurrency(invoices.find(i => i.id === (selInv || openInvoices[0]?.id))?.balance || 0)}
            </div>
          )}
          <Select
            label="Payment method"
            value={method}
            onChange={e => setMethod(e.target.value)}
            options={[
              { value: "Bank transfer", label: "Bank transfer" },
              { value: "Cash", label: "Cash" },
              { value: "Card", label: "Card" },
              { value: "Online payment", label: "Online payment" },
              { value: "POS", label: "POS" },
              { value: "Other", label: "Other" },
            ]}
          />
          <Input label="Reference" value={ref} onChange={e => setRef(e.target.value)} />
          <Textarea label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>{saving ? "Saving..." : "Save payment"}</Button>
          </div>
        </div>
      </Modal>

      {/* Receipt modal */}
      <Modal open={!!openReceipt} onClose={() => setOpenReceipt(null)} title="Payment received successfully.">
        <div className="space-y-3">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex items-center gap-2 font-semibold">
              <CreditCard className="w-4 h-4" /> Receipt — {openReceipt?.invoice}
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Customer</span><span className="font-medium">{openReceipt?.customer}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Amount</span><span className="font-bold">{openReceipt ? formatCurrency(Number(openReceipt.amount)) : ""}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Method</span><span>{openReceipt?.method}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Reference</span><span className="font-mono">{openReceipt?.ref}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Date</span><span>{openReceipt?.date ? formatDate(openReceipt.date) : ""}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Remaining balance</span><span className="font-medium">{openReceipt ? formatCurrency(openReceipt.remaining) : ""}</span></div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setOpenReceipt(null)}>Close</Button>
            <Button onClick={() => {
              if (openReceipt?.paymentId) handleDownloadReceipt(openReceipt.paymentId, `Receipt-${openReceipt.invoice}`)
              else push("Save payment first — receipt will be available in table", "info")
            }}>Download PDF</Button>
            <Button variant="secondary" onClick={() => {
              const text = `Receipt ${openReceipt?.invoice} — ${formatCurrency(Number(openReceipt?.amount || 0))} received from ${openReceipt?.customer}. Remaining ${formatCurrency(Number(openReceipt?.remaining || 0))}. Thank you!`
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
            }}>Share on WhatsApp</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
