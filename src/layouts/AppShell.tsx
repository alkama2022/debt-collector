import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom"
import { LayoutDashboard, Users, FileText, CreditCard, Bell, BarChart3, Settings, Menu, X, Search, LogOut, Building2, WifiOff, Languages, Wallet, Gauge, Tags } from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { useStore } from "../services/store"
import { useState, useEffect } from "react"
import { ThemeToggle } from "../components/ui/theme-toggle"

const nav=[
  {to:"/dashboard", label:"Home", icon:LayoutDashboard},
  {to:"/customers", label:"Customers", icon:Users},
  {to:"/invoices", label:"Invoices", icon:FileText},
  {to:"/payments", label:"Payments", icon:CreditCard},
  {to:"/reminders", label:"Reminders", icon:Bell},
  {to:"/reports", label:"Reports", icon:BarChart3},
  {to:"/languages", label:"Languages", icon:Languages},
  {to:"/pricing", label:"Pricing", icon:Tags},
  {to:"/billing", label:"Billing", icon:Wallet},
  {to:"/billing/usage", label:"Usage", icon:Gauge},
  {to:"/settings", label:"Settings", icon:Settings},
]

export default function AppShell(){
  const {user,logout}=useAuth()
  const {notifs,markAllRead,customers,invoices,payments}=useStore()
  const nav2=useNavigate()
  const loc=useLocation()
  const [mobile,setMobile]=useState(false)
  const [q,setQ]=useState("")
  const [showNotifs,setShowNotifs]=useState(false)
  const [online,setOnline]=useState(typeof navigator!=="undefined"? navigator.onLine: true)
  useEffect(()=>{
    const a=()=>setOnline(true); const b=()=>setOnline(false)
    window.addEventListener("online",a); window.addEventListener("offline",b)
    return ()=>{window.removeEventListener("online",a); window.removeEventListener("offline",b)}
  },[])
  const unread=notifs.filter(n=>!n.read).length
  const onSearch=(e:React.FormEvent)=>{
    e.preventDefault()
    if(!q) return
    const term=q.toLowerCase()
    const c=customers.find(x=> x.name.toLowerCase().includes(term) || x.customerId.toLowerCase().includes(term))
    if(c) return nav2(`/customers/${c.id}`)
    const inv=invoices.find(x=> x.number.toLowerCase().includes(term) || x.customerName.toLowerCase().includes(term))
    if(inv) return nav2(`/invoices/${inv.id}`)
    const pay=payments.find(x=> x.reference.toLowerCase().includes(term))
    if(pay) return nav2("/payments")
    nav2(`/customers?q=${encodeURIComponent(q)}`)
  }
  const schoolMode = localStorage.getItem("cn_school")==="1"
  return <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors">
    {!online && <div className="bg-amber-600 text-white text-sm text-center py-2 px-4 flex items-center justify-center gap-2"><WifiOff className="w-4 h-4"/> You are offline. Your changes have not been submitted yet.</div>}
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 h-[64px] flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-sm">CN</div>
          <span className="font-semibold text-slate-900 dark:text-white hidden sm:block">CollectNaija</span>
          <span className="hidden lg:inline-flex ml-2 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-300">Demo Workspace</span>
          {schoolMode && <span className="hidden lg:inline-flex px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-700 dark:text-emerald-300">School Mode</span>}
        </div>
        <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-md mx-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search customers, invoices, payments" className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors" />
        </form>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={typeof localStorage !== "undefined" ? (localStorage.getItem("cn_dashboard_lang") || "en") : "en"}
            onChange={async e => {
              const code = e.target.value
              localStorage.setItem("cn_dashboard_lang", code); localStorage.setItem("cn_lang", code)
              try { const { liveUpdateOrgLanguageSettings } = await import("../services/live"); await liveUpdateOrgLanguageSettings({ dashboard_language: code }) } catch {}
              location.reload()
            }}
            title="Dashboard language — business owner language (§17), independent from customer language (§32)"
            className="hidden md:flex h-9 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium dark:text-slate-200"
          >
            <option value="en">English</option><option value="ha">Hausa</option><option value="yo">Yorùbá</option><option value="ig">Igbo</option><option value="pcm">Pidgin</option>
          </select>
          <ThemeToggle />
          <button onClick={()=>setShowNotifs(!showNotifs)} className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center relative dark:text-slate-200" aria-label="Notifications">
            <Bell className="w-4 h-4" />
            {unread>0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 text-[10px] font-bold text-white flex items-center justify-center">{unread}</span>}
          </button>
          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700 ml-1">
            <div className="text-right hidden lg:block">
              <div className="text-sm font-medium leading-none text-slate-900 dark:text-white">{user?.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{user?.org.name}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center text-sm font-medium">{user?.name?.[0]}</div>
          </div>
          <button onClick={()=>{logout(); nav2("/")}} className="hidden lg:inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <LogOut className="w-4 h-4" /> Logout
          </button>
          <button className="lg:hidden w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center dark:text-slate-200" onClick={()=>setMobile(!mobile)} aria-label="Menu">
            {mobile? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
          </button>
        </div>
      </div>
      {showNotifs && <div className="absolute right-4 top-[64px] w-[380px] max-w-[92vw] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-soft dark:shadow-softDark z-40 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="font-semibold dark:text-white">Notifications</div>
          <button onClick={markAllRead} className="text-xs text-brand-600 dark:text-brand-400 font-medium">Mark all read</button>
        </div>
        <div className="max-h-[380px] overflow-auto divide-y divide-slate-100 dark:divide-slate-700">
          {notifs.slice(0,8).map(n=> <div key={n.id} className={`p-4 flex gap-3 ${n.read?"bg-white dark:bg-slate-800":"bg-slate-50 dark:bg-slate-700/50"}`}>
            <div className={`w-2 h-2 rounded-full mt-2 ${n.read?"bg-slate-300 dark:bg-slate-600":"bg-brand-600"}`} />
            <div className="flex-1">
              <div className="text-sm font-medium dark:text-white">{n.title}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">{n.body}</div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(n.time).toLocaleString()}</div>
            </div>
            {!n.read && <span className="text-xs px-2 py-1 rounded-full bg-brand-600 text-white">New</span>}
          </div>)}
        </div>
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-xs text-center text-slate-500 dark:text-slate-400">Types: payment · invoice · reminder · system · read/unread persisted</div>
      </div>}
      {mobile && <div className="lg:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 space-y-1">
        {nav.map(n=> <NavLink key={n.to} to={n.to} onClick={()=>setMobile(false)} className={({isActive})=> "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium "+(isActive?"bg-slate-900 dark:bg-slate-700 text-white":"text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")}>
          <n.icon className="w-4 h-4" /> {n.label}
        </NavLink>)}
      </div>}
    </header>
    <div className="max-w-[1440px] mx-auto flex">
      <aside className="hidden lg:block w-[260px] shrink-0 sticky top-[64px] h-[calc(100vh-64px)] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <nav className="space-y-1">
          {nav.map(n=> <NavLink key={n.to} to={n.to} className={({isActive})=> "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition "+(isActive?"bg-brand-600 dark:bg-brand-500 text-white shadow-sm":"text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white")}>
            <n.icon className="w-4 h-4" /> {n.label}
          </NavLink>)}
        </nav>
        <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-sm font-semibold dark:text-white"><Building2 className="w-4 h-4"/> {user?.org.name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">NGN · Africa/Lagos {schoolMode && "· School"}</div>
          <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">API: <span className="font-mono">VITE_API_BASE_URL</span></div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{customers.length} customers · {invoices.length} invoices · live from store</div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <Outlet />
      </main>
    </div>
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around py-1 z-30">
      {[
        {to:"/dashboard", label:"Home", icon:LayoutDashboard},
        {to:"/customers", label:"Customers", icon:Users},
        {to:"/invoices", label:"Invoices", icon:FileText},
        {to:"/payments", label:"Payments", icon:CreditCard},
        {to:"/reminders", label:"More", icon:Menu},
      ].map(n=> <NavLink key={n.to} to={n.to} className={({isActive})=> "flex flex-col items-center gap-1 px-3 py-2 rounded-xl "+(isActive?"text-brand-600 dark:text-brand-400":"text-slate-500 dark:text-slate-400")}>
        <n.icon className="w-5 h-5" /><span className="text-[11px] font-medium">{n.label}</span>
      </NavLink>)}
    </nav>
  </div>
}
