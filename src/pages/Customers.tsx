import { useState, useMemo, useEffect } from "react"
import { Link } from "react-router-dom"
import { useStore } from "../services/store"
import { formatCurrency } from "../utils/format"
import { liveListCustomers, liveCreateCustomer, isLive } from "../services/live"
import { Card } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { EmptyState } from "../components/ui/empty"
import { Modal } from "../components/ui/modal"
import { useToast } from "../components/ui/toast"
import { Skeleton } from "../components/ui/skeleton"
import { Search, Plus, Users } from "lucide-react"

export default function Customers(){
  const {customers:mockCustomers,addCustomer,addReminder,invoices}=useStore()
  const {push}=useToast()
  const [loading,setLoading]=useState(true)
  const [liveCustomers,setLiveCustomers]=useState<any[]|null>(null)
  useEffect(()=>{
    if(isLive){
      liveListCustomers().then(r=>{
        if(r) setLiveCustomers(r.results.map((c:any)=>({
          id:c.id, customerId:c.customer_code, name:c.name, phone:c.phone, email:c.email,
          outstanding: Number(c.outstanding), overdue: Number(c.overdue), totalInvoiced: Number(c.outstanding), status: "active"
        })))
        else setLiveCustomers(null)
      }).catch(()=> setLiveCustomers(null)).finally(()=> setLoading(false))
    } else {
      const t=setTimeout(()=>setLoading(false),350); return ()=>clearTimeout(t)
    }
  },[])
  const customers = (isLive && liveCustomers) ? liveCustomers : mockCustomers
  const [q,setQ]=useState("")
  const [filter,setFilter]=useState<"all"|"overdue"|"archived">("all")
  const [open,setOpen]=useState(false)
  const [name,setName]=useState("")
  const [phone,setPhone]=useState("")
  const [email,setEmail]=useState("")
  const [saving,setSaving]=useState(false)
  const list=useMemo(()=> customers.filter(c=> {
    const m=q? c.name.toLowerCase().includes(q.toLowerCase())||c.customerId.toLowerCase().includes(q.toLowerCase())||(c.phone||"").includes(q):true
    const f= filter==="overdue"? c.overdue>0 : filter==="archived"? c.status==="archived": c.status==="active"
    return m&&f
  }),[customers,q,filter])
  const add=async()=>{
    if(!name){ push("Name required","error"); return}
    setSaving(true)
    try{
      if(isLive){
        const res:any = await liveCreateCustomer({name,phone,email})
        const c = res?.data ?? res
        if(c?.id){
          push(`${name} added (live)`,"success")
          // refetch
          const r = await liveListCustomers()
          if(r) setLiveCustomers(r.results.map((x:any)=>({ id:x.id, customerId:x.customer_code, name:x.name, phone:x.phone, email:x.email, outstanding:Number(x.outstanding), overdue:Number(x.overdue), totalInvoiced:Number(x.outstanding), status:"active"})))
        }
      } else {
        addCustomer({name,phone,email})
        push(`${name} added — balances start at ₦0`,"success")
      }
      setOpen(false); setName(""); setPhone(""); setEmail("")
    }catch(e:any){
      push(e?.data?.message || "Failed to create customer","error")
    } finally { setSaving(false) }
  }
  if(loading) return <div className="space-y-3"><Skeleton className="h-16 w-full"/><Skeleton className="h-64 w-full"/></div>
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold">Customers</h1>
        <p className="text-sm text-slate-600">{customers.length} customers � Search is live � Try adding one and watch Dashboard update.</p>
      </div>
      <Button onClick={()=>setOpen(true)} className="gap-2"><Plus className="w-4 h-4"/> Add Customer</Button>
    </div>

    <Card className="p-4 flex flex-col md:flex-row gap-3">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name, ID or phone" className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>
      <div className="flex gap-1">
        {["all","overdue","archived"].map(f=> <button key={f} onClick={()=>setFilter(f as any)} className={`px-3 py-2 rounded-xl text-sm font-medium border capitalize ${filter===f?"bg-slate-900 text-white border-slate-900":"bg-white border-slate-200"}`}>{f}</button>)}
      </div>
    </Card>

    {list.length===0 ? <EmptyState title="No customers yet" desc="Add your first customer to start tracking payments. It will appear here and on Dashboard instantly." icon={<Users className="w-6 h-6"/>} action={{label:"Add Customer", onClick:()=>setOpen(true)}} /> : <>
      <div className="grid md:hidden gap-3">
        {list.map(c=> <Card key={c.id} className="p-4">
          <div className="flex justify-between">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium">{c.name[0]}</div>
              <div>
                <div className="font-semibold text-sm">{c.name}</div>
                <div className="text-xs text-slate-500">{c.customerId} � {c.phone}</div>
              </div>
            </div>
            <Badge tone={c.overdue?"danger":c.outstanding?"warning":"success"}>{c.overdue?"Overdue":c.outstanding?"Owes":"Clear"}</Badge>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-50 border"><div className="text-xs text-slate-500">Invoiced</div><div className="text-sm font-semibold">{formatCurrency(c.totalInvoiced)}</div></div>
            <div className="p-2 rounded-xl bg-slate-50 border"><div className="text-xs text-slate-500">Outstanding</div><div className="text-sm font-semibold">{formatCurrency(c.outstanding)}</div></div>
            <div className="p-2 rounded-xl bg-red-50 border border-red-200"><div className="text-xs text-red-700">Overdue</div><div className="text-sm font-semibold text-red-700">{formatCurrency(c.overdue)}</div></div>
          </div>
          <div className="mt-3 flex gap-2">
            <Link to={`/customers/${c.id}`} className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-center text-sm font-medium min-h-[44px] flex items-center justify-center">View</Link>
            <button onClick={()=>{
              const inv=invoices.find(i=>i.customerId===c.id)
              if(inv){ addReminder({invoiceId:inv.id, channel:"whatsapp"}); push(`WhatsApp queued for ${c.name}`,"success")}
              else push("No invoice to remind on � create one first","info")
            }} className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium min-h-[44px]">Remind</button>
          </div>
        </Card>)}
      </div>

      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="text-left p-3">Customer</th><th className="text-left">ID</th><th className="text-right">Outstanding</th><th className="text-right">Overdue</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {list.map(c=> <tr key={c.id} className="border-t border-slate-200 hover:bg-slate-50">
                <td className="p-3"><Link to={`/customers/${c.id}`} className="font-medium hover:underline">{c.name}</Link><div className="text-xs text-slate-500">{c.phone} � {c.email||"no email"}</div></td>
                <td className="font-mono text-xs">{c.customerId}</td>
                <td className="text-right font-medium">{formatCurrency(c.outstanding)}</td>
                <td className="text-right"><span className={c.overdue?"text-red-600 font-medium":"text-slate-500"}>{formatCurrency(c.overdue)}</span></td>
                <td className="text-right pr-3"><Link to={`/customers/${c.id}`} className="px-3 py-1.5 rounded-full border bg-white text-xs font-medium">View</Link></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </Card>
    </>}

    <Modal open={open} onClose={()=>setOpen(false)} title="Add customer">
      <div className="space-y-3">
        <Input label="Customer name" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Musa Ibrahim" />
        <Input label="Phone" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="0803 ..." />
        <Input label="Email (optional)" value={email} onChange={e=>setEmail(e.target.value)} placeholder="musa@example.com" />
        <div className="text-xs text-slate-500">{isLive ? "Live — saved to Django backend (tenant-isolated)" : "Demo — persists to localStorage. Set VITE_API_BASE_URL to your backend to go live."}</div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={()=>setOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={add} disabled={saving}>{saving?"Saving...":"Save customer"}</Button>
        </div>
      </div>
    </Modal>
  </div>
}
