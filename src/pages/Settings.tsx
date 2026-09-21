import { useState } from "react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input, Select } from "../components/ui/input"
import { useAuth } from "../hooks/useAuth"
import { useToast } from "../components/ui/toast"

export default function Settings(){
  const {user}=useAuth()
  const {push}=useToast()
  const [tab,setTab]=useState("profile")
  const tabs=["profile","organization","users","roles","notifications","reminders","payments","localization","security","subscription","audit"]
  return <div className="space-y-4">
    <h1 className="text-xl font-bold">Settings</h1>
    <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-1">
      {tabs.map(t=> <button key={t} onClick={()=>setTab(t)} className={`px-3 py-2 rounded-full text-xs font-medium border capitalize whitespace-nowrap ${tab===t?"bg-slate-900 text-white border-slate-900":"bg-white border-slate-200"}`}>{t}</button>)}
    </div>

    {tab==="profile" && <Card className="p-6 space-y-3">
      <h3 className="font-semibold">Profile</h3>
      <Input label="Name" defaultValue={user?.name} />
      <Input label="Email" defaultValue={user?.email} />
      <Button onClick={()=>push("Profile saved (demo)","success")}>Save</Button>
    </Card>}

    {tab==="organization" && <Card className="p-6 space-y-3">
      <h3 className="font-semibold">Organization</h3>
      <Input label="Organization name" defaultValue={user?.org.name} />
      <Select label="Business type" value={user?.org.type} onChange={()=>{}} options={[{value:"school",label:"School"},{value:"retail",label:"Retail"},{value:"other",label:"Other"}]} />
      <div className="text-xs text-slate-500">Current org: {user?.org.id} • Isolated data per org.</div>
      <Button onClick={()=>push("Organization saved","success")}>Save</Button>
    </Card>}

    {tab==="users" && <Card className="p-6">
      <h3 className="font-semibold">Users & Staff</h3>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between p-3 rounded-xl border"><span>Adebayo Okafor — Owner</span><span className="text-emerald-600">Active</span></div>
        <div className="flex justify-between p-3 rounded-xl border"><span>Finance Staff — Finance Manager</span><span className="text-slate-500">Invite pending</span></div>
      </div>
      <Button className="mt-3" onClick={()=>push("Invite sent (demo)","success")}>Invite staff</Button>
    </Card>}

    {tab==="roles" && <Card className="p-6">
      <h3 className="font-semibold">Roles & Permissions</h3>
      <p className="text-sm text-slate-600">Frontend shows UX-only; backend enforces.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500"><tr><th className="text-left">Resource</th><th>View</th><th>Create</th><th>Edit</th><th>Delete</th></tr></thead>
          <tbody>
            {["Customers","Invoices","Payments","Reports"].map(r=> <tr key={r} className="border-t"><td className="py-2 font-medium">{r}</td><td className="text-center">?</td><td className="text-center">?</td><td className="text-center">?</td><td className="text-center">?</td></tr>)}
          </tbody>
        </table>
      </div>
    </Card>}

    {tab==="subscription" && <Card className="p-6">
      <h3 className="font-semibold">Subscription & Billing</h3>
      <div className="mt-3 p-4 rounded-2xl bg-slate-50 border">
        <div className="text-sm">Current plan: <span className="font-semibold">Growth — ?12,000/mo</span></div>
        <div className="text-xs text-slate-500 mt-1">Next billing: 21 Oct 2026 • Payment method: Card ending 4242 • Usage: 87/1000 customers</div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={()=>push("Upgrade flow (demo)","info")}>Upgrade</Button>
        <Button variant="secondary" onClick={()=>push("Downgrade — no dark pattern","info")}>Downgrade</Button>
        <Button variant="ghost" onClick={()=>push("Cancellation is not hidden","info")}>Cancel subscription</Button>
      </div>
      <div className="text-xs text-slate-500 mt-2">Never claims payment succeeded until backend confirms.</div>
    </Card>}

    {tab==="localization" && <Card className="p-6 space-y-3">
      <h3 className="font-semibold">Localization</h3>
      <Select label="Country" value="Nigeria" onChange={()=>{}} options={[{value:"Nigeria",label:"Nigeria"},{value:"Ghana",label:"Ghana"}]} />
      <Select label="Currency" value="NGN" onChange={()=>{}} options={[{value:"NGN",label:"NGN"},{value:"USD",label:"USD"}]} />
      <Select label="Timezone" value="Africa/Lagos" onChange={()=>{}} options={[{value:"Africa/Lagos",label:"Africa/Lagos"}]} />
      <Input label="Date format" defaultValue="DD MMM YYYY" />
      <Button onClick={()=>push("Localization saved","success")}>Save</Button>
    </Card>}

    {tab==="security" && <Card className="p-6 space-y-3">
      <h3 className="font-semibold">Security</h3>
      <div className="text-sm p-3 rounded-xl bg-slate-50 border">Last login: 21 Sep 2026 08:12 • Active sessions: 1 • 2FA: not yet enabled (when backend supports)</div>
      <Button variant="secondary" onClick={()=>push("Password updated (demo)","success")}>Change password</Button>
    </Card>}

    {tab==="audit" && <Card className="p-6">
      <h3 className="font-semibold">Audit log</h3>
      <div className="mt-3 space-y-2 text-sm">
        <div className="p-3 rounded-xl border">21 Sep 2026 — Admin recorded ?50,000 payment — MusA</div>
        <div className="p-3 rounded-xl border">20 Sep 2026 — Reminder sent to Musa Ibrahim</div>
        <div className="p-3 rounded-xl border">19 Sep 2026 — Invoice INV-1029 created</div>
        <div className="p-3 rounded-xl border">18 Sep 2026 — Finance staff updated customer information</div>
      </div>
    </Card>}

    {!["profile","organization","users","roles","subscription","localization","security","audit"].includes(tab) && <Card className="p-6">
      <h3 className="font-semibold capitalize">{tab}</h3>
      <p className="text-sm text-slate-600 mt-1">Configurable via backend. Prepare for global expansion without rewriting components.</p>
      <Button className="mt-3" onClick={()=>push("Saved (demo)","success")}>Save</Button>
    </Card>}
  </div>
}
