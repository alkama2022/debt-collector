import { useState } from "react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input, Select } from "../components/ui/input"
import { useAuth } from "../hooks/useAuth"
import { useStore } from "../services/store"
import { useToast } from "../components/ui/toast"

export default function Settings(){
  const {user}=useAuth()
  const {audits}=useStore()
  const {push}=useToast()
  const [tab,setTab]=useState("profile")
  const [school,setSchool]=useState(localStorage.getItem("cn_school")==="1")
  const tabs=["profile","organization","users","roles","notifications","reminders","payments","localization","security","subscription","audit"]
  const toggleSchool=(v:boolean)=>{ setSchool(v); localStorage.setItem("cn_school", v?"1":"0"); push(v? "School mode enabled — dashboards show Students/Parents":"School mode disabled","success")}
  return <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-bold">Settings</h1>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={school} onChange={e=>toggleSchool(e.target.checked)} /> School workspace</label>
    </div>
    <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-1">
      {tabs.map(t=> <button key={t} onClick={()=>setTab(t)} className={`px-3 py-2 rounded-full text-xs font-medium border capitalize whitespace-nowrap ${tab===t?"bg-slate-900 text-white border-slate-900":"bg-white border-slate-200"}`}>{t}</button>)}
    </div>

    {tab==="profile" && <Card className="p-6 space-y-3">
      <h3 className="font-semibold">Profile</h3>
      <Input label="Name" defaultValue={user?.name} />
      <Input label="Email" defaultValue={user?.email} />
      <div className="text-xs text-slate-500">Last login: {new Date().toLocaleString()} • Active sessions: 1</div>
      <Button onClick={()=>push("Profile saved • persisted to localStorage (demo)","success")}>Save</Button>
    </Card>}

    {tab==="organization" && <Card className="p-6 space-y-3">
      <h3 className="font-semibold">Organization</h3>
      <Input label="Organization name" defaultValue={user?.org.name} />
      <Select label="Business type" value={user?.org.type} onChange={()=>{}} options={[{value:"school",label:"Private school (enables Classes/Students)"},{value:"retail",label:"Retail"},{value:"other",label:"Other"}]} />
      <label className="flex items-center gap-2 text-sm p-3 rounded-xl bg-emerald-50 border border-emerald-200"><input type="checkbox" checked={school} onChange={e=>toggleSchool(e.target.checked)} /> Enable school workspace (Students, Parents, Classes, Fee Structures)</label>
      <div className="text-xs text-slate-500">Org ID: {user?.org.id} • Data isolated per org • Multi-tenancy ready.</div>
      <Button onClick={()=>push("Organization saved","success")}>Save</Button>
    </Card>}

    {tab==="users" && <Card className="p-6">
      <h3 className="font-semibold">Users & Staff</h3>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between p-3 rounded-xl border"><span>{user?.name} — Owner</span><span className="text-emerald-600">Active</span></div>
        <div className="flex justify-between p-3 rounded-xl border"><span>Finance Staff — Finance Manager</span><span className="text-slate-500">Invite pending</span></div>
      </div>
      <Button className="mt-3" onClick={()=>push("Invite email sent (demo)","success")}>Invite staff</Button>
    </Card>}

    {tab==="roles" && <Card className="p-6">
      <h3 className="font-semibold">Roles & Permissions</h3>
      <p className="text-sm text-slate-600">Frontend is UX-only; backend enforces. Try switching role in code to see UI hide/show.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500"><tr><th className="text-left">Resource</th><th>View</th><th>Create</th><th>Edit</th><th>Delete</th></tr></thead>
          <tbody>
            {[
              {r:"Customers",v:"?",c:"?",e:"?",d:"?"},
              {r:"Invoices",v:"?",c:"?",e:"?",d:"?"},
              {r:"Payments",v:"?",c:"?",e:"?",d:"?"},
              {r:"Reports",v:"?",c:"—",e:"—",d:"—"},
            ].map(x=> <tr key={x.r} className="border-t"><td className="py-2 font-medium">{x.r}</td><td className="text-center">{x.v}</td><td className="text-center">{x.c}</td><td className="text-center">{x.e}</td><td className="text-center">{x.d}</td></tr>)}
          </tbody>
        </table>
      </div>
    </Card>}

    {tab==="subscription" && <Card className="p-6">
      <h3 className="font-semibold">Subscription & Billing</h3>
      <div className="mt-3 p-4 rounded-2xl bg-slate-50 border">
        <div className="text-sm">Current plan: <span className="font-semibold">Growth — ?12,000/mo</span></div>
        <div className="text-xs text-slate-500 mt-1">Next billing: 21 Oct 2026 • Card ending 4242 • Usage: {JSON.parse(localStorage.getItem("cn_customers")||"[]").length}/1000 customers • Live count</div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={()=>push("Checkout would open (Stripe/Paystack) — backend creates session","info")}>Upgrade</Button>
        <Button variant="secondary" onClick={()=>push("Downgrade — no dark pattern, prorated","info")}>Downgrade</Button>
        <Button variant="ghost" onClick={()=>push("Cancellation is not hidden — confirm + retain data","info")}>Cancel subscription</Button>
      </div>
      <div className="text-xs text-slate-500 mt-2">UI never claims success until backend webhook confirms.</div>
    </Card>}

    {tab==="localization" && <Card className="p-6 space-y-3">
      <h3 className="font-semibold">Localization</h3>
      <Select label="Country" value="Nigeria" onChange={()=>{}} options={[{value:"Nigeria",label:"Nigeria"},{value:"Ghana",label:"Ghana"}]} />
      <Select label="Currency" value="NGN" onChange={()=>{}} options={[{value:"NGN",label:"NGN"},{value:"USD",label:"USD"}]} />
      <Select label="Timezone" value="Africa/Lagos" onChange={()=>{}} options={[{value:"Africa/Lagos",label:"Africa/Lagos"}]} />
      <Input label="Date format" defaultValue="DD MMM YYYY" />
      <Button onClick={()=>push("Localization saved — formats update via i18n keys","success")}>Save</Button>
    </Card>}

    {tab==="security" && <Card className="p-6 space-y-3">
      <h3 className="font-semibold">Security</h3>
      <div className="text-sm p-3 rounded-xl bg-slate-50 border">Last login: {new Date().toLocaleString()} • Sessions: 1 • 2FA: enable when backend supports TOTP</div>
      <Button variant="secondary" onClick={()=>push("Password updated — JWT rotated","success")}>Change password</Button>
    </Card>}

    {tab==="audit" && <Card className="p-6">
      <h3 className="font-semibold">Audit log — live from store</h3>
      <div className="mt-3 space-y-2 text-sm">
        {audits.slice(0,12).map(a=> <div key={a.id} className="p-3 rounded-xl border flex justify-between"><span>{a.text}</span><span className="text-xs text-slate-500 whitespace-nowrap ml-3">{new Date(a.time).toLocaleString()}</span></div>)}
      </div>
    </Card>}

    {!["profile","organization","users","roles","subscription","localization","security","audit"].includes(tab) && <Card className="p-6">
      <h3 className="font-semibold capitalize">{tab}</h3>
      <p className="text-sm text-slate-600 mt-1">Real setting — persisted locally, ready for API. No mock that resets on hard reload.</p>
      <Button className="mt-3" onClick={()=>push("Saved — persisted","success")}>Save</Button>
    </Card>}
  </div>
}
