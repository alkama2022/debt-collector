import { useEffect, useState } from "react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { getInvoices, getTransactions } from "../services/billing"

export default function BillingInvoices(){
  const [invoices,setInvoices]=useState<any[]>([])
  const [txns,setTxns]=useState<any[]>([])
  useEffect(()=>{
    getInvoices().then(r=> setInvoices(r.results ?? r ?? [])).catch(()=>{})
    getTransactions().then(r=> setTxns(r.results ?? r ?? [])).catch(()=>{})
  },[])
  return <div className="space-y-6">
    <h1 className="text-xl font-bold dark:text-white">Invoices & Transactions</h1>
    <Card className="p-6">
      <h3 className="font-semibold">Billing Invoices</h3>
      <div className="mt-3 space-y-2 text-sm">
        {invoices.map((inv:any)=> <div key={inv.id} className="flex justify-between p-3 rounded-xl border"><div><div className="font-medium">{inv.invoice_number} · {inv.status}</div><div className="text-xs text-slate-500">{new Date(inv.created_at).toLocaleDateString()}</div></div><div className="font-semibold">{inv.currency} {inv.amount}</div></div>)}
        {invoices.length===0 && <div className="text-xs text-slate-500">No billing invoices</div>}
      </div>
    </Card>
    <Card className="p-6">
      <h3 className="font-semibold">Transactions · Receipts</h3>
      <div className="mt-3 space-y-2 text-sm">
        {txns.map((t:any)=> <div key={t.id} className="flex justify-between p-3 rounded-xl border"><div><div className="font-medium">{t.type} · {t.status}</div><div className="text-xs text-slate-500">{t.provider} · {t.provider_ref}</div></div><div>{t.currency} {t.amount}</div></div>)}
        {txns.length===0 && <div className="text-xs text-slate-500">No transactions</div>}
      </div>
      <Button variant="secondary" className="mt-3" onClick={()=>window.print()}>Print</Button>
    </Card>
  </div>
}
