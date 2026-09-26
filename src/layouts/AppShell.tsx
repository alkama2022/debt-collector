import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom"
import { LayoutDashboard, Users, FileText, CreditCard, Bell, BarChart3, Settings, Menu, X, Search, LogOut, Building2, WifiOff, Languages, Wallet, Gauge, Tags, Megaphone, Bot } from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { useStore } from "../services/store"
import { useState, useEffect } from "react"
import { ThemeToggle } from "../components/ui/theme-toggle"
import { FAB } from "../components/ui/fab"
import { PaymentPoller } from "../hooks/usePaymentPolling"
import { DemoSeeder } from "../hooks/useDemoSeed"
import {
  useKeyboardShortcuts,
  ShortcutOverlay,
  ShortcutActionBadge,
} from "../hooks/useKeyboardShortcuts"

const nav=[
  {to:"/dashboard", label:"Home", icon:LayoutDashboard},
  {to:"/customers", label:"Customers", icon:Users},
  {to:"/invoices", label:"Invoices", icon:FileText},
  {to:"/payments", label:"Payments", icon:CreditCard},
  {to:"/reminders", label:"Reminders", icon:Bell},
  {to:"/ai", label:"AI Agent", icon:Bot},
  {to:"/reports", label:"Reports", icon:BarChart3},
  {to:"/campaigns", label:"Campaigns", icon:Megaphone},
  {to:"/languages", label:"Languages", icon:Languages},
  {to:"/organizations", label:"Organisations", icon:Building2},
  {to:"/pricing", label:"Pricing", icon:Tags},
  {to:"/billing", label:"Billing", icon:Wallet},
  {to:"/billing/usage", label:"Usage", icon:Gauge},
  {to:"/settings", label:"Settings", icon:Settings},
]

/** Prefix match so a detail route like /customers/abc still lights up
 *  "Customers" in the sidebar and bottom bar. */
function isActiveRoute(pathname:string, to:string){
  if(to==="/dashboard") return pathname==="/dashboard"
  return pathname===to || pathname.startsWith(to+"/")
}

export default function AppShell(){
  const {user,logout}=useAuth()
  const {notifs,markAllRead,customers,invoices,payments}=useStore()
  const nav2=useNavigate()
  const loc=useLocation()
  const [mobile,setMobile]=useState(false)
  const [q,setQ]=useState("")
  const [showNotifs,setShowNotifs]=useState(false)
  const [searchOpen,setSearchOpen]=useState(false)
  const [online,setOnline]=useState(typeof navigator!=="undefined"? navigator.onLine: true)
  useEffect(()=>{
    const a=()=>setOnline(true); const b=()=>setOnline(false)
    window.addEventListener("online",a); window.addEventListener("offline",b)
    return ()=>{window.removeEventListener("online",a); window.removeEventListener("offline",b)}
  },[])
  // Close every transient panel on route change so a tap never leaves a
  // drawer or dropdown stranded over the page it navigated to.
  useEffect(()=>{ setMobile(false); setShowNotifs(false); setSearchOpen(false) },[loc.pathname])
  // Crossing up past `md` reveals the persistent sidebar, so a drawer left open
  // on a phone would otherwise linger over the tablet layout.
  useEffect(()=>{
    const mq=window.matchMedia("(min-width: 768px)")
    const a=(e:MediaQueryListEvent)=>{ if(e.matches){ setMobile(false); setSearchOpen(false) } }
    mq.addEventListener("change",a)
    return ()=>mq.removeEventListener("change",a)
  },[])
  // Lock body scroll while the phone drawer is open.
  useEffect(()=>{
    if(!mobile) return
    const prev=document.body.style.overflow
    document.body.style.overflow="hidden"
    return ()=>{ document.body.style.overflow=prev }
  },[mobile])
  // Escape closes the topmost overlay.
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{ if(e.key!=="Escape") return; setShowNotifs(false); setSearchOpen(false); setMobile(false) }
    window.addEventListener("keydown",h)
    return ()=>window.removeEventListener("keydown",h)
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
  const isDemo = user?.org?.name?.toLowerCase().includes("demo") || localStorage.getItem("cn_demo")==="1"

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  const { showHelp, setShowHelp, pendingKey, lastAction } = useKeyboardShortcuts()

  // ── Search input ref for / shortcut ──────────────────────────────────────
  // data-search attribute on the input below lets the shortcut hook find it
  return <div className="min-h-screen-dvh bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors">
    {/* Background services — no UI rendered */}
    <PaymentPoller />
    <DemoSeeder />

    {/* Keyboard shortcut overlays */}
    <ShortcutOverlay show={showHelp} onClose={() => setShowHelp(false)} />
    <ShortcutActionBadge action={lastAction} />

    {/* Pending key indicator — shows when user presses g or n */}
    {pendingKey && (
      <div className="fixed top-[72px] right-4 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-mono font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none animate-in fade-in slide-in-from-top-1">
        {pendingKey}…
      </div>
    )}
    {!online && <div className="bg-amber-600 text-white text-sm text-center py-2 px-4 flex items-center justify-center gap-2"><WifiOff className="w-4 h-4"/> You’re offline — changes will sync when you’re back.</div>}
    <header className="sticky top-0 z-30 h-cn-header bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 h-cn-header-row flex items-center gap-2 sm:gap-3 md:gap-4" style={{height:"var(--cn-header-h)"}}>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-sm">CN</div>
          <span className="font-semibold text-slate-900 dark:text-white hidden sm:block">CollectNaija</span>
          {isDemo && <span className="hidden xl:inline-flex ml-2 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">Demo</span>}
          {schoolMode && <span className="hidden xl:inline-flex px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-700 dark:text-emerald-300">School Mode</span>}
        </div>
        <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-md mx-6 relative min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search customers, invoices, payments" data-search className="input-zoom-safe w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors" />
        </form>
        <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
          <select
            value={typeof localStorage !== "undefined" ? (localStorage.getItem("cn_dashboard_lang") || "en") : "en"}
            onChange={async e => {
              const code = e.target.value
              localStorage.setItem("cn_dashboard_lang", code); localStorage.setItem("cn_lang", code)
              try { const { liveUpdateOrgLanguageSettings } = await import("../services/live"); await liveUpdateOrgLanguageSettings({ dashboard_language: code }) } catch {}
              location.reload()
            }}
            title="Dashboard language — business owner language (§17), independent from customer language (§32)"
            className="input-zoom-safe hidden md:flex h-10 lg:h-9 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm lg:text-xs font-medium dark:text-slate-200"
          >
            <option value="en">English</option><option value="ha">Hausa</option><option value="yo">Yorùbá</option><option value="ig">Igbo</option><option value="pcm">Pidgin</option>
          </select>
          <ThemeToggle />
          {/* Shortcut hint button — pointer-only, pointless on touch */}
          <button
            onClick={() => setShowHelp(h => !h)}
            className="hidden md:flex w-10 h-10 lg:w-9 lg:h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-mono font-bold"
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
          >
            ?
          </button>
          <button onClick={()=>setShowNotifs(!showNotifs)} className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center relative dark:text-slate-200" aria-label="Notifications" aria-expanded={showNotifs}>
            <Bell className="w-4 h-4" />
            {unread>0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 text-[10px] font-bold text-white flex items-center justify-center">{unread>99?"99+":unread}</span>}
          </button>
          {/* Search on phones: icon button that reveals a full-width field */}
          <button
            onClick={()=>setSearchOpen(v=>!v)}
            className="md:hidden w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center dark:text-slate-200"
            aria-label="Search"
            aria-expanded={searchOpen}
          >
            {searchOpen ? <X className="w-5 h-5"/> : <Search className="w-4 h-4" />}
          </button>
          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700 ml-1">
            <div className="text-right hidden lg:block max-w-[160px]">
              <div className="text-sm font-medium leading-none text-slate-900 dark:text-white truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.org.name}</div>
            </div>
            <div className="w-9 h-9 shrink-0 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center text-sm font-medium">{user?.name?.[0]}</div>
          </div>
          {/* Logout lives in the phone drawer — the header has no room for it */}
          <button onClick={()=>{logout(); nav2("/")}} className="hidden lg:inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white whitespace-nowrap">
            <LogOut className="w-4 h-4" /> Logout
          </button>
          {/* Hamburger: phones only. Tablets+ get a persistent sidebar. */}
          <button className="md:hidden w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center dark:text-slate-200" onClick={()=>{setMobile(!mobile); setShowNotifs(false)}} aria-label="Menu" aria-expanded={mobile}>
            {mobile? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
          </button>
        </div>
      </div>
      {/* Phone search drawer — full width, sits under the header row */}
      {searchOpen && <div className="md:hidden px-3 pb-2.5">
        <form onSubmit={e=>{onSearch(e); setSearchOpen(false)}} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            autoFocus
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="Search customers, invoices…"
            className="input-zoom-safe w-full h-11 pl-9 pr-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors"
          />
          <button type="button" onClick={()=>{setSearchOpen(false); setQ("")}} className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label="Clear search">
            <X className="w-4 h-4" />
          </button>
        </form>
      </div>}
      {/* Notifications: a bottom sheet on phones, a dropdown from md up */}
      {showNotifs && <div className="fixed md:absolute inset-x-0 md:inset-x-auto md:right-4 top-cn-header w-full md:w-[380px] max-w-full bg-white dark:bg-slate-800 border-t md:border border-slate-200 dark:border-slate-700 md:rounded-2xl shadow-soft dark:shadow-softDark z-40 overflow-hidden max-h-[70dvh] md:max-h-[420px] flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shrink-0">
          <div className="font-semibold dark:text-white flex items-center gap-2">
            Notifications
            {unread>0 && <span className="rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5">{unread}</span>}
          </div>
          <button onClick={markAllRead} disabled={unread===0} className="text-xs text-brand-600 dark:text-brand-400 font-medium disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap">Mark all read</button>
        </div>
        <div className="flex-1 overflow-auto divide-y divide-slate-100 dark:divide-slate-700 overscroll-contain">
          {notifs.length===0 && <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">You’re all caught up.</div>}
          {notifs.slice(0,8).map(n=> <div key={n.id} className={`p-4 flex gap-3 ${n.read?"bg-white dark:bg-slate-800":"bg-slate-50 dark:bg-slate-700/50"}`}>
            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.read?"bg-slate-300 dark:bg-slate-600":"bg-brand-600"}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium dark:text-white break-anywhere">{n.title}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 break-anywhere">{n.body}</div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(n.time).toLocaleString()}</div>
            </div>
            {!n.read && <span className="text-xs px-2 py-1 rounded-full bg-brand-600 text-white h-fit shrink-0">New</span>}
          </div>)}
        </div>
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-xs text-center text-slate-500 dark:text-slate-400 shrink-0">Types: payment · invoice · reminder · system · read/unread persisted</div>
      </div>}
      {/* Phone drawer — phones only, tablets+ use the persistent sidebar */}
      {mobile && <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 space-y-1 max-h-[calc(100dvh-var(--cn-header-h))] overflow-auto overscroll-contain">
        {nav.map(n=> <NavLink key={n.to} to={n.to} onClick={()=>setMobile(false)} className={({isActive})=> "flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium min-h-[44px] "+(isActive?"bg-brand-600 dark:bg-brand-500 text-white shadow-sm":"text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")}>
          <n.icon className="w-5 h-5 shrink-0" /> {n.label}
        </NavLink>)}
        <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
          <button onClick={()=>{logout(); nav2("/")}} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium min-h-[44px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
            <LogOut className="w-5 h-5 shrink-0" /> Logout
          </button>
        </div>
      </div>}
    </header>
    <div className="max-w-[1600px] mx-auto flex items-start">
      {/* ── Sidebar ────────────────────────────────────────────────────────
          < 768px  : no sidebar (drawer + bottom tab bar instead)
          768–1023 : 72px icon rail, labels revealed on hover/focus
          ≥ 1024   : full 260px labelled column                              */}
      <aside className="hidden md:block md:w-[76px] lg:w-[260px] shrink-0 sticky top-cn-header h-cn-viewport overflow-y-auto overscroll-contain border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 lg:p-4">
        <nav className="space-y-1">
          {nav.map(n=> { const active=isActiveRoute(loc.pathname,n.to); return <NavLink
            key={n.to}
            to={n.to}
            title={n.label}
            aria-label={n.label}
            aria-current={active?"page":undefined}
            className={({isActive})=> "group relative flex md:justify-center lg:justify-start items-center gap-3 px-3 md:px-0 lg:px-3 py-2.5 md:py-3 rounded-xl text-sm font-medium transition md:min-h-[48px] "+(
              isActive
                ? "bg-brand-600 dark:bg-brand-500 text-white shadow-sm md:bg-brand-50 md:text-brand-700 md:shadow-none dark:md:bg-brand-500/15 dark:md:text-brand-300"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            {/* Active tick — the rail is too narrow for a filled pill to read clearly */}
            <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-brand-600 dark:bg-brand-400 transition-opacity ${active?"opacity-100":"opacity-0"}`} style={{height:"60%"}} />
            <n.icon className="w-[18px] h-[18px] shrink-0" />
            <span className="lg:inline whitespace-nowrap">{n.label}</span>
            {/* Hover flyout for the icon-only rail */}
            <span className="hidden md:group-hover:block lg:hidden absolute left-full top-1/2 -translate-y-1/2 ml-1 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium whitespace-nowrap shadow-lg pointer-events-none z-50">
              {n.label}
            </span>
          </NavLink> })}
        </nav>
        {/* Org card: full panel on laptop, collapses to a monogram on tablet */}
        <div className="mt-6 p-3 lg:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex md:block lg:flex items-center md:justify-center lg:justify-start gap-2 text-sm font-semibold dark:text-white min-w-0">
            <Building2 className="w-4 h-4 shrink-0"/>
            <span className="hidden lg:inline truncate">{user?.org.name}</span>
            <span className="lg:hidden">Org</span>
          </div>
          <div className="hidden lg:block text-xs text-slate-500 dark:text-slate-400 mt-1">{user?.org.currency || "NGN"} · Africa/Lagos {schoolMode && "· School"}</div>
          <div className="hidden lg:block mt-2 text-xs text-slate-500 dark:text-slate-400">{customers.length} customers · {invoices.length} invoices</div>
          <div className="mt-2 hidden lg:flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> Live & secure</div>
          {/* Sound toggle */}
          <button
            onClick={() => {
              const next = localStorage.getItem("cn_sound_enabled") === "0" ? "1" : "0"
              localStorage.setItem("cn_sound_enabled", next)
              // Force re-render by triggering a storage event
              window.dispatchEvent(new Event("storage"))
            }}
            className="mt-3 hidden lg:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors min-h-[32px] tap-wide"
            aria-label="Toggle notification sounds"
          >
            {localStorage.getItem("cn_sound_enabled") === "0" ? "🔇 Sounds off" : "🔔 Sounds on"}
            <span className="text-slate-300 dark:text-slate-600">· click to toggle</span>
          </button>
          {/* Keyboard shortcut hint — pointer devices only */}
          <button
            onClick={() => setShowHelp(true)}
            className="mt-1 hidden lg:flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-600 transition-colors min-h-[32px]"
          >
            <kbd className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono font-bold">?</kbd>
            Keyboard shortcuts
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 px-3 sm:px-4 lg:px-8 py-4 sm:py-6 pb-tabbar md:pb-8">
        <Outlet />
      </main>
    </div>
    {/* ── Phone bottom tab bar ────────────────────────────────────────────
        Phones only. On tablets a fixed bar steals vertical space that a
        768px-wide screen does not need, so it is hidden from md up. */}
    <nav className="md:hidden bottom-safe inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 flex justify-around z-30" style={{paddingTop:4}}>
      {[
        {to:"/dashboard", label:"Home", icon:LayoutDashboard},
        {to:"/customers", label:"Customers", icon:Users},
        {to:"/invoices", label:"Invoices", icon:FileText},
        {to:"/payments", label:"Payments", icon:CreditCard},
        {to:"/reminders", label:"More", icon:Menu},
      ].map(n=> { const active=isActiveRoute(loc.pathname,n.to); return <NavLink key={n.to} to={n.to} aria-current={active?"page":undefined} className={({isActive})=> "flex-1 flex flex-col items-center justify-center gap-1 px-1 py-1.5 min-h-[54px] rounded-xl transition "+(isActive?"text-brand-600 dark:text-brand-400":"text-slate-500 dark:text-slate-400")}>
        <n.icon className="w-5 h-5" /><span className="text-[11px] font-medium leading-none">{n.label}</span>
      </NavLink> })}
    </nav>

    {/* Floating Action Button — always visible */}
    <FAB />
  </div>
}
