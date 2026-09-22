import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Input, Select } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/toast"
import { track } from "../services/api"

const steps=["Business","Type","Location","Currency","Size","Tracking","Customer","Invoice"]

export default function Onboarding(){
  const nav=useNavigate()
  const {push}=useToast()
  const [s,setS]=useState(0)
  const [form,setForm]=useState({name:"Al-Hikma Private School", type:"school", country:"Nigeria", currency:"NGN", size:"11-50", tracking:"Notebook / WhatsApp", cust:"Musa Ibrahim", phone:"0803 123 4567", inv:"75000"})
  const next=()=>{
    if(s<7) setS(s+1)
    else { track("onboarding_completed"); push("You are ready to start collecting","success"); localStorage.setItem("cn_onboarded","1"); nav("/dashboard")}
  }
  return <div className="min-h-screen bg-[#f8fafc] flex flex-col">
    <div className="max-w-2xl mx-auto w-full px-6 py-8">
      <div className="flex items-center justify-between">
        <Link to="/" className="font-semibold flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center text-xs">CN</div> CollectNaija</Link>
        <span className="text-xs text-slate-500 dark:text-slate-400">Step {s+1} of 8 � {steps[s]}</span>
      </div>
      <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-brand-600 transition-all" style={{width:((s+1)/8*100)+"%"}} /></div>
      <div className="mt-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-card">
        {s===0 && <><h2 className="text-lg font-semibold">What is your business name?</h2><p className="text-sm text-slate-600 dark:text-slate-400">This appears on invoices and receipts.</p><div className="mt-4"><Input label="Business name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Al-Hikma Private School" /></div></>}
        {s===1 && <><h2 className="text-lg font-semibold">Business type</h2><div className="mt-4"><Select label="Type" value={form.type} onChange={e=>setForm({...form,type:e.target.value})} options={[{value:"school",label:"Private school"},{value:"retail",label:"Retail"},{value:"wholesale",label:"Wholesale"},{value:"services",label:"Services"},{value:"other",label:"Other"}]} /></div></>}
        {s===2 && <><h2 className="text-lg font-semibold">Country</h2><div className="mt-4"><Select label="Country" value={form.country} onChange={e=>setForm({...form,country:e.target.value})} options={[{value:"Nigeria",label:"Nigeria"},{value:"Ghana",label:"Ghana"},{value:"Kenya",label:"Kenya"},{value:"South Africa",label:"South Africa"}]} /></div></>}
        {s===3 && <><h2 className="text-lg font-semibold">Currency</h2><div className="mt-4"><Select label="Currency" value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})} options={[{value:"NGN",label:"NGN � Nigerian Naira"},{value:"GHS",label:"GHS � Ghana Cedi"},{value:"KES",label:"KES � Kenyan Shilling"},{value:"USD",label:"USD � US Dollar"}]} /></div></>}
        {s===4 && <><h2 className="text-lg font-semibold">Business size</h2><div className="mt-4"><Select label="Size" value={form.size} onChange={e=>setForm({...form,size:e.target.value})} options={[{value:"1-10",label:"1-10 customers"},{value:"11-50",label:"11-50 customers"},{value:"51-200",label:"51-200 customers"},{value:"200+",label:"200+ customers"}]} /></div></>}
        {s===5 && <><h2 className="text-lg font-semibold">How do you currently track payments?</h2><div className="mt-4"><Select label="Current method" value={form.tracking} onChange={e=>setForm({...form,tracking:e.target.value})} options={[{value:"Notebook / WhatsApp",label:"Notebook / WhatsApp"},{value:"Excel",label:"Excel / Sheets"},{value:"Other app",label:"Other app"},{value:"Nothing yet",label:"Nothing yet"}]} /></div></>}
        {s===6 && <><h2 className="text-lg font-semibold">Create first customer</h2><p className="text-sm text-slate-600 dark:text-slate-400">Add one now — or <Link to="/customers" className="text-brand-600 underline">bulk import your Excel/CSV after onboarding</Link> (200 in 60s).</p><div className="mt-4 space-y-3"><Input label="Customer name" value={form.cust} onChange={e=>setForm({...form,cust:e.target.value})} /><Input label="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /><div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-800">💡 Traders: paste from Excel: <code>Name[TAB]Phone</code> per line in Customers → Import (no typing needed).</div></div></>}
        {s===7 && <><h2 className="text-lg font-semibold">Create first invoice</h2><div className="mt-4"><Input label="Amount (NGN)" value={form.inv} onChange={e=>setForm({...form,inv:e.target.value})} /></div><div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border text-xs text-slate-600 dark:text-slate-400">Backend will calculate totals safely and assign INV number. This is a demo.</div></>}
        <div className="mt-6 flex justify-between">
          <Button variant="secondary" onClick={()=> s>0? setS(s-1): nav("/signup")} >Back</Button>
          <Button onClick={next}>{s===7?"Finish � You are ready to start collecting":"Continue"}</Button>
        </div>
        {s===7 && <div className="mt-3 text-center text-sm font-medium text-emerald-700 dark:text-emerald-300">You are ready to start collecting.</div>}
      </div>
      <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">Progress saved locally � Replace with API when backend ready � TODO: wire onboarding API</div>
    </div>
  </div>
}
