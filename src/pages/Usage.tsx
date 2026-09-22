import { useEffect, useState } from "react"
import { Card } from "../components/ui/card"
import { getUsage, getUsageHistory } from "../services/billing"

export default function Usage(){
  const [data,setData]=useState<any>(null)
  const [history,setHistory]=useState<any[]>([])
  useEffect(()=>{
    getUsage().then(setData).catch(()=>{})
    getUsageHistory().then(r=> setHistory(r.results ?? r ?? [])).catch(()=>{})
  },[])
  if(!data) return <div className="p-6 text-sm">Loading usage...</div>
  const usage = data.usage ?? []
  return <div className="space-y-6">
    <h1 className="text-xl font-bold dark:text-white">Usage & AI Costs</h1>
    <div className="grid md:grid-cols-3 gap-4">
      {usage.map((u:any)=> <Card key={u.feature} className="p-6">
        <div className="text-sm text-slate-500">{u.feature}</div>
        <div className="text-2xl font-bold dark:text-white">{u.used}</div>
        <div className="text-xs text-slate-500">Limit: {u.limit ?? "∞"} · Remaining: {u.remaining ?? "∞"} {u.pct!==null && `· ${u.pct}%`}</div>
      </Card>)}
    </div>
    <Card className="p-6">
      <h3 className="font-semibold">This month vs previous · Trend</h3>
      <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
        AI Conversations: {data.usage?.find((x:any)=>x.feature==="AI_CONVERSATIONS")?.used ?? 0} ·
        WhatsApp: {data.usage?.find((x:any)=> x.feature.includes("WHATSAPP"))?.used ?? 0} ·
        Voice Minutes: {data.usage?.find((x:any)=>x.feature==="AI_VOICE_MINUTES")?.used ?? 0}
      </div>
      <div className="text-xs text-slate-500 mt-2">Estimated Usage Cost: ₦ {(history.reduce((a:any,c:any)=> a + (c.cost_minor||0),0)/100).toLocaleString()}</div>
    </Card>
    <Card className="p-6">
      <h3 className="font-semibold">Usage history</h3>
      <div className="mt-3 space-y-2 text-sm max-h-[400px] overflow-auto">
        {history.slice(0,20).map((h:any)=> <div key={h.id} className="flex justify-between p-3 rounded-xl border"><span>{h.feature} · {h.quantity} {h.unit}</span><span className="text-xs text-slate-500">{new Date(h.created_at).toLocaleString()}</span></div>)}
        {history.length===0 && <div className="text-xs text-slate-500">No usage yet</div>}
      </div>
    </Card>
  </div>
}
