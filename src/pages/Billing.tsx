import { useEffect, useState } from "react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { getEntitlements, getInvoices, getTransactions, cancel, reactivate, updateOveragePolicy, getCredits } from "../services/billing"
import { useToast } from "../components/ui/toast"
import { useNavigate } from "react-router-dom"

export default function Billing(){
  const [ent,setEnt]=useState<any>(null)
  const [invoices,setInvoices]=useState<any[]>([])
  const [txns,setTxns]=useState<any[]>([])
  const [credits,setCredits]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const {push}=useToast()
  const nav=useNavigate()
  const load=()=>{
    Promise.all([getEntitlements().catch(()=>null), getInvoices().catch(()=>({results:[]})), getTransactions().catch(()=>({results:[]})), getCredits().catch(()=>null)]).then(([e,inv,tx,cr])=>{
      setEnt(e); setInvoices(inv.results ?? inv ?? []); setTxns(tx.results ?? tx ?? []); setCredits(cr); setLoading(false)
    })
  }
  useEffect(load,[])
  if(loading) return <div className="p-6 text-sm">Loading billing...</div>
  if(!ent) return <div className="p-6">No subscription found</div>
  const s=ent.subscription
  const limits=ent.limits
  const pctColor = (pct:number|null)=> pct===null?"bg-slate-200": pct>=90?"bg-red-500": pct>=75?"bg-amber-500":"bg-emerald-500"
  return <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-bold dark:text-white">Billing & Subscription</h1>
      <Button variant="secondary" onClick={()=>nav("/pricing")}>View plans</Button>
    </div>

    <Card className="p-6">
      <div className="flex flex-wrap gap-4 justify-between">
        <div>
          <div className="text-sm text-slate-500">Current Plan</div>
          <div className="text-lg font-semibold dark:text-white capitalize">{s.plan_name || s.plan} · {s.currency} {Number(s.price).toLocaleString()}/month</div>
          <div className="text-xs text-slate-500 mt-1">Status: <span className={`px-2 py-0.5 rounded-full text-xs ${s.status==="active"?"bg-emerald-100 text-emerald-700": s.status==="trialing"?"bg-blue-100 text-blue-700":"bg-amber-100 text-amber-700"}`}>{s.status}</span></div>
        </div>
        <div className="text-right text-sm">
          <div className="text-slate-500">Next Billing Date</div>
          <div className="font-medium dark:text-white">{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("en-NG",{day:"numeric",month:"long",year:"numeric"}) : "—"}</div>
          <div className="text-xs text-slate-500 mt-1">Overage: {s.overage_policy}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={()=>nav("/pricing")}>Upgrade</Button>
        <Button variant="secondary" onClick={()=>nav("/pricing")}>Downgrade</Button>
        {!s.cancel_at_period_end && s.status!=="cancelled" ? <Button variant="ghost" onClick={async()=>{await cancel("period_end"); push("Will cancel at period end","info"); load()}}>Cancel at period end</Button> : <Button variant="secondary" onClick={async()=>{await reactivate(); push("Reactivated","success"); load()}}>Reactivate</Button>}
      </div>
      <div className="mt-4 flex gap-2 text-xs">
        {(["block","credits","auto_charge"] as const).map(p=> <button key={p} onClick={async()=>{await updateOveragePolicy(p); push("Overage policy: "+p,"success"); load()}} className={`px-3 py-1.5 rounded-full border ${s.overage_policy===p?"bg-slate-900 text-white border-slate-900":"bg-white border-slate-200"}`}>{p}</button>)}
      </div>
      <p className="text-xs text-slate-500 mt-2">You will never be silently charged. Overage requires explicit policy.</p>
    </Card>

    <Card className="p-6">
      <h3 className="font-semibold dark:text-white">Usage</h3>
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        {Object.entries(limits).map(([k,v]:any)=>(
          <div key={k} className="p-3 rounded-xl border">
            <div className="flex justify-between text-sm"><span className="font-medium">{k.replace(/_/g," ")}</span><span className="text-slate-500">{v.used} / {v.limit ?? "∞"}</span></div>
            <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full ${pctColor(v.pct)} transition-all`} style={{width: `${v.pct ?? 0}%`}} />
            </div>
            {v.pct!==null && v.pct>=80 && <div className="text-xs text-amber-600 mt-1">You have used {v.pct}% of your monthly allowance.</div>}
            {v.pct===100 && <div className="text-xs text-red-600">Limit reached. Upgrade or adjust overage policy.</div>}
            {v.limit!==null && v.used>v.limit && <div className="text-xs text-red-600">Over limit — existing data kept, cannot add more until within limit.</div>}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" onClick={()=>nav("/billing/usage")}>View usage & AI costs →</Button>
        <Button variant="ghost" onClick={()=>nav("/billing/invoices")}>Invoices & receipts →</Button>
      </div>
      {credits && <div className="mt-3 text-sm">Credits remaining: {credits.total_remaining}</div>}
    </Card>

    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-6">
        <h3 className="font-semibold">Billing history</h3>
        <div className="mt-3 space-y-2 text-sm">
          {invoices.slice(0,5).map((inv:any)=> <div key={inv.id} className="flex justify-between p-3 rounded-xl border"><span>{inv.invoice_number} · {inv.status}</span><span>{inv.currency} {inv.amount}</span></div>)}
          {invoices.length===0 && <div className="text-xs text-slate-500">No invoices yet</div>}
        </div>
        <Button variant="ghost" className="mt-3" onClick={()=>nav("/billing/invoices")}>All invoices</Button>
      </Card>
      <Card className="p-6">
        <h3 className="font-semibold">Transactions</h3>
        <div className="mt-3 space-y-2 text-sm">
          {txns.slice(0,5).map((t:any)=> <div key={t.id} className="flex justify-between p-3 rounded-xl border"><span>{t.type} · {t.status}</span><span>{t.currency} {t.amount}</span></div>)}
          {txns.length===0 && <div className="text-xs text-slate-500">No transactions</div>}
        </div>
      </Card>
    </div>
  </div>
}
