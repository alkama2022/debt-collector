import { useState } from "react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/toast"
import { formatCurrency } from "../utils/format"

export default function Reports(){
  const {push}=useToast()
  const [range,setRange]=useState("30 days")
  const exp=()=> push("Exported CSV (demo) — wire to API export","success")
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-xl font-bold">Reports</h1><p className="text-sm text-slate-600">Outstanding, overdue, collections, payments, revenue, behavior, staff activity — filter & export.</p></div>
      <div className="flex gap-2">
        <select value={range} onChange={e=>setRange(e.target.value)} className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm">
          <option>7 days</option><option>30 days</option><option>3 months</option><option>12 months</option>
        </select>
        <Button variant="secondary" onClick={exp}>Export CSV</Button>
        <Button variant="secondary" onClick={exp}>Export PDF</Button>
      </div>
    </div>

    <div className="grid md:grid-cols-3 gap-3">
      {[
        {t:"Outstanding balances", v:formatCurrency(2450000), d:"All open invoices"},
        {t:"Overdue accounts", v:formatCurrency(640000), d:"12 accounts"},
        {t:"Collection rate", v:"68%", d:"Collected vs expected • "+range},
      ].map(c=> <Card key={c.t} className="p-4"><div className="text-xs text-slate-500 uppercase">{c.t}</div><div className="text-xl font-bold mt-1">{c.v}</div><div className="text-xs text-slate-500">{c.d}</div></Card>)}
    </div>

    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-5">
        <h3 className="font-semibold">Collection report</h3>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between p-3 rounded-xl bg-slate-50 border"><span>Expected (30d)</span><span className="font-medium">{formatCurrency(3200000)}</span></div>
          <div className="flex justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200"><span>Collected</span><span className="font-medium text-emerald-700">{formatCurrency(2180000)}</span></div>
          <div className="flex justify-between p-3 rounded-xl bg-red-50 border border-red-200"><span>Overdue</span><span className="font-medium text-red-700">{formatCurrency(640000)}</span></div>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold">Customer payment behavior</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500"><tr><th className="text-left">Customer</th><th className="text-right">On-time %</th><th className="text-right">Avg delay</th></tr></thead>
            <tbody>
              <tr className="border-t"><td className="py-2">Musa Ibrahim</td><td className="text-right">60%</td><td className="text-right">8 days</td></tr>
              <tr className="border-t"><td className="py-2">Fatima Ali</td><td className="text-right">95%</td><td className="text-right">1 day</td></tr>
              <tr className="border-t"><td className="py-2">Chinedu Okonkwo</td><td className="text-right">20%</td><td className="text-right">22 days</td></tr>
            </tbody>
          </table>
        </div>
        <div className="text-xs text-slate-500 mt-2">Based on API data • Date/customer/status filters supported.</div>
      </Card>
    </div>

    <Card className="p-5">
      <h3 className="font-semibold">Staff activity (audit preview)</h3>
      <div className="mt-3 space-y-2 text-sm">
        <div className="p-3 rounded-xl border flex justify-between"><span>21 Sep 2026 — Admin recorded ?50,000 payment</span><span className="text-xs text-slate-500">09:12</span></div>
        <div className="p-3 rounded-xl border flex justify-between"><span>20 Sep 2026 — Reminder sent to Musa Ibrahim</span><span className="text-xs text-slate-500">16:40</span></div>
        <div className="p-3 rounded-xl border flex justify-between"><span>19 Sep 2026 — Invoice INV-1029 created</span><span className="text-xs text-slate-500">11:02</span></div>
      </div>
    </Card>
  </div>
}
