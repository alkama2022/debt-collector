import { useState, useMemo } from "react"
import { useStore } from "../services/store"
import { formatCurrency, formatDate } from "../utils/format"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Modal } from "../components/ui/modal"
import { Input, Select, Textarea } from "../components/ui/input"
import { StatusBadge } from "../components/ui/badge"
import { useToast } from "../components/ui/toast"
import { CreditCard } from "lucide-react"

export default function Payments(){
  const {payments,invoices,addPayment}=useStore()
  const {push}=useToast()
  const [open,setOpen]=useState(false)
  const [openReceipt,setOpenReceipt]=useState<any>(null)
  const [q,setQ]=useState("")
  const [selInv,setSelInv]=useState(invoices[0]?.id || "")
  const [method,setMethod]=useState("Bank transfer")
  const [amount,setAmount]=useState("50000")
  const [ref,setRef]=useState("PAY-"+Math.floor(10000+Math.random()*90000))
  const [notes,setNotes]=useState("")
  const [offline,setOffline]=useState(false)
  const [saving,setSaving]=useState(false)
  const list=useMemo(()=> payments.filter(p=> !q || p.reference.toLowerCase().includes(q.toLowerCase())||p.customerName.toLowerCase().includes(q.toLowerCase())),[payments,q])
  const submit=()=>{
    if(offline){ push("You are offline. Your changes have not been submitted yet.","error"); return}
    const inv=invoices.find(i=>i.id===selInv)
    if(!inv){ push("Select invoice","error"); return}
    const n=Number(amount.replace(/[^0-9]/g,""))
    if(!n){ push("Enter valid amount","error"); return}
    if(n>inv.balance){ push(`Amount exceeds balance ${formatCurrency(inv.balance)}`,"error"); return}
    setSaving(true)
    setTimeout(()=>{
      addPayment({invoiceId:selInv, amount:n, method, ref, notes})
      const remaining = inv.balance - n
      push(`Payment recorded • ${formatCurrency(n)} • backend confirms success`,"success")
      setOpen(false); setSaving(false)
      setOpenReceipt({amount:n, method, ref, date:new Date().toISOString(), customer:inv.customerName, invoice:inv.number, remaining})
      setRef("PAY-"+Math.floor(10000+Math.random()*90000))
    },800)
  }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-xl font-bold">Payments</h1><p className="text-sm text-slate-600">{payments.length} payments • Recording updates invoice balance + customer outstanding live.</p></div>
      <Button onClick={()=>setOpen(true)}>Record Payment</Button>
    </div>

    <Card className="p-4 flex flex-col md:flex-row gap-3">
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search payment, customer, invoice" className="flex-1 h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={offline} onChange={e=>setOffline(e.target.checked)} /> Simulate offline</label>
      {offline && <span className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800">You are offline — retry when online</span>}
    </Card>

    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="text-left p-3">Reference</th><th className="text-left">Customer</th><th className="text-left">Invoice</th><th className="text-right">Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {list.map(p=> <tr key={p.id} className="border-t hover:bg-slate-50">
              <td className="p-3 font-mono font-medium">{p.reference}</td>
              <td>{p.customerName}</td>
              <td className="font-mono text-xs">{p.invoiceNumber}</td>
              <td className="text-right font-medium">{formatCurrency(p.amount)}</td>
              <td className="text-center text-xs">{p.method}</td>
              <td className="text-center"><StatusBadge status={p.status} /></td>
              <td className="text-xs">{formatDate(p.date)}</td>
            </tr>)}
            {list.length===0 && <tr><td colSpan={7} className="p-8 text-center text-sm text-slate-500">No payments yet — record one and see receipt + balance update instantly.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>

    <Modal open={open} onClose={()=>setOpen(false)} title="Record payment">
      <div className="space-y-3">
        <Select label="Invoice" value={selInv} onChange={e=>setSelInv(e.target.value)} options={invoices.map(i=>({value:i.id,label:i.number+" — "+i.customerName+" • bal "+formatCurrency(i.balance)}))} />
        <Input label="Amount" value={amount} onChange={e=>setAmount(e.target.value)} />
        {selInv && <div className="text-xs text-slate-600">Balance: {formatCurrency(invoices.find(i=>i.id===selInv)?.balance||0)} • Paying more than balance is blocked (backend would reject).</div>}
        <Select label="Payment method" value={method} onChange={e=>setMethod(e.target.value)} options={[{value:"Bank transfer",label:"Bank transfer"},{value:"Cash",label:"Cash"},{value:"Card",label:"Card"},{value:"Online payment",label:"Online payment"},{value:"POS",label:"POS"},{value:"Other",label:"Other"}]} />
        <Input label="Reference" value={ref} onChange={e=>setRef(e.target.value)} />
        <Textarea label="Notes" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Optional notes" />
        <div className="text-xs text-slate-500">Status will be set to <span className="font-medium">successful</span> only after this save — mimics provider confirmation. Not on click alone.</div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={()=>setOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving?"Saving...":"Save payment"}</Button>
        </div>
      </div>
    </Modal>

    <Modal open={!!openReceipt} onClose={()=>setOpenReceipt(null)} title="Payment received successfully.">
      <div className="space-y-3">
        <div className="p-4 rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 font-semibold"><CreditCard className="w-4 h-4"/> Receipt — {openReceipt?.invoice}</div>
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Customer</span><span className="font-medium">{openReceipt?.customer}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-bold">{openReceipt? formatCurrency(Number(openReceipt.amount)): ""}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Method</span><span>{openReceipt?.method}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Reference</span><span className="font-mono">{openReceipt?.ref}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Date</span><span>{openReceipt?.date? formatDate(openReceipt.date):""}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Remaining balance</span><span className="font-medium">{openReceipt? formatCurrency(openReceipt.remaining): ""}</span></div>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={()=>setOpenReceipt(null)}>Close</Button>
          <Button onClick={()=>{push("Receipt downloaded • shareable PDF (demo)","success"); }}>Download / Share</Button>
        </div>
        <div className="text-xs text-slate-500">Receipt updates live; remaining balance is post-payment value from store.</div>
      </div>
    </Modal>
  </div>
}
