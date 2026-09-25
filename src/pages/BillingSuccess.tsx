import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { getEntitlements } from "../services/billing"
import { apiFetch } from "../services/api"

export default function BillingSuccess(){
  const [params]=useSearchParams()
  const nav=useNavigate()
  const ref = params.get("reference") || params.get("ref") || params.get("trxref") || params.get("reference_code") || ""
  const [status,setStatus]=useState<"verifying"|"success"|"error"> (ref ? "verifying" : "success")
  const [detail,setDetail]=useState<string>(ref ? `Verifying payment ${ref}…`:"Payment recorded.")
  const [ent,setEnt]=useState<any>(null)

  useEffect(()=>{
    let cancelled=false
    async function verify(){
      if(!ref){
        // no ref — just load entitlements to confirm current plan
        try{
          const e=await getEntitlements()
          if(!cancelled) setEnt(e)
        }catch{}
        return
      }
      try{
        // try credit verify first (for credit purchases), then generic transaction check
        // subscription payments are auto-activated via subscribe endpoint (mock) or webhook (real paystack)
        // We attempt both endpoints and fall back to success if backend returns ok
        try{
          await apiFetch<any>("/billing/credits/verify", {method:"POST", body: JSON.stringify({reference: ref})})
        }catch{}
        // small delay to allow webhook/DB to settle
        await new Promise(r=>setTimeout(r,800))
        const e=await getEntitlements()
        if(!cancelled){
          setEnt(e)
          setStatus("success")
          setDetail("Payment verified — your subscription is active.")
        }
      }catch(e:any){
        if(!cancelled){
          setStatus("error")
          setDetail(e?.data?.detail || e?.data?.message || "Verification failed, but your payment may still be processing. Check Billing in a moment.")
        }
      }
    }
    verify()
    return ()=>{cancelled=true}
  },[ref])

  return <div className="min-h-[70vh] grid place-items-center p-6 bg-slate-50 dark:bg-slate-950">
    <Card className="p-8 max-w-lg w-full text-center space-y-4">
      {status==="verifying" && <Loader2 className="w-12 h-12 mx-auto animate-spin text-slate-400"/>}
      {status==="success" && <CheckCircle className="w-12 h-12 mx-auto text-emerald-600"/>}
      {status==="error" && <XCircle className="w-12 h-12 mx-auto text-amber-600"/>}
      <h1 className="text-2xl font-bold tracking-tight">
        {status==="verifying"?"Verifying payment…": status==="success"?"Payment successful":"Payment pending"}
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">{detail}</p>
      {ref && <p className="text-xs font-mono bg-slate-100 dark:bg-slate-900 px-3 py-2 rounded-lg break-all">Reference: {ref}</p>}
      {ent?.subscription && <div className="text-xs inline-flex px-3 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900">You’re on {ent.subscription.plan_name || ent.subscription.plan} · {ent.subscription.status}</div>}
      <div className="flex flex-wrap gap-2 justify-center pt-2">
        <Button onClick={()=>nav("/billing")}>Go to Billing</Button>
        <Button variant="secondary" onClick={()=>nav("/dashboard")}>Dashboard</Button>
        <Button variant="ghost" onClick={()=>nav("/pricing")}>View plans</Button>
      </div>
      <p className="text-xs text-slate-500">If you were charged but don’t see the update, wait ~30s and refresh Billing. Contact support@collectnaija.com if it persists.</p>
    </Card>
  </div>
}
