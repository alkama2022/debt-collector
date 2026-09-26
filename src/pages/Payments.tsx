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
import { CreditCard, Download, Share2, RotateCcw, X } from "lucide-react"
import { apiFetch } from "../services/api"
import { downloadReceiptPdf, triggerBlobDownload } from "../services/live"
import { ConfettiBurst } from "../components/ui/confetti"
import { EmptyPayments } from "../components/ui/empty"
import type { Payment } from "../types"

// ─── Constants ────────────────────────────────────────────────────────────────

const METHODS = [
  { value: "Bank transfer", label: "🏦 Bank transfer" },
  { value: "Cash",          label: "💵 Cash" },
  { value: "Card",          label: "💳 Card" },
  { value: "POS",           label: "🖥️  POS" },
  { value: "Mobile money",  label: "📱 Mobile money" },
  { value: "Cheque",        label: "📄 Cheque" },
  { value: "Online payment",label: "🌐 Online / Paystack" },
  { value: "Other",         label: "⋯  Other" },
]

const STATUS_FILTERS = [
  { value: "", label: "All statuses" },
  { value: "successful", label: "Successful" },
  { value: "pending",    label: "Pending" },
  { value: "failed",     label: "Failed" },
  { value: "refunded",   label: "Refunded" },
]

type ReceiptInfo = {
  paymentId: string
  amount: number
  method: string
  ref: string
  date: string
  customer: string
  invoice: string
  remaining: number
}

// ─── Receipt Modal ─────────────────────────────────────────────────────────────

function ReceiptModal({
  receipt,
  onClose,
  onDownload,
}: {
  receipt: ReceiptInfo
  onClose: () => void
  onDownload: (id: string, name: string) => void
}) {
  return (
    <Modal open onClose={onClose} title="Payment received ✓">
      <div className="space-y-4">
        <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300 mb-3">
            <CreditCard className="w-4 h-4" /> Receipt — {receipt.invoice}
          </div>
          <div className="space-y-1.5 text-sm">
            {[
              ["Customer",          receipt.customer],
              ["Amount paid",       formatCurrency(receipt.amount)],
              ["Method",            receipt.method],
              ["Reference",         receipt.ref],
              ["Date",              formatDate(receipt.date)],
              ["Remaining balance", formatCurrency(receipt.remaining)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{label}</span>
                <span className={label === "Amount paid" ? "font-bold" : "font-medium"}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button
            variant="secondary"
            onClick={() => {
              const text = `Receipt ${receipt.invoice} — ${formatCurrency(receipt.amount)} received from ${receipt.customer}. Remaining ${formatCurrency(receipt.remaining)}. Thank you! — CollectNaija`
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
            }}
          >
            <Share2 className="w-3.5 h-3.5 mr-1.5" /> WhatsApp
          </Button>
          <Button onClick={() => onDownload(receipt.paymentId, `Receipt-${receipt.invoice}`)}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Download PDF
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Void / Refund Modal ───────────────────────────────────────────────────────

function VoidModal({
  payment,
  onClose,
  onDone,
}: {
  payment: Payment
  onClose: () => void
  onDone: (updated: Payment) => void
}) {
  const { push } = useToast()
  const [newStatus, setNewStatus] = useState<"refunded" | "failed">("refunded")
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const updated = await apiFetch<Payment>(`/payments/${payment.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      })
      push(`Payment marked as ${newStatus}.`, "success")
      onDone(updated)
    } catch (err: any) {
      push(err?.data?.message || "Failed to update payment.", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Void / Refund payment">
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
          Changing the status will <strong>not</strong> automatically reverse any bank transaction. Use this to reflect a manual refund or void in your records.
        </div>
        <Select
          label="New status"
          value={newStatus}
          onChange={e => setNewStatus(e.target.value as any)}
          options={[
            { value: "refunded", label: "Refunded — money returned to customer" },
            { value: "failed",   label: "Failed — mark as failed / cancelled" },
          ]}
        />
        <div className="text-xs text-slate-500">
          Payment: <span className="font-mono">{payment.reference}</span> — {formatCurrency(payment.amount)}
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : `Mark as ${newStatus}`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Payments() {
  const { payments, invoices, loading, addPayment } = useStore()
  const { push } = useToast()

  // ── Filter state ──
  const [q, setQ]               = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [methodFilter, setMethodFilter] = useState("")

  // ── Record payment modal ──
  const [open, setOpen]         = useState(false)
  const [selInv, setSelInv]     = useState("")
  const [method, setMethod]     = useState("Bank transfer")
  const [amount, setAmount]     = useState("")
  const [ref, setRef]           = useState(() => "PAY-" + Math.floor(10000 + Math.random() * 90000))
  const [notes, setNotes]       = useState("")
  const [saving, setSaving]     = useState(false)
  const [confettiKey, setConfettiKey] = useState(0)

  // ── Post-submit receipt modal ──
  const [receipt, setReceipt]   = useState<ReceiptInfo | null>(null)

  // ── Void modal ──
  const [voidTarget, setVoidTarget] = useState<Payment | null>(null)
  // Local status overrides (after void/refund — avoids full reload)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({})

  const openInvoices = invoices.filter(i => i.balance > 0)

  const selectedInvId = selInv || openInvoices[0]?.id || ""
  const selectedInv   = invoices.find(i => i.id === selectedInvId)

  // Populate amount from invoice balance when invoice changes
  const handleInvChange = (id: string) => {
    setSelInv(id)
    const inv = invoices.find(i => i.id === id)
    if (inv) setAmount(String(Math.round(inv.balance)))
  }

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const searchMatch = !q
        || p.reference.toLowerCase().includes(q.toLowerCase())
        || p.customerName.toLowerCase().includes(q.toLowerCase())
        || p.invoiceNumber.toLowerCase().includes(q.toLowerCase())
      const effectiveStatus = statusOverrides[p.id] ?? p.status
      const statusMatch = !statusFilter || effectiveStatus === statusFilter
      const methodMatch = !methodFilter || p.method?.toLowerCase() === methodFilter.toLowerCase()
      return searchMatch && statusMatch && methodMatch
    })
  }, [payments, q, statusFilter, methodFilter, statusOverrides])

  const handleDownloadReceipt = async (paymentId: string, name: string) => {
    try {
      const blob = await downloadReceiptPdf(paymentId)
      triggerBlobDownload(blob, `${name}.pdf`)
      push("Receipt PDF downloaded.", "success")
    } catch {
      push("Failed to download receipt — try again in a moment.", "error")
    }
  }

  const openRecord = () => {
    // Pre-fill amount from first open invoice
    const inv = invoices.find(i => i.id === selectedInvId)
    if (inv) setAmount(String(Math.round(inv.balance)))
    setOpen(true)
  }

  const submit = async () => {
    const inv = selectedInv
    if (!inv) { push("Select an invoice.", "error"); return }
    const n = Number(amount.replace(/[^0-9.]/g, ""))
    if (!n || n <= 0) { push("Enter a valid amount.", "error"); return }
    if (n > inv.balance + 0.01) { push(`Amount (${formatCurrency(n)}) exceeds balance (${formatCurrency(inv.balance)}).`, "error"); return }

    setSaving(true)
    try {
      const created = await addPayment({ invoiceId: inv.id, amount: n, method, ref, notes })
      const remaining = Math.max(0, inv.balance - n)
      push(`${formatCurrency(n)} recorded for ${inv.customerName}.`, "success")
      setConfettiKey(k => k + 1)
      try { navigator.vibrate?.([40, 30, 40]) } catch {}
      setOpen(false)
      setReceipt({
        paymentId: created.id,          // ← real ID from the API response
        amount: n,
        method,
        ref,
        date: new Date().toISOString(),
        customer: inv.customerName,
        invoice: inv.number,
        remaining,
      })
      setRef("PAY-" + Math.floor(10000 + Math.random() * 90000))
      setNotes("")
    } catch (e: any) {
      push(e?.data?.message || "Failed to record payment.", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleVoidDone = (updated: Payment) => {
    setStatusOverrides(prev => ({ ...prev, [updated.id]: updated.status }))
    setVoidTarget(null)
  }

  // ── Unique methods for filter dropdown ──
  const availableMethods = useMemo(() => {
    const seen = new Set<string>()
    payments.forEach(p => { if (p.method) seen.add(p.method) })
    return Array.from(seen).sort()
  }, [payments])

  if (loading) return (
    <div className="space-y-3">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )

  return (
    <div className="space-y-4">
      <ConfettiBurst trigger={confettiKey} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Payments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {payments.length} total
            {filteredPayments.length !== payments.length && ` · ${filteredPayments.length} shown`}
          </p>
        </div>
        <Button onClick={openRecord}>+ Record Payment</Button>
      </div>

      {/* Filters */}
      <Card className="p-3 flex flex-wrap gap-2 items-center">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search reference, customer, invoice…"
          aria-label="Search payments"
          className="input-zoom-safe flex-1 min-w-full sm:min-w-[180px] h-11 sm:h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-800"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="input-zoom-safe h-11 sm:h-10 flex-1 sm:flex-none px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {STATUS_FILTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select
          value={methodFilter}
          onChange={e => setMethodFilter(e.target.value)}
          aria-label="Filter by method"
          className="input-zoom-safe h-11 sm:h-10 flex-1 sm:flex-none px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All methods</option>
          {availableMethods.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {(q || statusFilter || methodFilter) && (
          <button
            onClick={() => { setQ(""); setStatusFilter(""); setMethodFilter("") }}
            className="h-11 sm:h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Reference</th>
                <th className="text-left py-3">Customer</th>
                <th className="text-left py-3">Invoice</th>
                <th className="text-right py-3">Amount</th>
                <th className="text-center py-3">Method</th>
                <th className="text-center py-3">Status</th>
                <th className="text-left py-3">Date</th>
                <th className="text-center py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredPayments.map(p => {
                const effectiveStatus = (statusOverrides[p.id] ?? p.status) as Payment["status"]
                const canVoid = effectiveStatus === "successful" || effectiveStatus === "pending"
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{p.reference}</td>
                    <td className="py-3 text-sm">{p.customerName}</td>
                    <td className="py-3 font-mono text-xs text-slate-500">{p.invoiceNumber}</td>
                    <td className="py-3 text-right font-semibold">{formatCurrency(p.amount)}</td>
                    <td className="py-3 text-center">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {p.method || p.reference?.startsWith("CN-") ? (p.method || "Paystack") : (p.method || "Manual")}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <StatusBadge status={effectiveStatus} />
                    </td>
                    <td className="py-3 text-xs text-slate-500">{formatDate(p.date)}</td>
                    <td className="py-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* Download receipt */}
                        <button
                          onClick={() => handleDownloadReceipt(p.id, `Receipt-${p.invoiceNumber}`)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                          title="Download receipt PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {/* Share on WhatsApp */}
                        <button
                          onClick={() => {
                            const text = `Payment receipt — ${formatCurrency(p.amount)} from ${p.customerName} (${p.invoiceNumber}). Ref: ${p.reference}. Thank you!`
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-500 hover:text-emerald-600"
                          title="Share receipt via WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        {/* Void / Refund */}
                        {canVoid && (
                          <button
                            onClick={() => setVoidTarget(p)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition text-slate-400 hover:text-red-600"
                            title="Void or refund"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredPayments.length === 0 && payments.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-0">
                    <div className="p-8">
                      <EmptyPayments onRecord={openRecord} />
                    </div>
                  </td>
                </tr>
              )}
              {filteredPayments.length === 0 && payments.length > 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                    No payments match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Record Payment Modal ─────────────────────────────────────────── */}
      <Modal open={open} onClose={() => setOpen(false)} title="Record payment">
        <div className="space-y-3">
          {openInvoices.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">
              All invoices are fully paid. Create a new invoice first.
            </div>
          ) : (
            <>
              <Select
                label="Invoice"
                value={selectedInvId}
                onChange={e => handleInvChange(e.target.value)}
                options={openInvoices.map(i => ({
                  value: i.id,
                  label: `${i.number} — ${i.customerName} — ${formatCurrency(i.balance)} due`,
                }))}
              />
              {selectedInv && (
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>Balance: <strong>{formatCurrency(selectedInv.balance)}</strong></span>
                  <button
                    type="button"
                    className="text-brand-600 font-medium underline underline-offset-2"
                    onClick={() => setAmount(String(Math.round(selectedInv.balance)))}
                  >
                    Pay full balance
                  </button>
                </div>
              )}

              <Input
                label="Amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 50000"
              />

              <Select
                label="Payment method"
                value={method}
                onChange={e => setMethod(e.target.value)}
                options={METHODS}
              />

              <Input
                label="Reference"
                value={ref}
                onChange={e => setRef(e.target.value)}
                placeholder="e.g. PAY-12345 or bank teller number"
              />

              <Textarea
                label="Notes (optional)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Paid via GTBank mobile app"
              />

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
                <Button onClick={submit} disabled={saving || !selectedInvId}>
                  {saving ? "Saving…" : "Save payment"}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ── Post-submit Receipt Modal ────────────────────────────────────── */}
      {receipt && (
        <ReceiptModal
          receipt={receipt}
          onClose={() => setReceipt(null)}
          onDownload={handleDownloadReceipt}
        />
      )}

      {/* ── Void / Refund Modal ──────────────────────────────────────────── */}
      {voidTarget && (
        <VoidModal
          payment={voidTarget}
          onClose={() => setVoidTarget(null)}
          onDone={handleVoidDone}
        />
      )}
    </div>
  )
}
