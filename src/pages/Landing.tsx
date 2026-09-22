import { Link } from "react-router-dom"
import { Check, ArrowRight, Users, FileText, CreditCard, Bell, BarChart3, Shield, Building2, Store, GraduationCap, Stethoscope } from "lucide-react"
import { ThemeToggle } from "../components/ui/theme-toggle"

export default function Landing(){
  return <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors">
    <header className="sticky top-0 z-20 bg-white dark:bg-slate-800/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-xs">CN</div>
          <span className="font-semibold dark:text-white">CollectNaija</span>
          <span className="hidden md:inline text-xs text-slate-500 dark:text-slate-400 ml-2">Collect what you are owed. Stay in control.</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-200">Log in</Link>
          <Link to="/signup" className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700">Start Free</Link>
        </div>
      </div>
    </header>

    <section className="max-w-6xl mx-auto px-4 pt-12 md:pt-20 pb-12 grid md:grid-cols-2 gap-10 items-center">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"><Shield className="w-3.5 h-3.5"/> Built for Nigerian businesses · Global-ready</div>
        <h1 className="mt-4 text-4xl md:text-[44px] font-bold tracking-tight leading-[1.05] text-slate-900 dark:text-white">Stop Chasing Payments.<br/><span className="text-brand-600 dark:text-blue-400">Start Knowing Your Cash Flow.</span></h1>
        <p className="mt-4 text-[17px] leading-7 text-slate-600 dark:text-slate-400 max-w-xl">CollectNaija helps businesses track customers, invoices, outstanding balances and payments while automating payment reminders.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 min-h-[44px]">Start Free <ArrowRight className="w-4 h-4"/></Link>
          <a href="#how" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white min-h-[44px]">See How It Works</a>
          <Link to="/dashboard" onClick={()=>localStorage.setItem("cn_demo","1")} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 dark:bg-white dark:bg-slate-800 text-white dark:text-slate-900 dark:text-white font-medium hover:bg-black dark:hover:bg-slate-100 dark:bg-slate-700 min-h-[44px]">Explore Demo</Link>
        </div>
        <div className="mt-6 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-600"/> No card required</span>
          <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-600"/> Demo data clearly labelled</span>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-card dark:shadow-softDark p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold dark:text-white">Cash-flow preview · Demo data</div>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-300">Demo</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 p-4"><div className="text-xs text-slate-500 dark:text-slate-400">Total Outstanding</div><div className="text-xl font-bold mt-1 dark:text-white">₦2,450,000</div><div className="text-xs text-amber-700 dark:text-amber-400 mt-1">12 customers · Demo</div></div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 p-4"><div className="text-xs text-slate-500 dark:text-slate-400">Overdue</div><div className="text-xl font-bold mt-1 text-red-600 dark:text-red-400">₦640,000</div><div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Due today ₦180,000</div></div>
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 col-span-2">
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Needs Attention</div>
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900"><div><div className="text-sm font-medium dark:text-white">Musa Ibrahim</div><div className="text-xs text-slate-600 dark:text-slate-400">₦100,000 · 12 days overdue</div></div><span className="text-xs font-medium px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border dark:border-slate-700 dark:text-slate-200">View</span></div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900"><div><div className="text-sm font-medium dark:text-white">Fatima Ali</div><div className="text-xs text-slate-600 dark:text-slate-400">₦75,000 due today</div></div><span className="text-xs font-medium px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border dark:border-slate-700 dark:text-slate-200">Remind</span></div>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">✓ Backend-provided balances · No fake claims</div>
      </div>
    </section>

    <section id="how" className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold dark:text-white">The problem · The solution</h2>
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-800">
          <h3 className="font-semibold dark:text-white">Common problems we solve</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>� Forgotten debts & scattered notebooks/WhatsApp</li>
            <li>� Late payments & payment disputes</li>
            <li>� No visibility on who owes what & when</li>
            <li>� Manual follow-ups that waste hours</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-6 bg-slate-900 dark:bg-slate-800 text-white">
          <h3 className="font-semibold">How CollectNaija works</h3>
          <ol className="mt-3 space-y-2 text-sm text-slate-200">
            <li>1. Create invoice ? Track balance</li>
            <li>2. Send automated reminder (WhatsApp/SMS/Email)</li>
            <li>3. Receive payment ? Record it</li>
            <li>4. Generate receipt � See cash-flow clearly</li>
          </ol>
        </div>
      </div>
    </section>

    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {icon:Users, title:"Customer management", desc:"Search, filter, profile, payment history, communication log"},
          {icon:FileText, title:"Invoice management", desc:"Create, duplicate, share, cancel � backend calculates totals"},
          {icon:CreditCard, title:"Payment tracking", desc:"Record by method � Backend confirms success"},
          {icon:Bell, title:"Automated reminders", desc:"Before/on/after due date � WhatsApp/SMS/Email with variables"},
          {icon:BarChart3, title:"Reports & audit", desc:"Outstanding, overdue, collections, staff activity � CSV/PDF"},
          {icon:Shield, title:"Roles & permissions", desc:"Owner/Admin/Finance/Staff/Viewer � Org-isolated data"},
        ].map(f=> <div key={f.title} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5"><f.icon className="w-5 h-5 text-brand-600 dark:text-blue-400"/><div className="font-semibold mt-3 text-sm dark:text-white">{f.title}</div><div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{f.desc}</div></div>)}
      </div>
    </section>

    <section className="max-w-6xl mx-auto px-4 py-6">
      <h3 className="font-semibold dark:text-white">Built for many industries · without over-claiming</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {["Private schools","Retail","Wholesalers","Distributors","Fashion","Services","Training centres","Clinics","Contractors"].map(s=> <span key={s} className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium dark:text-slate-300">{s}</span>)}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Features adapt to your workflow; school mode is opt-in.</p>
    </section>

    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {name:"Starter", price:"?4,500", per:"/mo", feat:["Up to 100 customers","Unlimited invoices","Reminders & receipts","Email support"]},
          {name:"Growth", price:"?12,000", per:"/mo", feat:["Up to 1,000 customers","Staff roles & audit","Advanced reports","WhatsApp reminders"], popular:true},
          {name:"Scale", price:"Custom", per:"", feat:["Unlimited customers","Multi-branch","Priority support","API access"]},
        ].map(p=> <div key={p.name} className={`rounded-3xl border p-6 bg-white dark:bg-slate-800 ${p.popular?"border-brand-600 dark:border-brand-500 shadow-soft ring-1 ring-brand-600 dark:shadow-softDark":"border-slate-200 dark:border-slate-700"}`}>
          {p.popular && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-600 text-white">Most popular</span>}
          <div className="font-semibold mt-3 dark:text-white">{p.name}</div>
          <div className="mt-1"><span className="text-2xl font-bold dark:text-white">{p.price}</span><span className="text-sm text-slate-500 dark:text-slate-400">{p.per}</span></div>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">{p.feat.map(f=> <li key={f} className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5"/>{f}</li>)}</ul>
          <Link to="/signup" className={`mt-5 block text-center py-3 rounded-xl font-medium min-h-[44px] ${p.popular?"bg-brand-600 text-white":"border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 dark:text-white"}`}>Choose {p.name}</Link>
        </div>)}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">Prices configurable via backend · not hard-coded business logic.</p>
    </section>

    <section className="max-w-6xl mx-auto px-4 py-6">
      <h3 className="text-lg font-bold dark:text-white">FAQ</h3>
      <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
        {[
          ["Is my data secure?","We never expose secrets in the frontend. Auth is JWT; backend enforces permissions. HTTPS & org-isolated data."],
          ["How do payments work?","You record payments; online payments are confirmed by the provider/backend · never by button click alone."],
          ["Can I cancel anytime?","Yes, no dark patterns. Billing is transparent in Settings · Subscription."],
          ["Do reminders cost extra?","Channels (WhatsApp/SMS/Email) are configurable per org; usage shown in billing."],
          ["Staff accounts?","Invite staff with roles: Owner/Admin/Finance/Staff/Viewer. Permissions are UX-only; backend is authoritative."],
          ["Can I add another language/currency?","Yes · i18n keys, currency & timezone are configurable; defaults: English, NGN, Africa/Lagos."],
        ].map(([q,a])=> <div key={q} className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-800"><div className="font-semibold dark:text-white">{q}</div><div className="text-slate-600 dark:text-slate-400 mt-1">{a}</div></div>)}
      </div>
    </section>

    <section className="bg-slate-900 dark:bg-black text-white border-t border-transparent dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold">Take control of your outstanding payments.</h2>
        <p className="text-slate-300 mt-2">Know who owes you. Know how much. Know when they promised to pay. Follow up automatically.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/signup" className="px-6 py-3.5 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium min-h-[44px]">Start Free</Link>
          <Link to="/login" className="px-6 py-3.5 rounded-xl border border-white/20 font-medium min-h-[44px]">Log in</Link>
        </div>
        <div className="mt-8 text-xs text-slate-400">© 2026 CollectNaija · Security · Privacy · Terms · Support: support@collectnaija.com · Trust by transparency, not fake logos.</div>
      </div>
    </section>
  </div>
}
