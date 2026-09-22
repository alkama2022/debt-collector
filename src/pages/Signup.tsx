import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/toast"
import { ThemeToggle } from "../components/ui/theme-toggle"

export default function Signup(){
  const {signup,loading}=useAuth()
  const nav=useNavigate()
  const {push}=useToast()
  const [name,setName]=useState("")
  const [email,setEmail]=useState("")
  const [pwd,setPwd]=useState("")
  const [err,setErr]=useState("")
  const [fieldErr,setFieldErr]=useState<Record<string,string>>({})
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault()
    const fe:Record<string,string>={}
    if(!name) fe.name="Business owner name required"
    if(!email) fe.email="Email required"
    if(pwd.length<8) fe.pwd="Min 8 characters (server requires strong password)"
    setFieldErr(fe)
    if(Object.keys(fe).length) return
    try{ await signup({name,email,password:pwd}); push("Account created","success"); nav("/onboarding")}catch(e:any){ const msg=e?.data?.message || e?.data?.errors?.email?.[0] || e?.message || "Unable to create account. Try a stronger password or different email."; setErr(msg)}
  }
  return <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex transition-colors">
    <div className="flex-1 max-w-md mx-auto px-6 py-8">
      <div className="flex items-center justify-between">
        <Link to="/" className="font-semibold flex items-center gap-2 dark:text-white"><div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center text-xs">CN</div> CollectNaija</Link>
        <ThemeToggle />
      </div>
      <h1 className="text-2xl font-bold mt-6 dark:text-white">Create your workspace</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Only ask what is needed to get started. You can change everything later.</p>
      <form onSubmit={submit} className="mt-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-card dark:shadow-softDark space-y-4">
        <Input label="Your name" value={name} onChange={e=>setName(e.target.value)} error={fieldErr.name} placeholder="Adebayo Okafor" />
        <Input label="Work email" type="email" value={email} onChange={e=>setEmail(e.target.value)} error={fieldErr.email} placeholder="you@business.com" />
        <Input label="Password" type="password" value={pwd} onChange={e=>setPwd(e.target.value)} error={fieldErr.pwd} placeholder="At least 6 characters" />
        {err && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300">{err}</div>}
        <Button type="submit" disabled={loading} className="w-full">{loading?"Creating...":"Create account"}</Button>
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center">By continuing you agree to Terms and Privacy. No fake claims.</div>
        <div className="text-sm text-center"><Link to="/login" className="text-brand-600 dark:text-blue-400 hover:underline">Already have an account? Log in</Link></div>
      </form>
    </div>
    <div className="hidden lg:flex flex-1 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-10 items-center">
      <div className="max-w-sm">
        <h3 className="font-semibold dark:text-white">What happens next?</h3>
        <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li>1. Onboarding: business name, type, country, currency</li>
          <li>2. Create first customer</li>
          <li>3. Create first invoice · see balance</li>
        </ol>
        <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">Localization defaults: Nigeria · NGN · Africa/Lagos · English · configurable for global use.</div>
      </div>
    </div>
  </div>
}
