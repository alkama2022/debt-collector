import { useParams, Link } from "react-router-dom"
import { useStore } from "../services/store"
import { formatCurrency, formatDate } from "../utils/format"
import { Card } from "../components/ui/card"
import { StatusBadge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/toast"

export default function InvoiceDetail(){
  const {id}=useParams()
  const {invoices,payments,addPayment}=useStore()
  const {push}=useToast()
  const inv=invoices.find(i=>i.id===id) || invoices[0]
  if(!inv) return <div>Not found</div>
  const pays=payments.filter(p=>p.invoiceId===inv.id)
  return <div className="space-y-4">
    <Link to="/invoices" className="text-sm text-slate-600 hover:underline">? Back to invoices</Link>
    <Card className="p-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-mono">{inv.number}</h1>
          <div className="text-sm text-slate-600 mt-1">{inv.customerName} • Due {formatDate(inv.dueDate)} • {inv.balance===0? "Paid in full": `${formatCurrency(inv.balance)} due`}</div>
          <div className="mt-2"><StatusBadge status={inv.status} /></div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={()=>push("Duplicated — new draft created (demo)","success")}>Duplicate</Button>
          <Button variant="secondary" onClick={()=>{navigator.clipboard?.writeText(inv.number); push("Link copied","success")}}>Share</Button>
          <Button onClick={()=>push("PDF downloaded (demo) — backend would generate","success")}>Download</Button>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500 border-b"><tr><th className="text-left py-2">Description</th><th className="text-right">Qty</th><th className="text-right">Unit</th><th className="text-right">Total</th></tr></thead>
          <tbody>
            {inv.items.map(it=> <tr key={it.id} className="border-b"><td className="py-3">{it.description}</td><td className="text-right">{it.quantity}</td><td className="text-right">{formatCurrency(it.unitPrice)}</td><td className="text-right font-medium">{formatCurrency(it.quantity*it.unitPrice)}</td></tr>)}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end">
        <div className="w-full md:w-72 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatCurrency(inv.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Discount</span><span>-{formatCurrency(inv.discount)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>{formatCurrency(inv.tax)}</span></div>
          <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>{formatCurrency(inv.total)}</span></div>
          <div className="flex justify-between text-emerald-700"><span>Amount paid</span><span>{formatCurrency(inv.amountPaid)}</span></div>
          <div className="flex justify-between font-bold text-brand-600 text-base"><span>Balance</span><span>{formatCurrency(inv.balance)}</span></div>
          <div className="text-xs text-slate-500 mt-2">Live — pay from Payments and this updates instantly (no reload).</div>
        </div>
      </div>
    </Card>
    <Card className="p-5">
      <div className="flex items-center justify-between"><h3 className="font-semibold">Payments</h3><Link to="/payments" className="text-xs text-brand-600">Record payment</Link></div>
      <div className="mt-3 space-y-2">
        {pays.length? pays.map(p=> <div key={p.id} className="flex justify-between p-3 rounded-xl border"><div><div className="text-sm font-medium">{p.reference} • {p.method}</div><div className="text-xs text-slate-500">{formatDate(p.date)}</div></div><div className="font-medium">{formatCurrency(p.amount)}</div></div>): <div className="text-sm text-slate-500 p-4 border border-dashed rounded-xl text-center">No payments yet — record from Payments; receipt appears there and this list updates live.</div>}
      </div>
    </Card>
  </div>
}
