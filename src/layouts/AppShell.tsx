import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom"
import { LayoutDashboard, Users, FileText, CreditCard, Bell, BarChart3, Settings, Menu, X, Search, LogOut, Building2 } from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { useState } from "react"

const nav=[
  {to:"/dashboard", label:"Home", icon:LayoutDashboard},
  {to:"/customers", label:"Customers", icon:Users},
  {to:"/invoices", label:"Invoices", icon:FileText},
  {to:"/payments", label:"Payments", icon:CreditCard},
  {to:"/reminders", label:"Reminders", icon:Bell},
  {to:"/reports", label:"Reports", icon:BarChart3},
  {to:"/settings", label:"Settings", icon:Settings},
]

export default function AppShell(){
  const {user,logout}=useAuth()
  const nav2=useNavigate()
  const loc=useLocation()
  const [mobile,setMobile]=useState(false)
  const [q,setQ]=useState("")
  const onSearch=(e:React.FormEvent)=>{e.preventDefault(); if(q) nav2("/customers?q="+encodeURIComponent(q))}
  return <div className="min-h-screen bg-[#f8fafc]">
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 h-[64px] flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-sm">CN</div>
          <span className="font-semibold text-slate-900 hidden sm:block">CollectNaija</span>
          <span className="hidden lg:inline-flex ml-2 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800">Demo Workspace</span>
        </div>
        <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-md mx-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search customers, invoices, payments" className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" />
        </form>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={()=>nav2("/reminders")} className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center relative" aria-label="Notifications">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200 ml-1">
            <div className="text-right hidden lg:block">
              <div className="text-sm font-medium leading-none">{user?.name}</div>
              <div className="text-xs text-slate-500">{user?.org.name}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium">{user?.name?.[0]}</div>
          </div>
          <button onClick={()=>{logout(); nav2("/")}} className="hidden lg:inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <LogOut className="w-4 h-4" /> Logout
          </button>
          <button className="lg:hidden w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center" onClick={()=>setMobile(!mobile)} aria-label="Menu">
            {mobile? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
          </button>
        </div>
      </div>
      {mobile && <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
        {nav.map(n=> <NavLink key={n.to} to={n.to} onClick={()=>setMobile(false)} className={({isActive})=> "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium "+(isActive?"bg-slate-900 text-white":"text-slate-700 hover:bg-slate-100")}>
          <n.icon className="w-4 h-4" /> {n.label}
        </NavLink>)}
      </div>}
    </header>
    <div className="max-w-[1440px] mx-auto flex">
      <aside className="hidden lg:block w-[260px] shrink-0 sticky top-[64px] h-[calc(100vh-64px)] border-r border-slate-200 bg-white p-4">
        <nav className="space-y-1">
          {nav.map(n=> <NavLink key={n.to} to={n.to} className={({isActive})=> "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition "+(isActive?"bg-brand-600 text-white shadow-sm":"text-slate-600 hover:bg-slate-100 hover:text-slate-900")}>
            <n.icon className="w-4 h-4" /> {n.label}
          </NavLink>)}
        </nav>
        <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-sm font-semibold"><Building2 className="w-4 h-4"/> {user?.org.name}</div>
          <div className="text-xs text-slate-500 mt-1">NGN � Africa/Lagos</div>
          <div className="mt-3 text-xs text-slate-600">Backend API: <span className="font-mono">VITE_API_BASE_URL</span></div>
        </div>
        <div className="absolute bottom-4 left-4 right-4 text-xs text-slate-400">
          <div>Offline-aware � API-ready</div>
          <div className="mt-1">Path: {loc.pathname}</div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <Outlet />
      </main>
    </div>
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex justify-around py-1 z-30">
      {[
        {to:"/dashboard", label:"Home", icon:LayoutDashboard},
        {to:"/customers", label:"Customers", icon:Users},
        {to:"/invoices", label:"Invoices", icon:FileText},
        {to:"/payments", label:"Payments", icon:CreditCard},
        {to:"/reminders", label:"More", icon:Menu},
      ].map(n=> <NavLink key={n.to} to={n.to} className={({isActive})=> "flex flex-col items-center gap-1 px-3 py-2 rounded-xl "+(isActive?"text-brand-600":"text-slate-500")}>
        <n.icon className="w-5 h-5" /><span className="text-[11px] font-medium">{n.label}</span>
      </NavLink>)}
    </nav>
  </div>
}
