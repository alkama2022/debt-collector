import { useParams, Link } from "react-router-dom"
import { mockCustomers, mockInvoices, mockPayments } from "../services/mock"
import { formatCurrency, formatDate } from "../utils/format"
import { Card } from "../components/ui/card"
import { Badge, StatusBadge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/toast"

export default function CustomerDetail(){
  const {id}=useParams()
  const {push}=useToast()
  const c=mockCustomers.find(x=>x.id===id) || mockCustomers[0]
  const invs=mockInvoices.filter(i=>i.customerId===c.id)
  const pays=mockPayments.filter(p=>p.customerName===c.name)
  return <div className="space-y-4">
    <Link to="/customers" className="text-sm text-slate-600 hover:underline">? Back to customers</Link>
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-medium">{c.name[0]}</div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">{c.name} <Badge tone={c.overdue?"danger":"success"}>{c.overdue?"Overdue":"Active"}</Badge></h1>
            <div className="text-sm text-slate-600 mt-1">{c.phone} • {c.email} • ID: {c.customerId}</div>
            <div className="mt-2 font-mono text-xs text-slate-500">Outstanding: {formatCurrency(c.outstanding)} • Overdue: {formatCurrency(c.overdue)}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={()=>push("Edit (demo)","info")}>Edit</Button>
          <Button onClick={()=>push("Reminder sent (demo)","success")}>Send Reminder</Button>
        </div>
      </div>
    </Card>

    <div className="grid md:grid-cols-4 gap-3">
      <Card className="p-4"><div className="text-xs text-slate-500 uppercase">Total invoiced</div><div className="text-lg font-bold mt-1">{formatCurrency(c.totalInvoiced)}</div></Card>
      <Card className="p-4"><div className="text-xs text-slate-500 uppercase">Total paid</div><div className="text-lg font-bold mt-1 text-emerald-600">{formatCurrency(c.totalPaid)}</div></Card>
      <Card className="p-4"><div className="text-xs text-slate-500 uppercase">Outstanding</div><div className="text-lg font-bold mt-1">{formatCurrency(c.outstanding)}</div></Card>
      <Card className="p-4"><div className="text-xs text-slate-500 uppercase">Overdue</div><div className="text-lg font-bold mt-1 text-red-600">{formatCurrency(c.overdue)}</div></Card>
    </div>

    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-5">
        <h3 className="font-semibold">Invoice history</h3>
        <div className="mt-3 space-y-2">
          {invs.length? invs.map(inv=> <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
            <div><div className="font-mono text-sm font-medium">{inv.number}</div><div className="text-xs text-slate-500">{formatDate(inv.issueDate)} • Due {formatDate(inv.dueDate)}</div></div>
            <div className="text-right"><StatusBadge status={inv.status} /><div className="text-sm font-medium mt-1">{formatCurrency(inv.balance)}</div></div>
          </div>): <div className="text-sm text-slate-500">No invoices yet.</div>}
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold">Payment history</h3>
        <div className="mt-3 space-y-2">
          {pays.length? pays.map(p=> <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
            <div><div className="text-sm font-medium">{p.reference} • {p.method}</div><div className="text-xs text-slate-500">{formatDate(p.date)}</div></div>
            <div className="text-right"><StatusBadge status={p.status} /><div className="text-sm font-medium">{formatCurrency(p.amount)}</div></div>
          </div>): <div className="text-sm text-slate-500">No payments recorded.</div>}
        </div>
      </Card>
    </div>

    <Card className="p-5">
      <h3 className="font-semibold">Communication history</h3>
      <div className="mt-3 space-y-2 text-sm">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">Payment reminder sent — 20 Sep 2026 • WhatsApp • {c.name}</div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">Invoice created — 12 Sep 2026 • INV-1029 • {formatCurrency(200000)}</div>
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">Payment received — 18 Sep 2026 • PAY-9281 • {formatCurrency(100000)}</div>
      </div>
      <p className="text-xs text-slate-500 mt-2">Transparent timeline helps resolve disputes.</p>
    </Card>
  </div>
}
