/**
 * FAB — Floating Action Button
 * Mobile-first quick-add: Customer · Invoice · Payment in 3 taps.
 */
import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, X, Users, FileText, CreditCard } from "lucide-react"
import { useStore } from "../../services/store"
import { useToast } from "./toast"
import { Modal } from "./modal"
import { Input, Select } from "./input"
import { Button } from "./button"
import { formatCurrency } from "../../utils/format"
import { useShortcutEvents } from "../../hooks/useKeyboardShortcuts"

const ACTIONS = [
  { label: "Record Payment", icon: CreditCard, color: "bg-emerald-600", key: "payment" },
  { label: "Create Invoice",  icon: FileText,   color: "bg-brand-600",   key: "invoice" },
  { label: "Add Customer",    icon: Users,       color: "bg-violet-600",  key: "customer" },
] as const

type ActionKey = typeof ACTIONS[number]["key"]

export function FAB() {
  const [open, setOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<ActionKey | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const nav = useNavigate()
  const { customers, invoices, addCustomer, addInvoice, addPayment } = useStore()
  const { push } = useToast()

  // Listen for keyboard shortcut events (n c / n i / n p)
  useShortcutEvents({
    onNewCustomer: () => { setOpen(false); setActiveModal("customer") },
    onNewInvoice:  () => { setOpen(false); setActiveModal("invoice") },
    onNewPayment:  () => { setOpen(false); setActiveModal("payment") },
  })

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setActiveModal(null) } }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const handleAction = (key: ActionKey) => {
    setOpen(false)
    setActiveModal(key)
  }

  return (
    <>
      {/* FAB container */}
      <div ref={ref} className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-40 flex flex-col items-end gap-3">
        {/* Action items — appear above the main button */}
        {open && ACTIONS.map((a, i) => (
          <div
            key={a.key}
            className="flex items-center gap-3 animate-in slide-in-from-bottom-2"
            style={{ animationDelay: `${i * 40}ms`, animationDuration: "180ms", animationFillMode: "both" }}
          >
            <span className="text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-sm whitespace-nowrap">
              {a.label}
            </span>
            <button
              onClick={() => handleAction(a.key)}
              className={`w-12 h-12 rounded-full ${a.color} text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all`}
              aria-label={a.label}
            >
              <a.icon className="w-5 h-5" />
            </button>
          </div>
        ))}

        {/* Main FAB button */}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? "Close actions" : "Quick add"}
          aria-expanded={open}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 ${
            open
              ? "bg-slate-800 dark:bg-slate-600 rotate-45 scale-110"
              : "bg-brand-600 hover:bg-brand-700 hover:scale-105"
          }`}
        >
          {open ? <X className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
        </button>
      </div>

      {/* Quick modals */}
      <QuickCustomerModal
        open={activeModal === "customer"}
        onClose={() => setActiveModal(null)}
        onSave={async (data) => {
          await addCustomer(data)
          push(`${data.name} added ✓`, "success")
          setActiveModal(null)
        }}
      />

      <QuickInvoiceModal
        open={activeModal === "invoice"}
        onClose={() => setActiveModal(null)}
        customers={customers}
        onSave={async (data) => {
          await addInvoice(data)
          push("Invoice created ✓", "success")
          setActiveModal(null)
        }}
      />

      <QuickPaymentModal
        open={activeModal === "payment"}
        onClose={() => setActiveModal(null)}
        invoices={invoices.filter(i => i.balance > 0)}
        onSave={async (data) => {
          await addPayment(data)
          push(`Payment of ${formatCurrency(data.amount)} recorded ✓`, "success")
          setActiveModal(null)
        }}
      />
    </>
  )
}

// ─── Quick Customer Modal ────────────────────────────────────────────────────
function QuickCustomerModal({ open, onClose, onSave }: {
  open: boolean; onClose: () => void
  onSave: (d: { name: string; phone: string; email?: string }) => Promise<void>
}) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [saving, setSaving] = useState(false)

  const reset = () => { setName(""); setPhone(""); setEmail(""); setSaving(false) }
  const close = () => { reset(); onClose() }

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    try { await onSave({ name: name.trim(), phone, email: email || undefined }) }
    catch (e: any) { /* toast handled above */ }
    finally { setSaving(false); reset() }
  }

  return (
    <Modal open={open} onClose={close} title="Add customer">
      <div className="space-y-3">
        <Input label="Name *" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Musa Ibrahim" autoFocus />
        <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0803 123 4567" type="tel" />
        <Input label="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} placeholder="musa@gmail.com" type="email" />
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" onClick={close} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name.trim()}>{saving ? "Saving…" : "Add customer"}</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Quick Invoice Modal ─────────────────────────────────────────────────────
function QuickInvoiceModal({ open, onClose, customers, onSave }: {
  open: boolean; onClose: () => void
  customers: any[]
  onSave: (d: { customerId: string; amount: number; dueDate: string; desc: string }) => Promise<void>
}) {
  const [custId, setCustId] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  )
  const [desc, setDesc] = useState("School fees")
  const [saving, setSaving] = useState(false)

  const custOptions = customers.map(c => ({ value: c.id, label: `${c.name}${c.phone ? " · " + c.phone : ""}` }))

  const reset = () => { setCustId(""); setAmount(""); setDesc("School fees"); setSaving(false) }
  const close = () => { reset(); onClose() }

  const save = async () => {
    const n = Number(amount.replace(/[^0-9.]/g, ""))
    const id = custId || customers[0]?.id
    if (!n || !id) return
    setSaving(true)
    try { await onSave({ customerId: id, amount: n, dueDate, desc: desc || "Service fee" }) }
    catch { /* toast handled above */ }
    finally { setSaving(false); reset() }
  }

  const n = Number(amount.replace(/[^0-9.]/g, ""))

  return (
    <Modal open={open} onClose={close} title="Create invoice">
      <div className="space-y-3">
        {customers.length > 0 ? (
          <Select
            label="Customer *"
            value={custId || customers[0]?.id || ""}
            onChange={e => setCustId(e.target.value)}
            options={custOptions}
          />
        ) : (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            No customers yet — add one first.
          </div>
        )}
        <Input label="Description" value={desc} onChange={e => setDesc(e.target.value)} placeholder="School fees Term 2" />
        <Input label="Amount (NGN) *" value={amount} onChange={e => setAmount(e.target.value)} placeholder="85000" type="text" inputMode="numeric" />
        <Input label="Due date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        {n > 0 && (
          <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-2 border">
            Total: <span className="font-semibold text-slate-800">{formatCurrency(n)}</span>
          </div>
        )}
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" onClick={close} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || !n || customers.length === 0}>
            {saving ? "Creating…" : "Create invoice"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Quick Payment Modal ─────────────────────────────────────────────────────
function QuickPaymentModal({ open, onClose, invoices, onSave }: {
  open: boolean; onClose: () => void
  invoices: any[]
  onSave: (d: { invoiceId: string; amount: number; method: string; ref: string }) => Promise<void>
}) {
  const [invId, setInvId] = useState("")
  const [method, setMethod] = useState("Bank transfer")
  const [saving, setSaving] = useState(false)

  const selectedInv = invoices.find(i => i.id === (invId || invoices[0]?.id))

  const reset = () => { setInvId(""); setMethod("Bank transfer"); setSaving(false) }
  const close = () => { reset(); onClose() }

  const save = async () => {
    const inv = selectedInv
    if (!inv) return
    setSaving(true)
    try {
      await onSave({
        invoiceId: inv.id,
        amount: inv.balance,
        method,
        ref: `PAY-${Date.now().toString(36).toUpperCase()}`,
      })
    } catch { /* toast handled above */ }
    finally { setSaving(false); reset() }
  }

  const invOptions = invoices.map(i => ({
    value: i.id,
    label: `${i.customerName} — ${i.number} — ${formatCurrency(i.balance)}`,
  }))

  return (
    <Modal open={open} onClose={close} title="Record payment">
      <div className="space-y-3">
        {invoices.length > 0 ? (
          <>
            <Select
              label="Invoice *"
              value={invId || invoices[0]?.id || ""}
              onChange={e => setInvId(e.target.value)}
              options={invOptions}
            />
            {selectedInv && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-800">
                Full balance: {formatCurrency(selectedInv.balance)}
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
                { value: "POS", label: "POS" },
                { value: "Online", label: "Online payment" },
              ]}
            />
          </>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50 border text-xs text-slate-600">
            No open invoices — create one first.
          </div>
        )}
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" onClick={close} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || invoices.length === 0}>
            {saving ? "Recording…" : `Record ${selectedInv ? formatCurrency(selectedInv.balance) : "payment"}`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
