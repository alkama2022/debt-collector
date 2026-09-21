import { useState } from "react"
import { mockReminders } from "../services/mock"
import { formatCurrency, formatDate } from "../utils/format"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Modal } from "../components/ui/modal"
import { Input, Select, Textarea } from "../components/ui/input"
import { StatusBadge } from "../components/ui/badge"
import { useToast } from "../components/ui/toast"

export default function Reminders(){
  const {push}=useToast()
  const [tab,setTab]=useState<"all"|"scheduled"|"sent"|"failed"|"cancelled">("all")
  const [open,setOpen]=useState(false)
  const [channel,setChannel]=useState("whatsapp")
  const [timing,setTiming]=useState("On due date")
  const [tpl,setTpl]=useState("Hello {{customer_name}}, this is {{business_name}}. Invoice {{invoice_number}} for {{amount_due}} is due on {{due_date}}. Pay via {{payment_link}}.")
  const list=mockReminders.filter(r=> tab==="all"||r.status===tab)
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-xl font-bold">Reminders</h1><p className="text-sm text-slate-600">Scheduled • Sent • Failed • Cancelled — with channel & template variables.</p></div>
      <Button onClick={()=>setOpen(true)}>Create Reminder</Button>
    </div>

    <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-1">
      {["all","scheduled","sent","failed","cancelled"].map(t=> <button key={t} onClick={()=>setTab(t as any)} className={`px-3 py-2 rounded-full text-xs font-medium border capitalize whitespace-nowrap ${tab===t?"bg-slate-900 text-white border-slate-900":"bg-white border-slate-200"}`}>{t}</button>)}
    </div>

    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="text-left p-3">Customer</th><th className="text-left">Invoice</th><th className="text-right">Amount</th><th>Due</th><th>Channel</th><th>Status</th><th>Sent</th></tr></thead>
          <tbody>
            {list.map(r=> <tr key={r.id} className="border-t hover:bg-slate-50">
              <td className="p-3 font-medium">{r.customerName}</td>
              <td className="font-mono text-xs">{r.invoiceNumber}</td>
              <td className="text-right">{formatCurrency(r.amount)}</td>
              <td className="text-xs">{formatDate(r.dueDate)}</td>
              <td className="text-xs capitalize text-center">{r.channel}</td>
              <td className="text-center"><StatusBadge status={r.status} /></td>
              <td className="text-xs">{r.sentAt? formatDate(r.sentAt): "—"}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </Card>

    <Modal open={open} onClose={()=>setOpen(false)} title="Create reminder">
      <div className="space-y-3">
        <Select label="Timing" value={timing} onChange={e=>setTiming(e.target.value)} options={[{value:"Before due date",label:"Before due date"},{value:"On due date",label:"On due date"},{value:"After due date",label:"After due date"}]} />
        <Select label="Channel" value={channel} onChange={e=>setChannel(e.target.value)} options={[{value:"whatsapp",label:"WhatsApp"},{value:"sms",label:"SMS"},{value:"email",label:"Email"}]} />
        <Textarea label="Message template" value={tpl} onChange={e=>setTpl(e.target.value)} />
        <div className="text-xs text-slate-500">Variables: {"{{customer_name}}"} {"{{business_name}}"} {"{{invoice_number}}"} {"{{amount_due}}"} {"{{due_date}}"} {"{{payment_link}}"}</div>
        <div className="p-3 rounded-xl bg-slate-50 border">
          <div className="text-xs font-medium">Live preview</div>
          <div className="text-sm mt-1 text-slate-700">{tpl.replace("{{customer_name}}","Musa Ibrahim").replace("{{business_name}}","Al-Hikma Private School").replace("{{invoice_number}}","INV-1029").replace("{{amount_due}}","?100,000").replace("{{due_date}}","19 Sep 2026").replace("{{payment_link}}","pay.collectnaija.com/p/xyz")}</div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={()=>setOpen(false)}>Cancel</Button>
          <Button onClick={()=>{push("Reminder scheduled (demo)","success"); setOpen(false)}}>Save reminder</Button>
        </div>
      </div>
    </Modal>
  </div>
}
