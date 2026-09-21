import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { mockInvoices, mockCustomers } from "../services/mock"
import { formatCurrency, formatDate } from "../utils/format"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Modal } from "../components/ui/modal"
import { Input, Select, Textarea } from "../components/ui/input"
import { StatusBadge } from "../components/ui/badge"
import { EmptyState } from "../components/ui/empty"
import { useToast } from "../components/ui/toast"
import { FileText, Plus } from "lucide-react"

export default function Invoices(){
  const {push}=useToast()
  const [q,setQ]=useState("")
  const [status,setStatus]=useState("all")
  const [open,setOpen]=useState(false)
  const [cust,setCust]=useState(mockCustomers[0].id)
  const [amt,setAmt]=useState("75000")
  const [due,setDue]=useState("2026-09-30")
  const filtered=useMemo(()=> mockInvoices.filter(i=> {
    const m= q? i.number.toLowerCase().includes(q.toLowerCase())||i.customerName.toLowerCase().includes(q.toLowerCase()):true
    const s= status==="all"||i.status===status
    return m&&s
  }),[q,status])
  const create=()=>{
    push("Invoice created (demo) — totals computed by backend","success")
    setOpen(false)
  }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold">Invoices</h1>
        <p className="text-sm text-slate-600">Create, view, duplicate, cancel, share, download — backend calculates totals.</p>
      </div>
      <Button onClick={()=>setOpen(true)} className="gap-2"><Plus className="w-4 h-4"/> Create Invoice</Button>
    </div>

    <Card className="p-4 flex flex-col md:flex-row gap-3">
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search invoice or customer" className="flex-1 h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      <select value={status} onChange={e=>setStatus(e.target.value)} className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm">
        <option value="all">All status</option>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="paid">Paid</option>
        <option value="overdue">Overdue</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </Card>

    {filtered.length===0 ? <EmptyState title="No invoices yet" desc="Create your first invoice to start tracking balances." icon={<FileText className="w-6 h-6"/>} action={{label:"Create Invoice", onClick:()=>setOpen(true)}} /> : <>
      <div className="grid md:hidden gap-3">
        {filtered.map(inv=> <Card key={inv.id} className="p-4">
          <div className="flex justify-between">
            <div className="font-mono text-sm font-semibold">{inv.number}</div>
            <StatusBadge status={inv.status} />
          </div>
          <div className="text-sm mt-1">{inv.customerName}</div>
          <div className="text-xs text-slate-500">Due {formatDate(inv.dueDate)} • {formatCurrency(inv.balance)} balance</div>
          <Link to={`/invoices/${inv.id}`} className="mt-3 block text-center py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium min-h-[44px] flex items-center justify-center">View</Link>
        </Card>)}
      </div>
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="text-left p-3">Invoice</th><th className="text-left">Customer</th><th className="text-left">Issue</th><th className="text-left">Due</th><th>Status</th><th className="text-right">Total</th><th className="text-right">Balance</th><th></th></tr></thead>
            <tbody>
              {filtered.map(inv=> <tr key={inv.id} className="border-t hover:bg-slate-50">
                <td className="p-3 font-mono font-medium"><Link to={`/invoices/${inv.id}`} className="hover:underline">{inv.number}</Link></td>
                <td>{inv.customerName}</td>
                <td>{formatDate(inv.issueDate)}</td>
                <td>{formatDate(inv.dueDate)}</td>
                <td><StatusBadge status={inv.status} /></td>
                <td className="text-right">{formatCurrency(inv.total)}</td>
                <td className="text-right font-medium">{formatCurrency(inv.balance)}</td>
                <td className="pr-3 text-right"><Link to={`/invoices/${inv.id}`} className="text-xs px-3 py-1.5 rounded-full border bg-white">View</Link></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </Card>
    </>}

    <Modal open={open} onClose={()=>setOpen(false)} title="Create invoice">
      <div className="space-y-3">
        <Select label="Customer" value={cust} onChange={e=>setCust(e.target.value)} options={mockCustomers.map(c=>({value:c.id,label:c.name}))} />
        <Input label="Amount (NGN)" value={amt} onChange={e=>setAmt(e.target.value)} />
        <Input label="Due date" type="date" value={due} onChange={e=>setDue(e.target.value)} />
        <Textarea label="Notes / Payment instructions" placeholder="Bank details, etc." />
        <div className="p-3 rounded-xl bg-slate-50 border text-xs text-slate-600">Subtotal • Discount • Tax • Total • Amount paid • Balance — displayed from backend values. Frontend calc is preview only.</div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={()=>setOpen(false)}>Cancel</Button>
          <Button onClick={create}>Create</Button>
        </div>
      </div>
    </Modal>
  </div>
}
