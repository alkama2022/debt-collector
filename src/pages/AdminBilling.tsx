import { useEffect, useState } from "react"
import { Card } from "../components/ui/card"
import { getAdminBilling } from "../services/billing"

export default function AdminBilling(){
  const [data,setData]=useState<any>(null)
  useEffect(()=>{ getAdminBilling().then(setData).catch(()=> setData({error: "Admin only"})) },[])
  if(!data) return <div className="p-6 text-sm">Loading admin billing...</div>
  if(data.error) return <div className="p-6 text-red-600">{data.error}</div>
  return <div className="space-y-6">
    <h1 className="text-xl font-bold dark:text-white">Admin · Billing Dashboard</h1>
    <div className="grid md:grid-cols-4 gap-4">
      <Card className="p-6"><div className="text-sm text-slate-500">Total Orgs</div><div className="text-2xl font-bold">{data.total_organizations}</div></Card>
      <Card className="p-6"><div className="text-sm text-slate-500">MRR</div><div className="text-2xl font-bold">₦{Number(data.mrr).toLocaleString()}</div><div className="text-xs text-slate-500">ARR ₦{Number(data.arr).toLocaleString()}</div></Card>
      <Card className="p-6"><div className="text-sm text-slate-500">Churn (30d)</div><div className="text-2xl font-bold">{data.churn_rate}%</div><div className="text-xs text-slate-500">{data.cancellations_30d} cancels / {data.new_subscriptions_30d} new</div></Card>
      <Card className="p-6"><div className="text-sm text-slate-500">Margin</div><div className="text-2xl font-bold">₦{Number(data.estimated_margin).toLocaleString()}</div><div className="text-xs text-slate-500">Gross ₦{Number(data.gross).toLocaleString()} · Cost ₦{Number((data.provider_cost_minor||0)/100).toLocaleString()}</div></Card>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-6">
        <h3 className="font-semibold">By Plan</h3>
        <div className="mt-3 space-y-2 text-sm">{(data.by_plan||[]).map((r:any)=> <div key={r.plan} className="flex justify-between p-2 border rounded-lg"><span className="capitalize">{r.plan}</span><span>{r.c}</span></div>)}</div>
      </Card>
      <Card className="p-6">
        <h3 className="font-semibold">By Status</h3>
        <div className="mt-3 space-y-2 text-sm">{(data.by_status||[]).map((r:any)=> <div key={r.status} className="flex justify-between p-2 border rounded-lg"><span className="capitalize">{r.status}</span><span>{r.c}</span></div>)}</div>
      </Card>
    </div>
    <Card className="p-6">
      <h3 className="font-semibold">Unit Economics — flagged accounts</h3>
      <p className="text-xs text-slate-500 mt-1">If subscription ₦12k but provider cost ₦30k, flagged for review (no auto-punish).</p>
      <div className="mt-3 text-sm">AI usage total: {data.ai_usage_total} · Voice: {data.voice_usage_total}</div>
    </Card>
  </div>
}
