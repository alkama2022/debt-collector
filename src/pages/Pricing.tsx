import { useEffect, useState } from "react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { getPlans, getEntitlements, subscribe } from "../services/billing"
import { useToast } from "../components/ui/toast"
import { Check, X, Zap } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function Pricing(){
  const [plans, setPlans] = useState<any[]>([])
  const [ent, setEnt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [coupon, setCoupon] = useState("")
  const {push}=useToast()
  const nav=useNavigate()
  useEffect(()=>{
    Promise.all([getPlans().catch(()=>[]), getEntitlements().catch(()=>null)]).then(([p,e])=>{
      setPlans(Array.isArray(p)? p : (p as any)?.results ?? [])
      setEnt(e)
      setLoading(false)
    })
  },[])
  const handleSelect = async (slug: string)=>{
    try{
      const res = await subscribe(slug, coupon || undefined)
      if(res.payment?.authorization_url){
        push(`Redirecting to payment... ${res.payment.authorization_url}`,"info")
        if(res.payment.mock) {
          push("Mock payment succeeded — subscription activated","success")
          setTimeout(()=> nav("/billing"), 800)
        } else {
          window.location.href = res.payment.authorization_url
        }
      } else {
        push(`Subscribed to ${slug}`,"success")
        nav("/billing")
      }
    }catch(e:any){
      push(e?.data?.detail || "Subscribe failed","error")
    }
  }
  if(loading) return <div className="p-6 text-sm text-slate-500">Loading pricing...</div>
  const order = ["free","starter","business","professional","enterprise"]
  const sorted = [...plans].sort((a,b)=> order.indexOf(a.slug)-order.indexOf(b.slug))
  return <div className="space-y-6">
    <div className="text-center py-6">
      <h1 className="text-3xl font-bold dark:text-white">Choose your plan</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Scale from Free → Enterprise. AI and communication usage may be subject to plan limits or usage charges.</p>
      <div className="mt-4 flex items-center justify-center gap-2">
        <input placeholder="Coupon code e.g. WELCOME50" value={coupon} onChange={e=>setCoupon(e.target.value)} className="h-9 px-3 rounded-xl border text-sm" />
        <span className="text-xs text-slate-500">50% off first month with WELCOME50</span>
      </div>
      {ent && <div className="mt-3 text-xs px-3 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 inline-block">Current: {ent.subscription.plan} · {ent.subscription.status}</div>}
    </div>
    <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
      {sorted.map(p=>{
        const isCurrent = ent?.subscription.plan === p.slug
        const price = Number(p.price)
        return <Card key={p.slug} className={`p-6 flex flex-col ${p.slug==="business"?"border-2 border-brand-600 shadow-lg scale-[1.02]":""} ${isCurrent?"ring-2 ring-emerald-500":""}`}>
          {p.slug==="business" && <div className="text-xs font-semibold text-brand-600 flex items-center gap-1"><Zap className="w-3 h-3"/> Most popular</div>}
          <h3 className="font-semibold capitalize mt-1 dark:text-white">{p.name}</h3>
          <div className="mt-2">
            {p.is_enterprise ? <div className="text-2xl font-bold dark:text-white">Custom</div> : <div className="text-2xl font-bold dark:text-white">₦{price.toLocaleString()}<span className="text-sm font-normal text-slate-500">/month</span></div>}
          </div>
          <p className="text-xs text-slate-500 mt-2 line-clamp-2">{p.description}</p>
          <div className="mt-4 space-y-1.5 text-xs">
            {p.limits?.map((l:any)=> <div key={l.key} className="flex justify-between"><span className="text-slate-500">{l.key.replace(/_/g," ").toLowerCase()}</span><span className="font-medium">{l.limit_value===null?"Unlimited":l.limit_value===0?"—":l.limit_value}</span></div>)}
          </div>
          <div className="mt-4 space-y-1 text-xs">
            {p.plan_features?.slice(0,6).map((pf:any)=> <div key={pf.feature.slug} className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-600"/>{pf.feature.slug.replace(/_/g," ").toLowerCase()}</div>)}
            {p.plan_features?.length===0 && <div className="flex items-center gap-2 text-slate-400"><X className="w-3 h-3"/> No premium features</div>}
          </div>
          <Button className="mt-6 w-full" variant={p.slug==="business"?"primary":"secondary"} disabled={isCurrent} onClick={()=>handleSelect(p.slug)}>{isCurrent?"Current plan": p.is_enterprise?"Contact sales":"Select "+p.name}</Button>
        </Card>
      })}
    </div>
    <Card className="p-6">
      <h3 className="font-semibold dark:text-white">Feature comparison</h3>
      <div className="overflow-auto mt-4">
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500"><tr><th className="text-left">Feature</th>{sorted.map(p=> <th key={p.slug} className="capitalize">{p.name}</th>)}</tr></thead>
          <tbody>
            {["customers","staff","ai conversations","whatsapp","voice","reports","branches","api","support"].map(f=> <tr key={f} className="border-t"><td className="py-2 font-medium capitalize">{f}</td>{sorted.map(p=> <td key={p.slug} className="text-center">✓</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
}
