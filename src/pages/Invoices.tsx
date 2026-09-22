import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { useStore } from "../services/store"
import { formatCurrency, formatDate } from "../utils/format"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Modal } from "../components/ui/modal"
import { Input, Select, Textarea } from "../components/ui/input"
import { StatusBadge } from "../components/ui/badge"
import { EmptyInvoices as EmptyInvoicesState } from "../components/ui/empty"
import { useToast } from "../components/ui/toast"
import { Skeleton } from "../components/ui/skeleton"
import { FileText, Plus } from "lucide-react"

export default function Invoices() {
  const { invoices, customers, loading, addInvoice } = useStore()
  const { push } = useToast()

  const [q, setQ] = useState("")
  const [status, setStatus] = useState("all")
  const [open, setOpen] = useState(false)
  const [cust, setCust] = useState("")
  const [amt, setAmt] = useState("75000")
  const [due, setDue] = useState(new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10))
  const [desc, setDesc] = useState("Service fee")
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => invoices.filter(i => {
    const m = q
      ? i.number.toLowerCase().includes(q.toLowerCase()) ||
        i.customerName.toLowerCase().includes(q.toLowerCase())
      : true
    const s = status === "all" || i.status === status
    return m && s
  }), [invoices, q, status])

  const create = async () => {
    const n = Number(amt.replace(/[^0-9]/g, ""))
    const customerId = cust || customers[0]?.id
    if (!n || !customerId) { push("Customer and amount required", "error"); return }
    setSaving(true)
    try {
      await addInvoice({ customerId, amount: n, dueDate: due, desc })
      push(`Invoice created — ${formatCurrency(n)}`, "success")
      setOpen(false)
    } catch (e: any) {
      push(e?.data?.message || "Failed to create invoice", "error")
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
          <h1 className="text-xl font-bold">Invoices</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{invoices.length} invoices</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Create Invoice
        </Button>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-3">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search invoice or customer"
          className="flex-1 h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
        >
          <option value="all">All status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </Card>

      {filtered.length === 0 && invoices.length === 0 ? (
        <EmptyInvoicesState onAdd={() => setOpen(true)} />
      ) : filtered.length === 0 ? (
        <div className="text-center p-8 text-sm text-slate-500">No invoices match this filter.</div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="grid md:hidden gap-3">
            {filtered.map(inv => (
              <Card key={inv.id} className="p-4">
                <div className="flex justify-between">
                  <div className="font-mono text-sm font-semibold">{inv.number}</div>
                  <StatusBadge status={inv.status} />
                </div>
                <div className="text-sm mt-1">{inv.customerName}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Due {formatDate(inv.dueDate)} — {formatCurrency(inv.balance)} balance — {formatCurrency(inv.total)} total
                </div>
                <Link
                  to={`/invoices/${inv.id}`}
                  className="mt-3 block text-center py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium min-h-[44px] flex items-center justify-center"
                >
                  View
                </Link>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="text-left p-3">Invoice</th>
                    <th className="text-left">Customer</th>
                    <th className="text-left">Issue</th>
                    <th className="text-left">Due</th>
                    <th>Status</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Balance</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inv => (
                    <tr key={inv.id} className="border-t hover:bg-slate-50 dark:bg-slate-700/50">
                      <td className="p-3 font-mono font-medium">
                        <Link to={`/invoices/${inv.id}`} className="hover:underline">{inv.number}</Link>
                      </td>
                      <td>{inv.customerName}</td>
                      <td>{formatDate(inv.issueDate)}</td>
                      <td>{formatDate(inv.dueDate)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td className="text-right">{formatCurrency(inv.total)}</td>
                      <td className="text-right font-medium">{formatCurrency(inv.balance)}</td>
                      <td className="pr-3 text-right">
                        <Link to={`/invoices/${inv.id}`} className="text-xs px-3 py-1.5 rounded-full border bg-white dark:bg-slate-800">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create invoice">
        <div className="space-y-3">
          <Select
            label="Customer"
            value={cust || customers[0]?.id || ""}
            onChange={e => setCust(e.target.value)}
            options={customers.map(c => ({ value: c.id, label: c.name }))}
          />
          <Input label="Description" value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. School fees Term 1" />
          <Input label="Amount (NGN)" value={amt} onChange={e => setAmt(e.target.value)} />
          <Input label="Due date" type="date" value={due} onChange={e => setDue(e.target.value)} />
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border text-xs text-slate-600 dark:text-slate-400">
            Preview total: {formatCurrency(Number(amt.replace(/[^0-9]/g, "")) || 0)}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={create} disabled={saving}>{saving ? "Creating..." : "Create"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
