import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/toast"

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
    try{ await login(email,pwd); push("Welcome back","success"); nav("/dashboard")}catch{ setErr("Unable to sign in. Check connection and try again.")}
  }
  return <div className="min-h-screen bg-[#f8fafc] flex">
    <div className="flex-1 max-w-md mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-2 font-semibold"><div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center text-xs">CN</div> CollectNaija</Link>
      <h1 className="text-2xl font-bold mt-8">Welcome back</h1>
      <p className="text-sm text-slate-600 mt-1">Sign in to your workspace. Demo: use any email/password.</p>
      <form onSubmit={submit} className="mt-6 space-y-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
        <Input label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@business.com" />
        <Input label="Password" type="password" value={pwd} onChange={e=>setPwd(e.target.value)} />
        {err && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700" role="alert">{err}</div>}
        <Button type="submit" disabled={loading} className="w-full">{loading?"Signing in...":"Sign in"}</Button>
        <div className="flex justify-between text-sm">
          <Link to="/signup" className="text-brand-600 hover:underline">Create account</Link>
          <a href="#" onClick={e=>e.preventDefault()} className="text-slate-500">Forgot password?</a>
        </div>
        <div className="text-xs text-slate-500 border-t pt-3">Secure JWT auth • Backend enforces permissions • <span className="font-mono">VITE_API_BASE_URL</span></div>
      </form>
      <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">Demo Workspace — data is isolated and labelled. No real money moves until backend is connected.</div>
    </div>
    <div className="hidden lg:flex flex-1 bg-slate-900 text-white p-10 flex-col justify-center">
      <div className="max-w-md">
        <div className="text-sm text-slate-300">Trust design</div>
        <h2 className="text-3xl font-bold mt-2">Know who owes you. Know when they promised to pay.</h2>
        <ul className="mt-6 space-y-3 text-sm text-slate-200">
          <li>? Clear balances — backend is source of truth</li>
          <li>? Offline-aware: explains when you are offline</li>
          <li>? Accessible, keyboard-navigable, 44px touch targets</li>
        </ul>
      </div>
    </div>
  </div>
}
