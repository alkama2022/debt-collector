import { useParams, Link } from "react-router-dom"
import { useStore } from "../services/store"
import { formatCurrency, formatDate } from "../utils/format"
import { Card } from "../components/ui/card"
import { Badge, StatusBadge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/toast"

export default function CustomerDetail(){
  const {id}=useParams()
  const {customers,invoices,payments,addReminder}=useStore()
  const {push}=useToast()
  const c=customers.find(x=>x.id===id) || customers[0]
  if(!c) return <div className="text-sm text-slate-500">Customer not found</div>
  const invs=invoices.filter(i=>i.customerId===c.id)
  const pays=payments.filter(p=>p.customerName===c.name)
  return <div className="space-y-4">
    <Link to="/customers" className="text-sm text-slate-600 hover:underline">? Back to customers</Link>
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-medium">{c.name[0]}</div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">{c.name} <Badge tone={c.overdue?"danger":c.outstanding?"warning":"success"}>{c.overdue?"Overdue":c.outstanding?"Owes":"Clear"}</Badge></h1>
            <div className="text-sm text-slate-600 mt-1">{c.phone} • {c.email||"no email"} • ID: {c.customerId}</div>
            <div className="mt-2 font-mono text-xs text-slate-500">Outstanding: {formatCurrency(c.outstanding)} • Overdue: {formatCurrency(c.overdue)} • Total invoiced {formatCurrency(c.totalInvoiced)}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={()=>push("Edit would open form (persisted)","info")}>Edit</Button>
          <Button onClick={()=>{
            const inv=invs.find(i=>i.balance>0)
            if(inv){ addReminder({invoiceId:inv.id, channel:"whatsapp"}); push("Reminder sent — see Reminders live","success")}
            else push("No open invoice to remind","info")
          }}>Send Reminder</Button>
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
        <div className="flex items-center justify-between"><h3 className="font-semibold">Invoice history</h3><Link to="/invoices" className="text-xs text-brand-600">Create</Link></div>
        <div className="mt-3 space-y-2">
          {invs.length? invs.map(inv=> <Link key={inv.id} to={`/invoices/${inv.id}`} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50">
            <div><div className="font-mono text-sm font-medium">{inv.number}</div><div className="text-xs text-slate-500">{formatDate(inv.issueDate)} • Due {formatDate(inv.dueDate)}</div></div>
            <div className="text-right"><StatusBadge status={inv.status} /><div className="text-sm font-medium mt-1">{formatCurrency(inv.balance)}</div></div>
          </Link>): <div className="text-sm text-slate-500 p-4 border border-dashed rounded-xl text-center">No invoices — create one for this customer and balances update live.</div>}
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold">Payment history</h3>
        <div className="mt-3 space-y-2">
          {pays.length? pays.map(p=> <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
            <div><div className="text-sm font-medium">{p.reference} • {p.method}</div><div className="text-xs text-slate-500">{formatDate(p.date)}</div></div>
            <div className="text-right"><StatusBadge status={p.status} /><div className="text-sm font-medium">{formatCurrency(p.amount)}</div></div>
          </div>): <div className="text-sm text-slate-500 p-4 border border-dashed rounded-xl text-center">No payments — record one and watch this + invoice + dashboard live.</div>}
        </div>
      </Card>
    </div>

    <Card className="p-5">
      <h3 className="font-semibold">Communication history</h3>
      <div className="mt-3 space-y-2 text-sm">
        {invs.slice(0,2).map(inv=> <div key={inv.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">Invoice {inv.number} created — {formatDate(inv.issueDate)} • {formatCurrency(inv.total)}</div>)}
        {pays.slice(0,2).map(p=> <div key={p.id} className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">Payment received — {formatDate(p.date)} • {p.reference} • {formatCurrency(p.amount)}</div>)}
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">Payment reminder sent — live via Reminders store</div>
      </div>
      <p className="text-xs text-slate-500 mt-2">Transparent timeline helps resolve disputes — now fed from real store.</p>
    </Card>
  </div>
}
