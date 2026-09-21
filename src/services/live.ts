/**
 * live.ts — All API calls to the Django backend.
 * No mock fallbacks. Every function calls the real API.
 */
import { apiFetch } from "./api"
import type { Customer, Invoice, Payment, Reminder, Currency } from "../types"

export type Paginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ─── Raw backend shapes ───────────────────────────────────────────────────────

export type RawCustomer = {
  id: string
  customer_code: string
  name: string
  phone: string
  email: string
  outstanding: string
  overdue: string
  opt_out: boolean
  preferred_language?: string
  language_history?: { code: string; changed_at: string; changed_by?: string }[]
  created_at: string
}

export type LanguageInfo = {
  code: string
  name: string
  native_name: string
  locale: string
  active: boolean
}

export type OrgLanguageSettings = {
  dashboard_language: string
  default_customer_language: string
  ai_communication_mode: "use_customer_preferred" | "use_fallback" | "auto_detect"
  fallback_language: string
  supported_languages: string[]
}

export type DetectResult = {
  detected_language: string
  confidence: number
  alternatives?: { code: string; confidence: number }[]
}

export type CustomerLanguage = {
  customer_id: string
  preferred_language: string
  history: { code: string; changed_at: string; changed_by?: string }[]
}

export type ResolvedLanguage = {
  response_language: string
  source: "customer_preferred" | "fallback" | "auto_detected" | "org_default"
  detected?: string
  confidence?: number
}

export type RawInvoice = {
  id: string
  invoice_number: string
  customer: string          // UUID of customer
  status: string
  due_date: string | null
  subtotal: string
  discount: string
  tax: string
  total: string
  balance: string
  currency: string
  sent_at: string | null
  created_at: string
  items: RawInvoiceItem[]
}

export type RawInvoiceItem = {
  id: string
  name: string
  qty: string
  unit_price_minor: number  // price in kobo
  line_total: string
}

export type RawPayment = {
  id: string
  org: string
  invoice: string | null
  amount: string
  currency: string
  status: string
  provider: string
  provider_ref: string | null
  idempotency_key: string | null
  verified_at: string | null
  created_at: string
}

export type RawCommEvent = {
  id: string
  org: string
  invoice: string | null
  customer: string | null
  channel: string
  template_id: string
  status: string
  provider_msg_id: string
  idempotency_key: string | null
  scheduled_for: string | null
  sent_at: string | null
  cost_minor: number | null
  error_code: string
  created_at: string
}

export type RawAuditLog = {
  id: string
  actor: string | null
  action: string
  target_type: string
  target_id: string
  before: Record<string, unknown>
  after: Record<string, unknown>
  ip: string
  user_agent: string
  created_at: string
}

// ─── Normalizers ─────────────────────────────────────────────────────────────

export function normalizeCustomer(c: RawCustomer): Customer {
  return {
    id: c.id,
    customerId: c.customer_code,
    name: c.name,
    phone: c.phone,
    email: c.email,
    totalInvoiced: 0,
    totalPaid: 0,
    outstanding: Number(c.outstanding),
    overdue: Number(c.overdue),
    status: c.opt_out ? "archived" : "active",
    createdAt: c.created_at,
    preferredLanguage: c.preferred_language ?? (c as any).preferredLanguage ?? "en",
    languageHistory: c.language_history ?? (c as any).languageHistory ?? [],
  }
}

export function normalizeInvoice(i: RawInvoice, customerName?: string): Invoice {
  const total = Number(i.total)
  const balance = Number(i.balance)
  return {
    id: i.id,
    number: i.invoice_number,
    customerId: i.customer,
    customerName: customerName ?? i.customer,
    issueDate: i.created_at.slice(0, 10),
    dueDate: i.due_date ?? "",
    status: i.status as Invoice["status"],
    items: (i.items ?? []).map(it => ({
      id: it.id,
      description: it.name,
      quantity: Number(it.qty),
      unitPrice: it.unit_price_minor / 100,
    })),
    subtotal: Number(i.subtotal),
    discount: Number(i.discount),
    tax: Number(i.tax),
    total,
    amountPaid: total - balance,
    balance,
    currency: (i.currency || "NGN") as Currency,
  }
}

export function normalizePayment(p: RawPayment, invoiceNumber?: string, customerName?: string): Payment {
  return {
    id: p.id,
    invoiceId: p.invoice ?? "",
    invoiceNumber: invoiceNumber ?? "",
    customerName: customerName ?? "",
    amount: Number(p.amount),
    currency: (p.currency || "NGN") as Currency,
    method: p.provider,
    reference: p.provider_ref ?? p.id.slice(0, 8).toUpperCase(),
    status: p.status as Payment["status"],
    date: p.created_at.slice(0, 10),
  }
}

export function normalizeCommEvent(e: RawCommEvent, invoiceNumber?: string, customerName?: string): Reminder {
  return {
    id: e.id,
    customerName: customerName ?? "",
    invoiceNumber: invoiceNumber ?? "",
    amount: 0,
    dueDate: "",
    channel: e.channel as Reminder["channel"],
    status: e.status as Reminder["status"],
    sentAt: e.sent_at ?? undefined,
    scheduledAt: e.scheduled_for ?? e.created_at,
  }
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function listCustomers(q?: string): Promise<Paginated<RawCustomer>> {
  const params = new URLSearchParams()
  if (q) params.set("search", q)
  const qs = params.toString() ? `?${params}` : ""
  return apiFetch<Paginated<RawCustomer>>(`/customers${qs}`)
}

export async function createCustomer(payload: {
  name: string
  phone: string
  email?: string
  preferred_language?: string
}): Promise<RawCustomer> {
  return apiFetch<RawCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function bulkCreateCustomers(rows: { name: string; phone?: string; email?: string; preferred_language?: string }[]): Promise<{ created: number; failed: number; customers: RawCustomer[]; errors: any[] }> {
  const res = await apiFetch<{ success: boolean; data: { created: number; failed: number; customers: RawCustomer[]; errors: any[] }; message: string }>("/customers/bulk", {
    method: "POST",
    body: JSON.stringify({ customers: rows }),
  })
  return res.data
}

export async function getCustomer(id: string): Promise<RawCustomer> {
  return apiFetch<RawCustomer>(`/customers/${id}`)
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export async function listInvoices(params?: {
  status?: string
  customer?: string
  search?: string
}): Promise<Paginated<RawInvoice>> {
  const p = new URLSearchParams()
  if (params?.status && params.status !== "all") p.set("status", params.status)
  if (params?.customer) p.set("customer", params.customer)
  if (params?.search) p.set("search", params.search)
  const qs = p.toString() ? `?${p}` : ""
  return apiFetch<Paginated<RawInvoice>>(`/invoices${qs}`)
}

export async function createInvoice(payload: {
  customer: string
  due_date?: string
  currency?: string
  items: { name: string; qty: number; unit_price_minor: number }[]
}, idempotencyKey?: string): Promise<RawInvoice> {
  const headers: Record<string, string> = {}
  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey
  return apiFetch<RawInvoice>("/invoices", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })
}

export async function getInvoice(id: string): Promise<RawInvoice> {
  return apiFetch<RawInvoice>(`/invoices/${id}`)
}

// ─── Payments ────────────────────────────────────────────────────────────────

export async function listPayments(params?: {
  invoice?: string
  status?: string
}): Promise<Paginated<RawPayment>> {
  const p = new URLSearchParams()
  if (params?.invoice) p.set("invoice", params.invoice)
  if (params?.status) p.set("status", params.status)
  const qs = p.toString() ? `?${p}` : ""
  return apiFetch<Paginated<RawPayment>>(`/payments${qs}`)
}

export async function createPayment(payload: {
  invoice: string
  amount: string | number
  currency?: string
  provider?: string
  provider_ref?: string
}, idempotencyKey?: string): Promise<RawPayment> {
  const headers: Record<string, string> = {}
  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey
  return apiFetch<RawPayment>("/payments", {
    method: "POST",
    headers,
    body: JSON.stringify({
      currency: "NGN",
      provider: "manual",
      status: "successful",
      ...payload,
    }),
  })
}

// ─── Communication Events (Reminders) ────────────────────────────────────────

export async function listCommEvents(params?: {
  invoice?: string
  customer?: string
  channel?: string
}): Promise<Paginated<RawCommEvent>> {
  const p = new URLSearchParams()
  if (params?.invoice) p.set("invoice", params.invoice)
  if (params?.customer) p.set("customer", params.customer)
  if (params?.channel) p.set("channel", params.channel)
  const qs = p.toString() ? `?${p}` : ""
  return apiFetch<Paginated<RawCommEvent>>(`/comms/events${qs}`)
}

export async function createCommEvent(payload: {
  invoice?: string
  customer?: string
  channel: string
  template_id?: string
  scheduled_for?: string
}): Promise<RawCommEvent> {
  return apiFetch<RawCommEvent>("/comms/events", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// ─── Reminder Rules (S3 Auto-Reminder Engine) ──────────────────────────────────

export type RawRule = {
  id: string
  org: string
  name: string
  trigger: "before_due" | "on_due" | "after_due"
  offset_days: number
  channel: string
  template: string
  language: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export async function listReminderRules(): Promise<{ results: RawRule[] } | Paginated<RawRule>> {
  const res = await apiFetch<any>("/comms/rules")
  // DRF paginated or plain list
  if (Array.isArray(res)) return { results: res }
  if (res.results) return res
  return { results: res as any }
}

export async function createReminderRule(payload: Partial<RawRule>): Promise<RawRule> {
  return apiFetch<RawRule>("/comms/rules", { method: "POST", body: JSON.stringify(payload) })
}

export async function updateReminderRule(id: string, payload: Partial<RawRule>): Promise<RawRule> {
  return apiFetch<RawRule>(`/comms/rules/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
}

export async function deleteReminderRule(id: string): Promise<void> {
  await apiFetch<void>(`/comms/rules/${id}`, { method: "DELETE" })
}

export async function runReminderRule(id?: string): Promise<{ created: number; event_ids: string[]; message: string }> {
  const path = id ? `/comms/rules/${id}/run` : "/comms/rules/run-all"
  const res = await apiFetch<{ success: boolean; data: { created: number; event_ids: string[]; message: string } }>(path, { method: "POST" })
  return res.data
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export async function listAuditLogs(): Promise<Paginated<RawAuditLog>> {
  return apiFetch<Paginated<RawAuditLog>>("/audit/logs")
}

// ─── Dashboard aggregates (derived from invoices + payments) ─────────────────

export type DashboardStats = {
  totalOutstanding: number
  dueToday: number
  overdue: number
  collectedThisMonth: number
  invoiceCount: number
  customerCount: number
  paymentCount: number
  cashflow: { name: string; expected: number; collected: number; overdue: number }[]
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  // Fetch all in parallel
  const [invoicesRes, paymentsRes, customersRes] = await Promise.all([
    listInvoices(),
    listPayments(),
    listCustomers(),
  ])

  const invoices = invoicesRes.results
  const payments = paymentsRes.results
  const customers = customersRes.results

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const thisMonthPrefix = now.toISOString().slice(0, 7) // "YYYY-MM"

  const totalOutstanding = invoices
    .filter(i => i.status !== "paid" && i.status !== "cancelled")
    .reduce((a, i) => a + Number(i.balance), 0)

  const dueToday = invoices
    .filter(i => i.due_date === todayStr && i.status !== "paid")
    .reduce((a, i) => a + Number(i.balance), 0)

  const overdue = invoices
    .filter(i => i.status === "overdue")
    .reduce((a, i) => a + Number(i.balance), 0)

  const collectedThisMonth = payments
    .filter(p => p.status === "successful" && p.created_at.startsWith(thisMonthPrefix))
    .reduce((a, p) => a + Number(p.amount), 0)

  // Build a 7-day cashflow chart from payments data
  const cashflow = buildCashflow(invoices, payments, 7)

  return {
    totalOutstanding,
    dueToday,
    overdue,
    collectedThisMonth,
    invoiceCount: invoices.length,
    customerCount: customers.length,
    paymentCount: payments.length,
    cashflow,
  }
}

// ─── Languages & Org Language Settings ───────────────────────────────────────

function languageHeaders(): Record<string, string> {
  const orgLang = localStorage.getItem("cn_dashboard_lang") || localStorage.getItem("cn_lang") || "en"
  return { "X-Org-Language": orgLang, "Accept-Language": orgLang }
}

export async function liveListLanguages(): Promise<{ languages: LanguageInfo[] }> {
  // Backend: GET /languages  (versioned as /api/v1/languages via api.ts base)
  return apiFetch<{ languages: LanguageInfo[] }>("/languages", { headers: languageHeaders() })
}

export async function liveGetOrgLanguageSettings(): Promise<OrgLanguageSettings> {
  return apiFetch<OrgLanguageSettings>("/organizations/language-settings", { headers: languageHeaders() })
}

export async function liveUpdateOrgLanguageSettings(payload: Partial<OrgLanguageSettings>): Promise<OrgLanguageSettings> {
  return apiFetch<OrgLanguageSettings>("/organizations/language-settings", {
    method: "PATCH",
    headers: languageHeaders(),
    body: JSON.stringify(payload),
  })
}

export async function liveDetectLanguage(text: string): Promise<DetectResult> {
  return apiFetch<DetectResult>("/languages/detect", {
    method: "POST",
    headers: languageHeaders(),
    body: JSON.stringify({ text }),
  })
}

export async function liveGetCustomerLanguage(customerId: string): Promise<CustomerLanguage> {
  return apiFetch<CustomerLanguage>(`/customers/${customerId}/language`, { headers: languageHeaders() })
}

export async function liveUpdateCustomerLanguage(customerId: string, code: string): Promise<CustomerLanguage> {
  return apiFetch<CustomerLanguage>(`/customers/${customerId}/language`, {
    method: "PATCH",
    headers: languageHeaders(),
    body: JSON.stringify({ preferred_language: code }),
  })
}

export async function liveResolveResponseLanguage(params: {
  customerId?: string
  text?: string
}): Promise<ResolvedLanguage> {
  const p = new URLSearchParams()
  if (params.customerId) p.set("customer_id", params.customerId)
  if (params.text) p.set("text", params.text)
  const qs = p.toString() ? `?${p}` : ""
  return apiFetch<ResolvedLanguage>(`/languages/resolve${qs}`, { headers: languageHeaders() })
}

// ─── Invoices: PDF & Pay Link ────────────────────────────────────────────────

export async function getInvoicePayLink(invoiceId: string): Promise<{ pay_url: string; token: string; invoice_number: string; amount: string; currency: string; provider: string }> {
  const res = await apiFetch<{ success: boolean; data: { pay_url: string; token: string; invoice_number: string; amount: string; currency: string; provider: string } }>(`/invoices/${invoiceId}/pay-link`)
  return res.data
}

export async function getPublicPayInfo(invoiceId: string): Promise<{ invoice_number: string; customer_name: string; due_date: string | null; total: string; balance: string; currency: string; status: string; org_name: string }> {
  const res = await apiFetch<{ success: boolean; data: { invoice_number: string; customer_name: string; due_date: string | null; total: string; balance: string; currency: string; status: string; org_name: string } }>(`/public/pay/${invoiceId}`, { auth: false })
  return res.data
}

export async function initializePaystackPayment(invoiceId: string): Promise<{ authorization_url: string; reference: string; access_code: string; mock: boolean; pay_url: string }> {
  const res = await apiFetch<{ success: boolean; data: { authorization_url: string; reference: string; access_code: string; mock: boolean; pay_url: string } }>(`/payments/initialize`, { method: "POST", body: JSON.stringify({ invoice: invoiceId }) })
  return res.data
}

export async function verifyPaystackPayment(reference: string): Promise<{ payment_id: string; status: string; invoice_id: string; mock: boolean }> {
  const res = await apiFetch<{ success: boolean; data: { payment_id: string; status: string; invoice_id: string; mock: boolean } }>(`/payments/verify?reference=${encodeURIComponent(reference)}`)
  return res.data
}

export async function downloadInvoicePdf(invoiceId: string): Promise<Blob> {
  const token = localStorage.getItem("cn_token")
  const orgId = localStorage.getItem("cn_org_id")
  const headers: Record<string, string> = {}
  if (token) headers["Authorization"] = `Bearer ${token}`
  if (orgId) headers["X-Org-Id"] = orgId
  const orgLang = localStorage.getItem("cn_dashboard_lang") || localStorage.getItem("cn_lang") || "en"
  headers["X-Org-Language"] = orgLang
  headers["Accept-Language"] = orgLang
  const base = (await import("../config")).config.apiBaseUrl
  const res = await fetch(`${base}/invoices/${invoiceId}/pdf`, { headers })
  if (!res.ok) throw new Error("Failed to download invoice PDF")
  return res.blob()
}

export async function downloadReceiptPdf(paymentId: string): Promise<Blob> {
  const token = localStorage.getItem("cn_token")
  const orgId = localStorage.getItem("cn_org_id")
  const headers: Record<string, string> = {}
  if (token) headers["Authorization"] = `Bearer ${token}`
  if (orgId) headers["X-Org-Id"] = orgId
  const base = (await import("../config")).config.apiBaseUrl
  const res = await fetch(`${base}/payments/${paymentId}/receipt/pdf`, { headers })
  if (!res.ok) throw new Error("Failed to download receipt")
  return res.blob()
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function buildCashflow(
  invoices: RawInvoice[],
  payments: RawPayment[],
  days: number
): { name: string; expected: number; collected: number; overdue: number }[] {
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString("en-NG", { day: "numeric", month: "short" })

    const expected = invoices
      .filter(inv => inv.due_date === dateStr)
      .reduce((a, inv) => a + Number(inv.total), 0)

    const collected = payments
      .filter(p => p.status === "successful" && p.created_at.slice(0, 10) === dateStr)
      .reduce((a, p) => a + Number(p.amount), 0)

    const overdueDay = invoices
      .filter(inv => inv.due_date === dateStr && inv.status === "overdue")
      .reduce((a, inv) => a + Number(inv.balance), 0)

    result.push({ name: label, expected, collected, overdue: overdueDay })
  }
  return result
}
