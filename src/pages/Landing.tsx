import { Link } from "react-router-dom"
import { Check, ArrowRight, Users, FileText, CreditCard, Bell, BarChart3, Shield, Building2, Sparkles, Clock, Lock } from "lucide-react"
import { ThemeToggle } from "../components/ui/theme-toggle"

export default function Landing(){
  return <div className="min-h-screen-dvh bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 antialiased">
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#020617]/90 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800 pt-safe">
      <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">CN</div>
          <span className="font-semibold tracking-tight hidden sm:inline truncate">CollectNaija</span>
          <span className="hidden md:inline text-xs text-slate-500 ml-2 whitespace-nowrap">The receivables workspace for ambitious businesses</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <ThemeToggle />
          <Link to="/pricing" className="hidden sm:inline px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900">Pricing</Link>
          <Link to="/login" className="px-3 sm:px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">Log in</Link>
          <Link to="/signup" className="px-3 sm:px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium hover:bg-black dark:hover:bg-slate-100 shadow-sm whitespace-nowrap">Start free</Link>
        </div>
      </div>
    </header>

    <section className="max-w-6xl mx-auto px-4 pt-12 md:pt-16 pb-10 grid md:grid-cols-2 gap-10 items-center">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 border border-violet-200/60 dark:border-violet-800 text-xs font-medium text-violet-700 dark:text-violet-300"><Sparkles className="w-3.5 h-3.5"/> Nigeria-first. Built to scale globally.</div>
        <h1 className="mt-5 text-4xl md:text-[46px] font-bold tracking-tight leading-[1.02]">Stop chasing payments.<br/><span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">Start collecting</span> with confidence.</h1>
        <p className="mt-4 text-[17px] leading-7 text-slate-600 dark:text-slate-400 max-w-xl">Customer management, invoicing, payment tracking and automated reminders — in one calm workspace. Your team knows who owes what, when they promised to pay, and what to do next.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 shadow-sm hover:shadow-md transition">Start free <ArrowRight className="w-4 h-4"/></Link>
          <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium hover:bg-slate-50 dark:hover:bg-slate-700">View pricing</Link>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600"/> No card required</span>
          <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-slate-400"/> Bank-grade security</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400"/> Setup in 3 minutes</span>
        </div>
        <div className="mt-6 flex items-center gap-3 text-xs text-slate-500">
          <div className="flex -space-x-2">{[1,2,3].map(i=> <img key={i} src={`https://i.pravatar.cc/80?img=${i+12}`} alt="" className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 object-cover"/> )}</div>
          <span>Trusted by growing schools, retailers and service teams across Lagos, Abuja & Port Harcourt</span>
        </div>
      </div>
      <div className="relative">
        <div className="absolute -inset-3 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-950/20 dark:to-indigo-950/20 rounded-[28px] blur-2xl"/>
        <div className="relative bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-2xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">Your cash flow at a glance</div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-700 dark:text-emerald-300">Live update</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4"><div className="text-xs text-slate-500">Outstanding</div><div className="text-xl font-bold mt-1">₦2.45M</div><div className="text-xs text-slate-500 mt-1">12 active accounts</div></div>
            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4"><div className="text-xs text-slate-500">Overdue</div><div className="text-xl font-bold mt-1 text-amber-600">₦640k</div><div className="text-xs text-slate-500 mt-1">Due today ₦180k</div></div>
            <div className="rounded-2xl bg-slate-900 text-white p-4 col-span-2 flex items-center justify-between">
              <div><div className="text-xs text-white/70">Collected this month</div><div className="text-lg font-semibold mt-1">₦1.2M • 18 payments</div></div>
              <div className="w-10 h-10 rounded-xl bg-white/10 grid place-items-center">🎉</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"><div><div className="text-sm font-medium">Musa Ibrahim — ₦100,000</div><div className="text-xs text-slate-600 dark:text-slate-400">12 days overdue • WhatsApp reminder ready</div></div><span className="text-xs font-medium px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border">Nudge</span></div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5"><Shield className="w-3 h-3"/> Every balance is calculated on the server — never in the browser.</div>
        </div>
      </div>
    </section>

    <section id="how" className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {n:"01", t:"Add customers & invoices", d:"One place for every account. Search, filter, and see exactly who owes what — no more notebooks."},
          {n:"02", t:"Automate gentle reminders", d:"WhatsApp, SMS or email. Before, on, or after due date. Personalised with name, amount and pay link."},
          {n:"03", t:"Get paid & stay clear", d:"Record payments, send receipts, and watch cash flow update live. Your team always knows next steps."},
        ].map(s=> <div key={s.n} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6"><div className="text-xs font-mono text-brand-600 dark:text-brand-400">{s.n}</div><div className="font-semibold mt-2">{s.t}</div><div className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">{s.d}</div></div>)}
      </div>
    </section>

    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {icon:Users, title:"Customer workspace", desc:"Profiles, payment history, language preference, and every conversation in one timeline."},
          {icon:FileText, title:"Invoices that add up", desc:"Server-calculated totals, due dates, and shareable pay links. Duplicate or void in one click."},
          {icon:CreditCard, title:"Payments you can trust", desc:"Each payment is verified by the provider — status comes from the backend, never the button."},
          {icon:Bell, title:"Reminders that respect people", desc:"Quiet hours, language-aware templates, and human escalation when confidence is low."},
          {icon:BarChart3, title:"Reports your accountant will love", desc:"Outstanding vs overdue, collections by week, and full audit log. Export CSV/PDF."},
          {icon:Shield, title:"Permissions, done right", desc:"Owner, Admin, Collection Manager — every action is org-isolated and auditable."},
        ].map(f=> <div key={f.title} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 hover:shadow-md transition-shadow"><f.icon className="w-5 h-5 text-brand-600"/><div className="font-semibold mt-3 text-sm">{f.title}</div><div className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">{f.desc}</div></div>)}
      </div>
    </section>

    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="rounded-3xl bg-slate-900 dark:bg-black text-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70"><Building2 className="w-3.5 h-3.5"/> For schools • retail • clinics • services</div>
          <h3 className="text-xl font-semibold mt-2">You don’t need another spreadsheet.</h3>
          <p className="text-sm text-white/70 mt-1 max-w-xl">Whether you run a school with 2,000 families or a workshop with 80 clients — CollectNaija scales with you, without losing the personal touch.</p>
        </div>
        <Link to="/signup" className="px-6 py-3.5 rounded-xl bg-white text-slate-900 font-medium hover:bg-slate-100 shrink-0">Create your workspace</Link>
      </div>
    </section>

    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {name:"Free", price:"₦0", per:"/month", feat:["50 customers","Manual reminders","Basic dashboard","1 staff"], cta:"Start free"},
          {name:"Business", price:"₦12,000", per:"/month", feat:["2,500 customers","Automated WhatsApp AI","Payment plans & campaigns","Advanced analytics"], popular:true},
          {name:"Professional", price:"₦25,000", per:"/month", feat:["10,000 customers","AI voice calls","API & webhooks","Priority support"], cta:"Go professional"},
        ].map(p=> <div key={p.name} className={`rounded-3xl border p-6 bg-white dark:bg-slate-800 ${p.popular?"border-brand-600 shadow-lg shadow-brand-600/10 ring-1 ring-brand-600":"border-slate-200 dark:border-slate-700"}`}>
          {p.popular && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-600 text-white">Most chosen</span>}
          <div className="font-semibold mt-3">{p.name}</div>
          <div className="mt-1"><span className="text-2xl font-bold">{p.price}</span><span className="text-sm text-slate-500">{p.per}</span></div>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">{p.feat.map(f=> <li key={f} className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5"/>{f}</li>)}</ul>
          <Link to="/signup" className={`mt-5 block text-center py-3 rounded-xl font-medium ${p.popular?"bg-brand-600 text-white hover:bg-brand-700":"border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"}`}>{p.cta || `Choose ${p.name}`}</Link>
        </div>)}
      </div>
      <p className="text-xs text-slate-500 text-center mt-3">Full comparison on <Link to="/pricing" className="underline">Pricing</Link> • Prices are configuration — easily changed without a code deploy.</p>
    </section>

    <section className="max-w-6xl mx-auto px-4 py-6">
      <h3 className="text-lg font-bold">Straight answers</h3>
      <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
        {[
          ["Is my money safe?","Payments run through Paystack/Flutterwave. We verify every transaction server-side and record it immutably. No payment is marked successful from the frontend alone."],
          ["What if I downgrade?","Your data stays. If you have 600 customers on Business and move to Starter (500), you keep everything — you just can’t add more until you’re back within the limit."],
          ["Will you charge me silently?","Never. Overage needs your explicit choice — block, use credits, or allow auto-charge. We flag high usage for review, we don’t auto-punish."],
          ["Can I use Hausa, Yoruba, Igbo or Pidgin?","Yes. Customers have a preferred language, the dashboard has its own. AI detects, responds natively, and escalates when confidence is low."],
        ].map(([q,a])=> <div key={q} className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-800"><div className="font-semibold">{q}</div><div className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{a}</div></div>)}
      </div>
    </section>

    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div><div className="font-semibold flex items-center gap-2"><span className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 grid place-items-center text-xs font-bold">CN</span> CollectNaija</div><p className="text-sm text-slate-500 mt-2 max-w-sm">Helping Nigerian businesses get paid on time — with respect for every customer.</p></div>
          <div className="text-sm text-slate-500 flex gap-6"><a href="#" className="hover:text-slate-900 dark:hover:text-white">Privacy</a><a href="#" className="hover:text-slate-900 dark:hover:text-white">Terms</a><a href="mailto:support@collectnaija.com" className="hover:text-slate-900 dark:hover:text-white">support@collectnaija.com</a></div>
        </div>
        <div className="mt-8 text-xs text-slate-400">© 2026 CollectNaija • Built by humans, for humans. Every amount is calculated on the server.</div>
      </div>
    </footer>
  </div>
}
