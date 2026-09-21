import { apiFetch } from "./api"

export type Paginated<T> = { count:number, next:string|null, previous:string|null, results:T[] }
type RawCustomer = { id:string, customer_code:string, name:string, phone:string, email:string, outstanding:string, overdue:string, created_at:string }
type RawInvoice = { id:string, invoice_number:string, customer:string, status:string, due_date:string|null, total:string, balance:string, currency:string, created_at:string }

const useMock = ():boolean => {
  const base = (import.meta as any).env.VITE_API_BASE_URL || ""
  return base.includes("example") // placeholder means mock
}

export async function liveListCustomers(q?:string){
  if(useMock()) return null
  const params = new URLSearchParams()
  if(q) params.set("search", q)
  const qs = params.toString() ? `?${params}` : ""
  const res = await apiFetch<Paginated<RawCustomer>>(`/customers${qs}`)
  return res
}
export async function liveCreateCustomer(payload:{name:string, phone:string, email?:string}){
  if(useMock()) return null
  const res = await apiFetch<RawCustomer>(`/customers`, { method:"POST", body: JSON.stringify(payload)})
  return res
}
export async function liveListInvoices(){
  if(useMock()) return null
  const res = await apiFetch<Paginated<RawInvoice>>(`/invoices`)
  return res
}
export async function liveCreateInvoice(payload:any, idempotencyKey?:string){
  if(useMock()) return null
  const headers:Record<string,string> = {}
  if(idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey
  return apiFetch<RawInvoice>(`/invoices`, { method:"POST", headers, body: JSON.stringify(payload)})
}
export async function liveListPayments(){
  if(useMock()) return null
  return apiFetch<Paginated<any>>(`/payments`)
}
export const isLive = !useMock()
