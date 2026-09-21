import { useState } from "react"
import { useStore } from "../services/store"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/toast"
import { formatCurrency } from "../utils/format"

export default function Reports(){
  const {customers,invoices,payments,audits}=useStore()
  const {push}=useToast()
  const [range,setRange]=useState("30 days")
  const totalOut=invoices.reduce((a,b)=>a+b.balance,0)
  const totalOver=invoices.filter(i=>i.status==="overdue").reduce((a,b)=>a+b.balance,0)
  const totalCollected=payments.filter(p=>p.status==="successful").reduce((a,b)=>a+b.amount,0)
  const exp=()=> push("Exported CSV — would call GET /reports/export?format=csv (demo)","success")
  const expPdf=()=> push("Exported PDF — backend generates (demo)","success")
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-xl font-bold">Reports</h1><p className="text-sm text-slate-600">{invoices.length} invoices • {customers.length} customers • live aggregates.</p></div>
      <div className="flex gap-2">
        <select value={range} onChange={e=>setRange(e.target.value)} className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm">
          <option>7 days</option><option>30 days</option><option>3 months</option><option>12 months</option>
        </select>
        <Button variant="secondary" onClick={exp}>Export CSV</Button>
        <Button variant="secondary" onClick={expPdf}>Export PDF</Button>
      </div>
    </div>

    <div className="grid md:grid-cols-3 gap-3">
      <Card className="p-4"><div className="text-xs text-slate-500 uppercase">Outstanding balances</div><div className="text-xl font-bold mt-1">{formatCurrency(totalOut)}</div><div className="text-xs text-slate-500">{invoices.filter(i=>i.balance>0).length} open invoices</div></Card>
      <Card className="p-4"><div className="text-xs text-slate-500 uppercase">Overdue accounts</div><div className="text-xl font-bold mt-1">{formatCurrency(totalOver)}</div><div className="text-xs text-red-600">{invoices.filter(i=>i.status==="overdue").length} accounts</div></Card>
      <Card className="p-4"><div className="text-xs text-slate-500 uppercase">Collection rate</div><div className="text-xl font-bold mt-1">{totalOut+totalCollected? Math.round(totalCollected/(totalCollected+totalOut)*100)+"%": "—"}</div><div className="text-xs text-slate-500">Collected {formatCurrency(totalCollected)} • {range}</div></Card>
    </div>

    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-5">
        <h3 className="font-semibold">Collection report</h3>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between p-3 rounded-xl bg-slate-50 border"><span>Expected</span><span className="font-medium">{formatCurrency(totalCollected+totalOut)}</span></div>
          <div className="flex justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200"><span>Collected</span><span className="font-medium text-emerald-700">{formatCurrency(totalCollected)}</span></div>
          <div className="flex justify-between p-3 rounded-xl bg-red-50 border border-red-200"><span>Overdue</span><span className="font-medium text-red-700">{formatCurrency(totalOver)}</span></div>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold">Customer payment behavior</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500"><tr><th className="text-left">Customer</th><th className="text-right">Outstanding</th><th className="text-right">Paid %</th></tr></thead>
            <tbody>
              {customers.slice(0,4).map(c=>{
                const pct=c.totalInvoiced? Math.round(c.totalPaid/c.totalInvoiced*100):0
                return <tr key={c.id} className="border-t"><td className="py-2">{c.name}</td><td className="text-right">{formatCurrency(c.outstanding)}</td><td className="text-right">{pct}%</td></tr>
              })}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-slate-500 mt-2">Computed from real customer aggregates — add payment and watch % change.</div>
      </Card>
    </div>

    <Card className="p-5">
      <h3 className="font-semibold">Staff activity (audit log — live)</h3>
      <div className="mt-3 space-y-2 text-sm">
        {audits.slice(0,6).map(a=> <div key={a.id} className="p-3 rounded-xl border flex justify-between"><span>{new Date(a.time).toLocaleDateString()} — {a.text}</span><span className="text-xs text-slate-500">{new Date(a.time).toLocaleTimeString()}</span></div>)}
      </div>
    </Card>
  </div>
}
