import { createContext, useContext, useEffect, useState } from "react"
import type { Customer, Invoice, Payment, Reminder } from "../types"
import { mockCustomers, mockInvoices, mockPayments, mockReminders } from "./mock"

type Audit = { id:string; time:string; text:string }
type Notif = { id:string; title:string; body:string; time:string; read:boolean; type:string }

type Store = {
  customers: Customer[]
  invoices: Invoice[]
  payments: Payment[]
  reminders: Reminder[]
  audits: Audit[]
  notifs: Notif[]
  addCustomer: (c: {name:string; phone:string; email?:string})=>void
  addInvoice: (data:{customerId:string; amount:number; dueDate:string; desc:string})=>void
  addPayment: (data:{invoiceId:string; amount:number; method:string; ref:string; notes?:string})=>void
  addReminder: (data:{invoiceId:string; channel:Reminder["channel"]})=>void
  markNotifRead: (id:string)=>void
  markAllRead: ()=>void
}

const Ctx = createContext<Store>(null as any)

function load<T>(key:string, fallback:T):T{
  try{ const v=localStorage.getItem(key); return v? JSON.parse(v): fallback }catch{ return fallback }
}
function save(key:string, v:any){ localStorage.setItem(key, JSON.stringify(v)) }

export function StoreProvider({children}:{children:React.ReactNode}){
  const [customers,setCustomers]=useState<Customer[]>(()=>load("cn_customers", mockCustomers))
  const [invoices,setInvoices]=useState<Invoice[]>(()=>load("cn_invoices", mockInvoices))
  const [payments,setPayments]=useState<Payment[]>(()=>load("cn_payments", mockPayments))
  const [reminders,setReminders]=useState<Reminder[]>(()=>load("cn_reminders", mockReminders))
  const [audits,setAudits]=useState<Audit[]>(()=>load("cn_audits", [
    {id:"a1", time:new Date().toISOString(), text:"Invoice INV-1029 created"},
    {id:"a2", time:new Date(Date.now()-86400000).toISOString(), text:"Payment PAY-9281 recorded — Musa Ibrahim ?100,000"},
    {id:"a3", time:new Date(Date.now()-86400000*2).toISOString(), text:"Reminder sent to Fatima Ali via SMS"},
  ]))
  const [notifs,setNotifs]=useState<Notif[]>(()=>load("cn_notifs", [
    {id:"n1", title:"Payment received", body:"Musa Ibrahim paid ?100,000 for INV-1029", time:new Date().toISOString(), read:false, type:"payment"},
    {id:"n2", title:"Invoice overdue", body:"INV-1025 • Chinedu Okonkwo • ?640,000", time:new Date(Date.now()-3600000).toISOString(), read:false, type:"alert"},
    {id:"n3", title:"Reminder failed", body:"Email to Chinedu Okonkwo could not be delivered", time:new Date(Date.now()-7200000).toISOString(), read:true, type:"system"},
  ]))

  useEffect(()=>save("cn_customers",customers),[customers])
  useEffect(()=>save("cn_invoices",invoices),[invoices])
  useEffect(()=>save("cn_payments",payments),[payments])
  useEffect(()=>save("cn_reminders",reminders),[reminders])
  useEffect(()=>save("cn_audits",audits),[audits])
  useEffect(()=>save("cn_notifs",notifs),[notifs])

  const addCustomer=(data:{name:string;phone:string;email?:string})=>{
    const id="c"+Date.now()
    const cid="CUS-"+String(customers.length+1).padStart(3,"0")
    const c:Customer={ id, customerId:cid, name:data.name, phone:data.phone, email:data.email, totalInvoiced:0, totalPaid:0, outstanding:0, overdue:0, status:"active", createdAt:new Date().toISOString()}
    setCustomers(s=>[c, ...s])
    setAudits(a=>[{id:"a"+Date.now(), time:new Date().toISOString(), text:`Customer ${data.name} created (${cid})`}, ...a].slice(0,50))
    setNotifs(n=>[{id:"n"+Date.now(), title:"Customer added", body:`${data.name} • ${cid}`, time:new Date().toISOString(), read:false, type:"system"}, ...n])
  }
  const addInvoice=(data:{customerId:string; amount:number; dueDate:string; desc:string})=>{
    const cust=customers.find(c=>c.id===data.customerId)
    if(!cust) return
    const num="INV-"+(1029+invoices.length+Math.floor(Math.random()*10))
    const id="inv"+Date.now()
    const total=data.amount
    const inv:Invoice={ id, number:num, customerId:cust.id, customerName:cust.name, issueDate:new Date().toISOString().slice(0,10), dueDate:data.dueDate, status: new Date(data.dueDate) < new Date() ? "overdue": "sent", items:[{id:"1", description:data.desc||"Service", quantity:1, unitPrice:total}], subtotal:total, discount:0, tax:0, total, amountPaid:0, balance:total, currency:"NGN"}
    setInvoices(s=>[inv, ...s])
    setCustomers(s=> s.map(x=> x.id===cust.id? {...x, totalInvoiced: x.totalInvoiced+total, outstanding: x.outstanding+total, overdue: inv.status==="overdue"? x.overdue+total: x.overdue}: x))
    setAudits(a=>[{id:"a"+Date.now(), time:new Date().toISOString(), text:`Invoice ${num} created for ${cust.name} • ${new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN"}).format(total)}`}, ...a])
    setNotifs(n=>[{id:"n"+Date.now(), title:"Invoice created", body:`${num} • ${cust.name}`, time:new Date().toISOString(), read:false, type:"invoice"}, ...n])
  }
  const addPayment=(data:{invoiceId:string; amount:number; method:string; ref:string; notes?:string})=>{
    const inv=invoices.find(i=>i.id===data.invoiceId)
    if(!inv) return
    const pay:Payment={ id:"pay"+Date.now(), invoiceId:inv.id, invoiceNumber:inv.number, customerName:inv.customerName, amount:data.amount, currency:"NGN", method:data.method, reference:data.ref, status:"successful", date:new Date().toISOString().slice(0,10), notes:data.notes}
    setPayments(s=>[pay, ...s])
    setInvoices(s=> s.map(x=> x.id===inv.id? {...x, amountPaid: x.amountPaid+data.amount, balance: Math.max(0, x.balance-data.amount), status: (x.balance-data.amount)<=0? "paid": x.status}: x))
    setCustomers(s=> s.map(x=> x.name===inv.customerName? {...x, totalPaid: x.totalPaid+data.amount, outstanding: Math.max(0, x.outstanding-data.amount), overdue: Math.max(0, x.overdue-data.amount)}: x))
    setAudits(a=>[{id:"a"+Date.now(), time:new Date().toISOString(), text:`Payment ${data.ref} recorded • ${inv.customerName} • ${new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN"}).format(data.amount)} via ${data.method}`}, ...a])
    setNotifs(n=>[{id:"n"+Date.now(), title:"Payment received", body:`${inv.customerName} paid ${new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN"}).format(data.amount)}`, time:new Date().toISOString(), read:false, type:"payment"}, ...n])
    setReminders(r=> r.map(rem=> rem.invoiceNumber===inv.number && rem.status==="scheduled"? {...rem, status:"cancelled" as const}: rem))
  }
  const addReminder=(data:{invoiceId:string; channel:Reminder["channel"]})=>{
    const inv=invoices.find(i=>i.id===data.invoiceId)
    if(!inv) return
    const rem:Reminder={ id:"r"+Date.now(), customerName:inv.customerName, invoiceNumber:inv.number, amount:inv.balance, dueDate:inv.dueDate, channel:data.channel, status:"scheduled", scheduledAt:new Date().toISOString()}
    setReminders(s=>[rem, ...s])
    setAudits(a=>[{id:"a"+Date.now(), time:new Date().toISOString(), text:`Reminder scheduled for ${inv.customerName} • ${inv.number} via ${data.channel}`}, ...a])
    setTimeout(()=>{
      setReminders(s=> s.map(x=> x.id===rem.id? {...x, status:"sent" as const, sentAt:new Date().toISOString()}: x))
      setNotifs(n=>[{id:"n"+Date.now(), title:"Reminder sent", body:`${data.channel} to ${inv.customerName} • ${inv.number}`, time:new Date().toISOString(), read:false, type:"reminder"}, ...n])
    }, 2000)
  }
  const markNotifRead=(id:string)=> setNotifs(s=> s.map(n=> n.id===id? {...n, read:true}: n))
  const markAllRead=()=> setNotifs(s=> s.map(n=> ({...n, read:true})))

  return <Ctx.Provider value={{customers,invoices,payments,reminders,audits,notifs,addCustomer,addInvoice,addPayment,addReminder,markNotifRead,markAllRead}}>{children}</Ctx.Provider>
}
export const useStore=()=> useContext(Ctx)
