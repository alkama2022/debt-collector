import { useEffect, useState } from "react"
import { getEntitlements } from "../services/billing"
import { useNavigate } from "react-router-dom"
import { Card } from "./ui/card"
import { Button } from "./ui/button"

export function FeatureGate({feature, children, fallbackPlan="professional"}:{feature:string; children:React.ReactNode; fallbackPlan?:string}){
  const [allowed,setAllowed]=useState<boolean|null>(null)
  const [reason,setReason]=useState("")
  const nav=useNavigate()
  useEffect(()=>{
    getEntitlements().then(ent=>{
      const f=ent.features[feature]
      if(f){ setAllowed(f.enabled); setReason(f.reason)}
      else setAllowed(false)
    }).catch(()=> setAllowed(true)) // fallback open if offline
  },[feature])
  if(allowed===null) return <div className="p-6 text-xs text-slate-500">Checking entitlement...</div>
  if(allowed) return <>{children}</>
  return <Card className="p-8 text-center space-y-3 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
    <h3 className="font-semibold dark:text-white">Upgrade required</h3>
    <p className="text-sm text-slate-600 dark:text-slate-400">{reason || `${feature} is available on the ${fallbackPlan} plan.`}</p>
    <div className="flex justify-center gap-2">
      <Button onClick={()=> nav("/pricing")}>View Professional</Button>
      <Button variant="secondary" onClick={()=> nav("/billing")}>Go to Billing</Button>
    </div>
  </Card>
}
