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
  if(loading) return <div className="p-6 flex items-center gap-2 text-sm text-slate-500"><span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-brand-600 animate-spin"/> Loading plans…</div>
  const order = ["free","starter","business","professional","enterprise"]
  const sorted = [...plans].sort((a,b)=> order.indexOf(a.slug)-order.indexOf(b.slug))
  return <div className="space-y-6">
    <div className="text-center py-8">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-700 dark:text-emerald-300">14-day trial on Starter & Business • Cancel anytime</div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-4">Simple pricing. No surprises.</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-xl mx-auto">Start free, upgrade when you need more. Every plan includes secure, server-calculated balances. AI & messaging usage is shown clearly before you pay.</p>
      <div className="mt-5 flex items-center justify-center gap-2">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5"><input placeholder="Coupon — try WELCOME50" value={coupon} onChange={e=>setCoupon(e.target.value.toUpperCase())} className="h-7 px-2 text-sm bg-transparent outline-none placeholder:text-slate-400 w-44" />{coupon && <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Applied</span>}</div>
        <span className="text-xs text-slate-500 hidden sm:inline">50% off your first month</span>
      </div>
      {ent && <div className="mt-3 text-xs px-3 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 inline-block">You’re on {ent.subscription.plan_name || ent.subscription.plan} • {ent.subscription.status}</div>}
    </div>
    <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
      {sorted.map(p=>{
        const isCurrent = ent?.subscription.plan === p.slug
        const price = Number(p.price)
        const featured = p.slug==="business"
        return <Card key={p.slug} className={`p-6 flex flex-col relative ${featured?"border-2 border-slate-900 dark:border-white shadow-xl scale-[1.02] bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-800":""} ${isCurrent?"ring-2 ring-emerald-500":""}`}>
          {featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center gap-1 shadow"><Zap className="w-3 h-3"/> Most chosen</div>}
          <h3 className="font-semibold mt-2">{p.name}</h3>
          <div className="mt-2">
            {p.is_enterprise ? <div className="text-2xl font-bold">Custom<div className="text-xs font-normal text-slate-500 mt-1">Tailored limits & support</div></div> : <div className="text-2xl font-bold">₦{price.toLocaleString()}<span className="text-sm font-normal text-slate-500">/month</span><div className="text-xs font-normal text-slate-500 mt-1">Billed monthly • NGN</div></div>}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {p.limits?.slice(0,4).map((l:any)=> <div key={l.key} className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5"><div className="text-slate-500 capitalize">{l.key.replace(/_/g," ").toLowerCase()}</div><div className="font-semibold mt-0.5">{l.limit_value===null?"Unlimited":l.limit_value===0?"Not included":l.limit_value.toLocaleString()}</div></div>)}
          </div>
          <div className="mt-4 space-y-1.5 text-xs">
            {p.plan_features?.slice(0,5).map((pf:any)=> <div key={pf.feature.slug} className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 grid place-items-center"><Check className="w-3 h-3 text-emerald-600"/></span>{pf.feature.slug.replace(/_/g," ").toLowerCase()}</div>)}
            {(!p.plan_features || p.plan_features.length===0) && <div className="text-slate-400">Perfect to try CollectNaija</div>}
          </div>
          <Button className="mt-6 w-full" variant={featured?"primary":"secondary"} disabled={isCurrent} onClick={()=>handleSelect(p.slug)}>{isCurrent?"You’re on this plan": p.is_enterprise?"Talk to us":"Choose "+p.name}</Button>
          {p.slug==="free" && <p className="text-xs text-center text-slate-500 mt-2">No card needed</p>}
        </Card>
      })}
    </div>
    <div className="rounded-2xl bg-slate-900 dark:bg-black text-white p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="text-sm"><span className="font-semibold">All plans include:</span> <span className="text-white/70">Invoices, payments, receipts, audit log, Africa/Lagos timezone & NGN by default — expandable to USD/EUR/GBP.</span></div>
      <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 border border-white/20">AI & messaging usage is metered and shown before you’re charged — never silent.</span>
    </div>
  </div>
}
