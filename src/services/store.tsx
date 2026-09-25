/**
 * store.tsx — Application-wide data store backed by the real API.
 * No mock data. No localStorage persistence of business data.
 * Fetches on mount; mutations call the API then refresh state.
 */
import { createContext, useContext, useCallback, useEffect, useReducer, useRef } from "react"
import type { Customer, Invoice, Payment, Reminder } from "../types"
import {
  listCustomers,
  listInvoices,
  listPayments,
  listCommEvents,
  listAuditLogs,
  createCustomer,
  bulkCreateCustomers,
  createInvoice,
  createPayment,
  createCommEvent,
  normalizeCustomer,
  normalizeInvoice,
  normalizePayment,
  normalizeCommEvent,
} from "./live"

// ─── Types ────────────────────────────────────────────────────────────────────

export type Audit = { id: string; time: string; text: string }
export type Notif = { id: string; title: string; body: string; time: string; read: boolean; type: string }

type State = {
  customers: Customer[]
  invoices: Invoice[]
  payments: Payment[]
  reminders: Reminder[]
  audits: Audit[]
  notifs: Notif[]
  loading: boolean
  error: string | null
}

type Action =
  | { type: "SET_ALL"; customers: Customer[]; invoices: Invoice[]; payments: Payment[]; reminders: Reminder[]; audits: Audit[] }
  | { type: "SET_CUSTOMERS"; customers: Customer[] }
  | { type: "SET_INVOICES"; invoices: Invoice[] }
  | { type: "SET_PAYMENTS"; payments: Payment[] }
  | { type: "SET_REMINDERS"; reminders: Reminder[] }
  | { type: "ADD_NOTIF"; notif: Notif }
  | { type: "MARK_NOTIF_READ"; id: string }
  | { type: "MARK_ALL_READ" }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }

export type Store = State & {
  refresh: () => Promise<void>
  addCustomer: (data: { name: string; phone: string; email?: string; preferred_language?: string }) => Promise<void>
  bulkAddCustomers: (rows: { name: string; phone?: string; email?: string; preferred_language?: string }[]) => Promise<{ created: number; failed: number; errors: any[] }>
  addInvoice: (data: { customerId: string; amount: number; dueDate: string; desc: string }) => Promise<void>
  addPayment: (data: { invoiceId: string; amount: number; method: string; ref: string; notes?: string }) => Promise<Payment>
  addReminder: (data: { invoiceId: string; channel: Reminder["channel"] }) => Promise<void>
  markNotifRead: (id: string) => void
  markAllRead: () => void
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState: State = {
  customers: [],
  invoices: [],
  payments: [],
  reminders: [],
  audits: [],
  notifs: [],
  loading: false,
  error: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_ALL":
      return {
        ...state,
        customers: action.customers,
        invoices: action.invoices,
        payments: action.payments,
        reminders: action.reminders,
        audits: action.audits,
        loading: false,
        error: null,
      }
    case "SET_CUSTOMERS":
      return { ...state, customers: action.customers }
    case "SET_INVOICES":
      return { ...state, invoices: action.invoices }
    case "SET_PAYMENTS":
      return { ...state, payments: action.payments }
    case "SET_REMINDERS":
      return { ...state, reminders: action.reminders }
    case "ADD_NOTIF":
      return { ...state, notifs: [action.notif, ...state.notifs].slice(0, 50) }
    case "MARK_NOTIF_READ":
      return { ...state, notifs: state.notifs.map(n => n.id === action.id ? { ...n, read: true } : n) }
    case "MARK_ALL_READ":
      return { ...state, notifs: state.notifs.map(n => ({ ...n, read: true })) }
    case "SET_LOADING":
      return { ...state, loading: action.loading }
    case "SET_ERROR":
      return { ...state, error: action.error, loading: false }
    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const Ctx = createContext<Store>(null as any)

// ─── Provider ────────────────────────────────────────────────────────────────

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  // Prevent double-fetch in StrictMode
  const fetchedRef = useRef(false)

  // Build a lookup map: invoice id → invoice (for payment/reminder enrichment)
  const invoiceMapRef = useRef<Map<string, Invoice>>(new Map())
  const customerMapRef = useRef<Map<string, Customer>>(new Map())

  const refresh = useCallback(async () => {
    dispatch({ type: "SET_LOADING", loading: true })
    try {
      const [custRes, invRes, payRes, commRes, auditRes] = await Promise.allSettled([
        listCustomers(),
        listInvoices(),
        listPayments(),
        listCommEvents(),
        listAuditLogs(),
      ])

      const customers =
        custRes.status === "fulfilled"
          ? custRes.value.results.map(normalizeCustomer)
          : state.customers

      const customerMap = new Map(customers.map(c => [c.id, c]))
      customerMapRef.current = customerMap

      const invoices =
        invRes.status === "fulfilled"
          ? invRes.value.results.map(raw =>
              normalizeInvoice(raw, customerMap.get(raw.customer)?.name)
            )
          : state.invoices

      const invoiceMap = new Map(invoices.map(i => [i.id, i]))
      invoiceMapRef.current = invoiceMap

      const payments =
        payRes.status === "fulfilled"
          ? payRes.value.results.map(raw => {
              const inv = invoiceMap.get(raw.invoice ?? "")
              return normalizePayment(raw, inv?.number, inv?.customerName)
            })
          : state.payments

      const reminders =
        commRes.status === "fulfilled"
          ? commRes.value.results.map(raw => {
              const inv = invoiceMap.get(raw.invoice ?? "")
              const cust = customerMap.get(raw.customer ?? "")
              const r = normalizeCommEvent(raw, inv?.number, cust?.name ?? inv?.customerName)
              return {
                ...r,
                amount: inv?.balance ?? 0,
                dueDate: inv?.dueDate ?? "",
              }
            })
          : state.reminders

      const audits: Audit[] =
        auditRes.status === "fulfilled"
          ? auditRes.value.results.map(a => ({
              id: a.id,
              time: a.created_at,
              text: `${a.action} on ${a.target_type}${a.target_id ? ` (${a.target_id.slice(0, 8)})` : ""}`,
            }))
          : state.audits

      dispatch({ type: "SET_ALL", customers, invoices, payments, reminders, audits })
    } catch (err: any) {
      dispatch({ type: "SET_ERROR", error: err?.data?.message ?? "Failed to load data" })
    }
  }, [])

  // Initial load — skip if not authenticated
  useEffect(() => {
    const token = localStorage.getItem("cn_token")
    if (!token) return
    if (fetchedRef.current) return
    fetchedRef.current = true
    refresh()
  }, [refresh])

  // ── Mutations ────────────────────────────────────────────────────────────

  const addCustomer = useCallback(async (data: { name: string; phone: string; email?: string; preferred_language?: string }) => {
    const raw = await createCustomer(data)
    const c = normalizeCustomer(raw)
    dispatch({ type: "SET_CUSTOMERS", customers: [c, ...state.customers] })
    dispatch({
      type: "ADD_NOTIF",
      notif: { id: `n${Date.now()}`, title: "Customer added", body: `${c.name} — ${c.customerId}`, time: new Date().toISOString(), read: false, type: "system" },
    })
  }, [state.customers])

  const bulkAddCustomers = useCallback(async (rows: { name: string; phone?: string; email?: string; preferred_language?: string }[]) => {
    const res = await bulkCreateCustomers(rows)
    const newCustomers = res.customers.map(normalizeCustomer)
    if (newCustomers.length) {
      dispatch({ type: "SET_CUSTOMERS", customers: [...newCustomers, ...state.customers] })
      dispatch({
        type: "ADD_NOTIF",
        notif: { id: `n${Date.now()}`, title: "Bulk import complete", body: `${res.created} customers imported${res.failed ? `, ${res.failed} failed` : ""}`, time: new Date().toISOString(), read: false, type: "system" },
      })
    }
    return res
  }, [state.customers])

  const addInvoice = useCallback(async (data: { customerId: string; amount: number; dueDate: string; desc: string }) => {
    const amountKobo = Math.round(data.amount * 100)
    const raw = await createInvoice(
      {
        customer: data.customerId,
        due_date: data.dueDate,
        currency: "NGN",
        items: [{ name: data.desc || "Service", qty: 1, unit_price_minor: amountKobo }],
      },
      `inv-${Date.now()}`
    )
    const customerName = customerMapRef.current.get(data.customerId)?.name ?? ""
    const inv = normalizeInvoice(raw, customerName)
    invoiceMapRef.current.set(inv.id, inv)
    dispatch({ type: "SET_INVOICES", invoices: [inv, ...state.invoices] })
    dispatch({
      type: "ADD_NOTIF",
      notif: { id: `n${Date.now()}`, title: "Invoice created", body: `${inv.number} — ${inv.customerName}`, time: new Date().toISOString(), read: false, type: "invoice" },
    })
  }, [state.invoices])

  const addPayment = useCallback(async (data: { invoiceId: string; amount: number; method: string; ref: string; notes?: string }) => {
    const raw = await createPayment(
      {
        invoice: data.invoiceId,
        amount: data.amount.toFixed(2),
        currency: "NGN",
        provider: data.method,   // serializer maps this to provider=manual + method label
        method: data.method,
        provider_ref: data.ref,
        notes: data.notes || "",
      },
      `pay-${Date.now()}`
    )
    const inv = invoiceMapRef.current.get(data.invoiceId)
    const pay = normalizePayment(raw, inv?.number, inv?.customerName)

    // Optimistically update invoice balance and status
    const updatedInvoices = state.invoices.map(i => {
      if (i.id !== data.invoiceId) return i
      const newBalance = Math.max(0, i.balance - data.amount)
      const newAmountPaid = i.amountPaid + data.amount
      const newStatus =
        newBalance <= 0 ? ("paid" as const) :
        newAmountPaid > 0 ? ("partial" as const) :
        i.status
      return { ...i, balance: newBalance, amountPaid: newAmountPaid, status: newStatus }
    })

    dispatch({ type: "SET_INVOICES", invoices: updatedInvoices })
    dispatch({ type: "SET_PAYMENTS", payments: [pay, ...state.payments] })
    dispatch({
      type: "ADD_NOTIF",
      notif: { id: `n${Date.now()}`, title: "Payment received", body: `${pay.customerName} paid ₦${data.amount.toLocaleString()}`, time: new Date().toISOString(), read: false, type: "payment" },
    })
    // Return the raw payment so callers can use the real ID (e.g. receipt download)
    return pay
  }, [state.invoices, state.payments])

  const addReminder = useCallback(async (data: { invoiceId: string; channel: Reminder["channel"] }) => {
    const inv = invoiceMapRef.current.get(data.invoiceId)
    const raw = await createCommEvent({
      invoice: data.invoiceId,
      customer: inv ? state.customers.find(c => c.id === inv.customerId)?.id : undefined,
      channel: data.channel,
    })
    const reminder = normalizeCommEvent(raw, inv?.number, inv?.customerName)
    const enriched: Reminder = {
      ...reminder,
      amount: inv?.balance ?? 0,
      dueDate: inv?.dueDate ?? "",
    }
    dispatch({ type: "SET_REMINDERS", reminders: [enriched, ...state.reminders] })
    dispatch({
      type: "ADD_NOTIF",
      notif: { id: `n${Date.now()}`, title: "Reminder scheduled", body: `${data.channel} to ${inv?.customerName ?? "customer"} — ${inv?.number ?? ""}`, time: new Date().toISOString(), read: false, type: "reminder" },
    })
  }, [state.reminders, state.customers])

  const markNotifRead = (id: string) => dispatch({ type: "MARK_NOTIF_READ", id })
  const markAllRead = () => dispatch({ type: "MARK_ALL_READ" })

  const value: Store = {
    ...state,
    refresh,
    addCustomer,
    bulkAddCustomers,
    addInvoice,
    addPayment,
    addReminder,
    markNotifRead,
    markAllRead,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
