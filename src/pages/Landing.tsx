import { Link } from "react-router-dom"
import { Check, ArrowRight, Users, FileText, CreditCard, Bell, BarChart3, Shield, Building2, Store, GraduationCap, Stethoscope } from "lucide-react"

export default function Landing(){
  return <div className="min-h-screen bg-white">
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-xs">CN</div>
          <span className="font-semibold">CollectNaija</span>
          <span className="hidden md:inline text-xs text-slate-500 ml-2">Collect what you are owed. Stay in control.</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100">Log in</Link>
          <Link to="/signup" className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700">Start Free</Link>
        </div>
      </div>
    </header>

    <section className="max-w-6xl mx-auto px-4 pt-12 md:pt-20 pb-12 grid md:grid-cols-2 gap-10 items-center">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600"><Shield className="w-3.5 h-3.5"/> Built for Nigerian businesses • Global-ready</div>
        <h1 className="mt-4 text-4xl md:text-[44px] font-bold tracking-tight leading-[1.05] text-slate-900">Stop Chasing Payments.<br/><span className="text-brand-600">Start Knowing Your Cash Flow.</span></h1>
        <p className="mt-4 text-[17px] leading-7 text-slate-600 max-w-xl">CollectNaija helps businesses track customers, invoices, outstanding balances and payments while automating payment reminders.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 min-h-[44px]">Start Free <ArrowRight className="w-4 h-4"/></Link>
          <a href="#how" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-200 bg-white font-medium hover:bg-slate-50 min-h-[44px]">See How It Works</a>
          <Link to="/dashboard" onClick={()=>localStorage.setItem("cn_demo","1")} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-black min-h-[44px]">Explore Demo</Link>
        </div>
        <div className="mt-6 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-600"/> No card required</span>
          <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-600"/> Demo data clearly labelled</span>
        </div>
      </div>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold">Cash-flow preview — Demo data</div>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800">Demo</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4"><div className="text-xs text-slate-500">Total Outstanding</div><div className="text-xl font-bold mt-1">?2,450,000</div><div className="text-xs text-amber-700 mt-1">12 customers • Demo</div></div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4"><div className="text-xs text-slate-500">Overdue</div><div className="text-xl font-bold mt-1 text-red-600">?640,000</div><div className="text-xs text-slate-500 mt-1">Due today ?180,000</div></div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4 col-span-2">
            <div className="text-xs font-medium text-slate-700">Needs Attention</div>
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-200"><div><div className="text-sm font-medium">Musa Ibrahim</div><div className="text-xs text-slate-600">?100,000 • 12 days overdue</div></div><span className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border">View</span></div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200"><div><div className="text-sm font-medium">Fatima Ali</div><div className="text-xs text-slate-600">?75,000 due today</div></div><span className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border">Remind</span></div>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">? Backend-provided balances • No fake claims</div>
      </div>
    </section>

    <section id="how" className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold">The problem ? The solution</h2>
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 p-6 bg-white">
          <h3 className="font-semibold">Common problems we solve</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>• Forgotten debts & scattered notebooks/WhatsApp</li>
            <li>• Late payments & payment disputes</li>
            <li>• No visibility on who owes what & when</li>
            <li>• Manual follow-ups that waste hours</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 p-6 bg-slate-900 text-white">
          <h3 className="font-semibold">How CollectNaija works</h3>
          <ol className="mt-3 space-y-2 text-sm text-slate-200">
            <li>1. Create invoice ? Track balance</li>
            <li>2. Send automated reminder (WhatsApp/SMS/Email)</li>
            <li>3. Receive payment ? Record it</li>
            <li>4. Generate receipt • See cash-flow clearly</li>
          </ol>
        </div>
      </div>
    </section>

    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {icon:Users, title:"Customer management", desc:"Search, filter, profile, payment history, communication log"},
          {icon:FileText, title:"Invoice management", desc:"Create, duplicate, share, cancel — backend calculates totals"},
          {icon:CreditCard, title:"Payment tracking", desc:"Record by method • Backend confirms success"},
          {icon:Bell, title:"Automated reminders", desc:"Before/on/after due date • WhatsApp/SMS/Email with variables"},
          {icon:BarChart3, title:"Reports & audit", desc:"Outstanding, overdue, collections, staff activity — CSV/PDF"},
          {icon:Shield, title:"Roles & permissions", desc:"Owner/Admin/Finance/Staff/Viewer • Org-isolated data"},
        ].map(f=> <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5"><f.icon className="w-5 h-5 text-brand-600"/><div className="font-semibold mt-3 text-sm">{f.title}</div><div className="text-sm text-slate-600 mt-1">{f.desc}</div></div>)}
      </div>
    </section>

    <section className="max-w-6xl mx-auto px-4 py-6">
      <h3 className="font-semibold">Built for many industries — without over-claiming</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {["Private schools","Retail","Wholesalers","Distributors","Fashion","Services","Training centres","Clinics","Contractors"].map(s=> <span key={s} className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-xs font-medium">{s}</span>)}
      </div>
      <p className="text-xs text-slate-500 mt-2">Features adapt to your workflow; school mode is opt-in.</p>
    </section>

    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {name:"Starter", price:"?4,500", per:"/mo", feat:["Up to 100 customers","Unlimited invoices","Reminders & receipts","Email support"]},
          {name:"Growth", price:"?12,000", per:"/mo", feat:["Up to 1,000 customers","Staff roles & audit","Advanced reports","WhatsApp reminders"], popular:true},
          {name:"Scale", price:"Custom", per:"", feat:["Unlimited customers","Multi-branch","Priority support","API access"]},
        ].map(p=> <div key={p.name} className={`rounded-3xl border p-6 bg-white ${p.popular?"border-brand-600 shadow-soft ring-1 ring-brand-600":"border-slate-200"}`}>
          {p.popular && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-600 text-white">Most popular</span>}
          <div className="font-semibold mt-3">{p.name}</div>
          <div className="mt-1"><span className="text-2xl font-bold">{p.price}</span><span className="text-sm text-slate-500">{p.per}</span></div>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">{p.feat.map(f=> <li key={f} className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5"/>{f}</li>)}</ul>
          <Link to="/signup" className={`mt-5 block text-center py-3 rounded-xl font-medium min-h-[44px] ${p.popular?"bg-brand-600 text-white":"border border-slate-200 bg-white"}`}>Choose {p.name}</Link>
        </div>)}
      </div>
      <p className="text-xs text-slate-500 mt-2 text-center">Prices configurable via backend — not hard-coded business logic.</p>
    </section>

    <section className="max-w-6xl mx-auto px-4 py-6">
      <h3 className="text-lg font-bold">FAQ</h3>
      <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
        {[
          ["Is my data secure?","We never expose secrets in the frontend. Auth is JWT; backend enforces permissions. HTTPS & org-isolated data."],
          ["How do payments work?","You record payments; online payments are confirmed by the provider/backend — never by button click alone."],
          ["Can I cancel anytime?","Yes, no dark patterns. Billing is transparent in Settings ? Subscription."],
          ["Do reminders cost extra?","Channels (WhatsApp/SMS/Email) are configurable per org; usage shown in billing."],
          ["Staff accounts?","Invite staff with roles: Owner/Admin/Finance/Staff/Viewer. Permissions are UX-only; backend is authoritative."],
          ["Can I add another language/currency?","Yes — i18n keys, currency & timezone are configurable; defaults: English, NGN, Africa/Lagos."],
        ].map(([q,a])=> <div key={q} className="rounded-2xl border border-slate-200 p-5 bg-white"><div className="font-semibold">{q}</div><div className="text-slate-600 mt-1">{a}</div></div>)}
      </div>
    </section>

    <section className="bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold">Take control of your outstanding payments.</h2>
        <p className="text-slate-300 mt-2">Know who owes you. Know how much. Know when they promised to pay. Follow up automatically.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/signup" className="px-6 py-3.5 rounded-xl bg-white text-slate-900 font-medium min-h-[44px]">Start Free</Link>
          <Link to="/login" className="px-6 py-3.5 rounded-xl border border-white/20 font-medium min-h-[44px]">Log in</Link>
        </div>
        <div className="mt-8 text-xs text-slate-400">© 2026 CollectNaija • Security • Privacy • Terms • Support: support@collectnaija.com • Trust by transparency, not fake logos.</div>
      </div>
    </section>
  </div>
}
