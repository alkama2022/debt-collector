import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/toast"
import { ThemeToggle } from "../components/ui/theme-toggle"

export default function Login(){
  const {login,loading}=useAuth()
  const nav=useNavigate()
  const {push}=useToast()
  const [email,setEmail]=useState("ade@collectnaija.demo")
  const [pwd,setPwd]=useState("demo1234")
  const [err,setErr]=useState("")
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault()
    setErr("")
    if(!email||!pwd){ setErr("Email and password required"); return }
    try{ await login(email,pwd); push("Welcome back","success"); nav("/dashboard")}catch(e:any){ const msg=e?.data?.message || e?.message || "Unable to sign in. Check email/password and try again."; setErr(msg)}
  }
  return <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex transition-colors">
    <div className="flex-1 max-w-md mx-auto px-6 py-12">
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 font-semibold dark:text-white"><div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center text-xs">CN</div> CollectNaija</Link>
        <ThemeToggle />
      </div>
      <h1 className="text-2xl font-bold mt-8 dark:text-white">Welcome back</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Sign in to your workspace. Your data stays in your organisation.</p>
      <form onSubmit={submit} className="mt-6 space-y-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <Input label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@business.com" />
        <Input label="Password" type="password" value={pwd} onChange={e=>setPwd(e.target.value)} />
        {err && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300" role="alert">{err}</div>}
        <Button type="submit" disabled={loading} className="w-full shadow-sm hover:shadow-md transition">{loading?"Signing in...":"Sign in"}</Button>
        <div className="flex justify-between text-sm">
          <Link to="/signup" className="text-brand-600 dark:text-blue-400 hover:underline">Create account</Link>
          <button type="button" onClick={()=>push("Password reset — contact support@collectnaija.com","info")} className="text-slate-500 dark:text-slate-400 hover:text-slate-700">Forgot password?</button>
        </div>
        <div className="text-xs text-slate-500 border-t dark:border-slate-700 pt-3 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"/> Encrypted & org-isolated</div>
      </form>
      <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">Try demo: <span className="font-mono">ade@collectnaija.demo / demo1234</span> or create your own workspace.</div>
    </div>
    <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-10 flex-col justify-center border-l dark:border-slate-800">
      <div className="max-w-md">
        <div className="text-xs font-medium tracking-widest uppercase text-white/50">Why teams stay</div>
        <h2 className="text-3xl font-bold mt-2 leading-tight">Know who owes you. Know when they promised to pay.</h2>
        <p className="text-sm text-white/70 mt-3">No spreadsheets. No chasing. Just a quiet workspace that keeps your cash flow clear.</p>
        <ul className="mt-6 space-y-3 text-sm text-white/85">
          <li className="flex gap-2"><span className="w-6 h-6 rounded-full bg-white/10 grid place-items-center text-xs">✓</span> Balances calculated on the server — always accurate</li>
          <li className="flex gap-2"><span className="w-6 h-6 rounded-full bg-white/10 grid place-items-center text-xs">✓</span> Works offline, syncs when you’re back</li>
          <li className="flex gap-2"><span className="w-6 h-6 rounded-full bg-white/10 grid place-items-center text-xs">✓</span> Built for Nigeria, ready for the world</li>
        </ul>
      </div>
    </div>
  </div>
}
