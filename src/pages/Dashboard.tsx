import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { formatCurrency } from "../utils/format"
import { cashflow } from "../services/mock"
import { useAuth } from "../hooks/useAuth"
import { useStore } from "../services/store"
import { Card } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/toast"
import { Skeleton, StatSkeleton } from "../components/ui/skeleton"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

export default function Dashboard(){
  const {user}=useAuth()
  const {customers,invoices,payments,addReminder}=useStore()
  const {push}=useToast()
  const [range,setRange]=useState("7 days")
  const [loading,setLoading]=useState(true)
  useEffect(()=>{ const t=setTimeout(()=>setLoading(false),450); return ()=>clearTimeout(t)},[])
  const hour=new Date().getHours()
  const greet= hour<12?"Good morning": hour<18?"Good afternoon":"Good evening"

  const totalOutstanding = invoices.reduce((a,b)=>a+b.balance,0)
  const dueToday = invoices.filter(i=> i.dueDate===new Date().toISOString().slice(0,10)).reduce((a,b)=>a+b.balance,0)
  const overdue = invoices.filter(i=> i.status==="overdue").reduce((a,b)=>a+b.balance,0)
  const collectedMonth = payments.filter(p=> p.status==="successful" && p.date.startsWith("2026-09")).reduce((a,b)=>a+b.amount,0)

  const needs = [...customers].filter(c=>c.overdue>0||c.outstanding>0).sort((a,b)=> b.overdue - a.overdue).slice(0,3)

  if(loading) return <div className="space-y-4">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1,2,3,4].map(i=> <StatSkeleton key={i}/>)}</div>
    <Skeleton className="h-[280px] w-full" />
  </div>

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{greet}, {user?.name?.split(" ")[0]}</h1>
        <p className="text-sm text-slate-600">Here is what needs your attention today. <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 ml-2">Live • updates as you work</span></p>
      </div>
      <div className="flex gap-2">
        <Link to="/invoices" className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium min-h-[44px] inline-flex items-center">Create Invoice</Link>
        <Link to="/customers" className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium min-h-[44px] inline-flex items-center">Add Customer</Link>
      </div>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card className="p-5"><div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Outstanding</div><div className="text-xl md:text-2xl font-bold mt-2">{formatCurrency(totalOutstanding)}</div><div className="text-xs text-slate-500 mt-1">Across {customers.length} customers • Live</div></Card>
      <Card className="p-5"><div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Due Today</div><div className="text-xl md:text-2xl font-bold mt-2">{formatCurrency(dueToday)}</div><div className="text-xs text-amber-700 mt-1">{invoices.filter(i=>i.dueDate===new Date().toISOString().slice(0,10)).length} invoices due</div></Card>
      <Card className="p-5"><div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Overdue</div><div className="text-xl md:text-2xl font-bold mt-2 text-red-600">{formatCurrency(overdue)}</div><div className="text-xs text-red-600 mt-1">{invoices.filter(i=>i.status==="overdue").length} need follow-up</div></Card>
      <Card className="p-5"><div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Collected This Month</div><div className="text-xl md:text-2xl font-bold mt-2 text-emerald-600">{formatCurrency(collectedMonth)}</div><div className="text-xs text-slate-500 mt-1">{payments.length} payments • Live</div></Card>
    </div>

    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Needs Attention</h2>
          <span className="text-xs text-slate-500">Most overdue first • real balances</span>
        </div>
        <div className="mt-4 space-y-3">
          {needs.length? needs.map(c=> <div key={c.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium">{c.name[0]}</div>
              <div>
                <div className="text-sm font-semibold flex items-center gap-2">{c.name} <Badge tone={c.overdue>0?"danger":"warning"}>{c.overdue>0?"Overdue":"Due"}</Badge></div>
                <div className="text-sm text-slate-600">{formatCurrency(c.overdue || c.outstanding)} • {c.phone}</div>
                <div className="text-xs text-slate-500 hidden md:block">ID: {c.customerId}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={`/customers/${c.id}`} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium min-h-[44px] inline-flex items-center">View</Link>
              <Button size="sm" onClick={()=>{
                const inv=invoices.find(i=> i.customerId===c.id)
                if(inv){ addReminder({invoiceId:inv.id, channel:"whatsapp"}); push(`Reminder queued for ${c.name} • WhatsApp`,"success")}
                else push("Create an invoice first","info")
              }}>Send Reminder</Button>
            </div>
          </div>): <div className="text-sm text-slate-500 p-4 border border-dashed rounded-xl text-center">All caught up — no overdue balances. Add a customer or create an invoice to see this update live.</div>}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold">Quick actions</h2>
        <div className="mt-3 space-y-2">
          <Link to="/customers" className="block p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-medium">Add customer ?</Link>
          <Link to="/invoices" className="block p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-medium">Create invoice ?</Link>
          <Link to="/payments" className="block p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-medium">Record payment ?</Link>
          <button onClick={()=>push(`Receipts update live after payment`,"info")} className="w-full text-left p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-medium">Generate receipt ?</button>
        </div>
        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <div className="font-medium">School mode</div>
          <div className="mt-1">Enable in Settings ? Organization to track students/parents. Toggle is persisted and changes dashboard labels.</div>
        </div>
      </Card>
    </div>

    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Cash flow</h2>
        <div className="flex gap-1">
          {["7 days","30 days","3 months","12 months"].map(r=> <button key={r} onClick={()=>setRange(r)} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${range===r?"bg-slate-900 text-white border-slate-900":"bg-white border-slate-200"}`}>{r}</button>)}
        </div>
      </div>
      <div className="mt-4 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cashflow}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{fontSize:11}} />
            <YAxis tick={{fontSize:11}} tickFormatter={v=> (v/1000)+"k"} />
            <Tooltip />
            <Area type="monotone" dataKey="expected" name="Expected" stroke="#0f4c81" fill="#dbeafe" strokeWidth={2} />
            <Area type="monotone" dataKey="collected" name="Collected" stroke="#059669" fill="#d1fae5" strokeWidth={2} />
            <Area type="monotone" dataKey="overdue" name="Overdue" stroke="#dc2626" fill="#fee2e2" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-xs text-slate-500">Chart is illustrative; KPIs above are live from your invoices/payments.</div>
    </Card>

    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Recent invoices</h2>
        <Link to="/invoices" className="text-sm text-brand-600 font-medium">View all</Link>
      </div>
      <div className="mt-3 overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500"><tr><th className="text-left py-2">Invoice</th><th className="text-left">Customer</th><th className="text-left">Due</th><th className="text-left">Status</th><th className="text-right">Balance</th></tr></thead>
          <tbody>
            {invoices.slice(0,4).map(inv=> <tr key={inv.id} className="border-t border-slate-100"><td className="py-3 font-medium font-mono">{inv.number}</td><td>{inv.customerName}</td><td className="text-slate-600">{inv.dueDate}</td><td><Badge tone={inv.status==="overdue"?"danger":inv.status==="paid"?"success":"warning"}>{inv.status}</Badge></td><td className="text-right font-medium">{formatCurrency(inv.balance)}</td></tr>)}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
}
