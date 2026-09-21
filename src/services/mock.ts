import type { Customer, Invoice, Payment, Reminder } from "../types"

export const mockCustomers: Customer[] = [
  { id:"c1", name:"Musa Ibrahim", phone:"0803 123 4567", email:"musa@example.com", customerId:"CUS-001", totalInvoiced:850000, totalPaid:650000, outstanding:200000, overdue:100000, status:"active", createdAt:"2026-08-12"},
  { id:"c2", name:"Fatima Ali", phone:"0805 987 6543", email:"fatima@example.com", customerId:"CUS-002", totalInvoiced:420000, totalPaid:345000, outstanding:75000, overdue:0, status:"active", createdAt:"2026-09-01"},
  { id:"c3", name:"Chinedu Okonkwo", phone:"0814 222 3333", email:"chinedu@example.com", customerId:"CUS-003", totalInvoiced:1200000, totalPaid:560000, outstanding:640000, overdue:640000, status:"active", createdAt:"2026-07-20"},
  { id:"c4", name:"Aisha Bello", phone:"0706 111 2222", email:"aisha@example.com", customerId:"CUS-004", totalInvoiced:310000, totalPaid:310000, outstanding:0, overdue:0, status:"active", createdAt:"2026-09-10"},
  { id:"c5", name:"Tunde Bakare", phone:"0802 555 6666", email:"tunde@example.com", customerId:"CUS-005", totalInvoiced:980000, totalPaid:400000, outstanding:580000, overdue:120000, status:"active", createdAt:"2026-08-30"},
]

export const mockInvoices: Invoice[] = [
  { id:"inv1", number:"INV-1029", customerId:"c1", customerName:"Musa Ibrahim", issueDate:"2026-09-12", dueDate:"2026-09-19", status:"overdue", items:[{id:"1",description:"Wholesale cartons - Seasoning",quantity:50,unitPrice:4000}], subtotal:200000, discount:0, tax:0, total:200000, amountPaid:100000, balance:100000, currency:"NGN"},
  { id:"inv2", number:"INV-1030", customerId:"c2", customerName:"Fatima Ali", issueDate:"2026-09-15", dueDate:"2026-09-21", status:"sent", items:[{id:"1",description:"School fees - Term 1",quantity:1,unitPrice:75000}], subtotal:75000, discount:0, tax:0, total:75000, amountPaid:0, balance:75000, currency:"NGN"},
  { id:"inv3", number:"INV-1025", customerId:"c3", customerName:"Chinedu Okonkwo", issueDate:"2026-08-20", dueDate:"2026-08-30", status:"overdue", items:[{id:"1",description:"Building materials",quantity:100,unitPrice:6400}], subtotal:640000, discount:0, tax:0, total:640000, amountPaid:0, balance:640000, currency:"NGN"},
  { id:"inv4", number:"INV-1031", customerId:"c4", customerName:"Aisha Bello", issueDate:"2026-09-18", dueDate:"2026-09-25", status:"paid", items:[{id:"1",description:"Tailoring service",quantity:2,unitPrice:15000}], subtotal:30000, discount:0, tax:0, total:30000, amountPaid:30000, balance:0, currency:"NGN"},
]

export const mockPayments: Payment[] = [
  { id:"pay1", invoiceId:"inv1", invoiceNumber:"INV-1029", customerName:"Musa Ibrahim", amount:100000, currency:"NGN", method:"Bank transfer", reference:"PAY-9281", status:"successful", date:"2026-09-18", notes:"Part payment"},
  { id:"pay2", invoiceId:"inv4", invoiceNumber:"INV-1031", customerName:"Aisha Bello", amount:30000, currency:"NGN", method:"Cash", reference:"PAY-9282", status:"successful", date:"2026-09-19"},
  { id:"pay3", invoiceId:"inv2", invoiceNumber:"INV-1030", customerName:"Fatima Ali", amount:75000, currency:"NGN", method:"Online payment", reference:"PAY-9283", status:"pending", date:"2026-09-21"},
]

export const mockReminders: Reminder[] = [
  { id:"r1", customerName:"Musa Ibrahim", invoiceNumber:"INV-1029", amount:100000, dueDate:"2026-09-19", channel:"whatsapp", status:"sent", sentAt:"2026-09-20", scheduledAt:"2026-09-20"},
  { id:"r2", customerName:"Fatima Ali", invoiceNumber:"INV-1030", amount:75000, dueDate:"2026-09-21", channel:"sms", status:"scheduled", scheduledAt:"2026-09-21"},
  { id:"r3", customerName:"Chinedu Okonkwo", invoiceNumber:"INV-1025", amount:640000, dueDate:"2026-08-30", channel:"email", status:"failed", scheduledAt:"2026-09-19"},
]

export const kpis = {
  totalOutstanding: 2450000,
  dueToday: 180000,
  overdue: 640000,
  collectedMonth: 1280000,
}

export const cashflow = [
  { name:"14 Sep", expected:120000, collected:80000, overdue:40000},
  { name:"15 Sep", expected:150000, collected:150000, overdue:0},
  { name:"16 Sep", expected:90000, collected:60000, overdue:30000},
  { name:"17 Sep", expected:200000, collected:120000, overdue:80000},
  { name:"18 Sep", expected:180000, collected:180000, overdue:0},
  { name:"19 Sep", expected:220000, collected:100000, overdue:120000},
  { name:"20 Sep", expected:170000, collected:170000, overdue:0},
  { name:"21 Sep", expected:190000, collected:90000, overdue:100000},
]
