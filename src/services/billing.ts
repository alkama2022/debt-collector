import { apiFetch } from "./api"

export type Plan = {
  id: string
  name: string
  slug: string
  description: string
  price: string
  currency: string
  billing_interval: string
  trial_days: number
  sort_order: number
  is_enterprise: boolean
  limits: { key: string; limit_value: number | null; period: string }[]
  plan_features: { feature: { slug: string; name: string; category: string }; enabled: boolean }[]
}

export type Entitlements = {
  subscription: { id: string; plan: string; plan_name: string; status: string; price: string; currency: string; billing_interval: string; current_period_end: string | null; overage_policy: string }
  features: Record<string, { enabled: boolean; reason: string }>
  limits: Record<string, { limit: number | null; used: number; remaining: number | null; pct: number | null }>
  usage: Record<string, { quantity: number; cost_minor: number }>
}

export async function getPlans(): Promise<Plan[]> {
  const res = await apiFetch<{ results: Plan[] } | Plan[]>("/billing/plans")
  if (Array.isArray(res)) return res
  return (res as any).results ?? res
}
export async function getEntitlements(): Promise<Entitlements> {
  return apiFetch<Entitlements>("/billing/entitlements")
}
export async function getSubscription(): Promise<any> {
  return apiFetch<any>("/billing/subscription")
}
export async function subscribe(plan: string, coupon?: string) {
  return apiFetch<any>("/billing/subscribe", { method: "POST", body: JSON.stringify({ plan, coupon }) })
}
export async function upgrade(plan: string) {
  return apiFetch<any>("/billing/upgrade", { method: "POST", body: JSON.stringify({ plan }) })
}
export async function downgrade(plan: string) {
  return apiFetch<any>("/billing/downgrade", { method: "POST", body: JSON.stringify({ plan }) })
}
export async function cancel(mode: "period_end" | "immediate" = "period_end") {
  return apiFetch<any>("/billing/cancel", { method: "POST", body: JSON.stringify({ mode }) })
}
export async function reactivate() {
  return apiFetch<any>("/billing/reactivate", { method: "POST" })
}
export async function getUsage() {
  return apiFetch<any>("/billing/usage")
}
export async function getUsageHistory(params?: Record<string,string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : ""
  return apiFetch<any>(`/billing/usage/history${qs}`)
}
export async function getInvoices() {
  return apiFetch<any>("/billing/invoices")
}
export async function getTransactions() {
  return apiFetch<any>("/billing/transactions")
}
export async function getPaymentMethods() {
  return apiFetch<any>("/billing/payment-methods")
}
export async function getCredits() {
  return apiFetch<any>("/billing/credits")
}
export async function purchaseCredits(type: string, quantity: number, price_minor?: number) {
  return apiFetch<any>("/billing/credits", { method: "POST", body: JSON.stringify({ type, quantity, price_minor }) })
}
export async function validateCoupon(code: string, plan?: string) {
  return apiFetch<any>("/billing/coupons/validate", { method: "POST", body: JSON.stringify({ code, plan }) })
}
export async function updateOveragePolicy(policy: string) {
  return apiFetch<any>("/billing/overage-policy", { method: "POST", body: JSON.stringify({ overage_policy: policy }) })
}
export async function getUnitEconomics() {
  return apiFetch<any>("/billing/unit-economics")
}
export async function getAdminBilling() {
  return apiFetch<any>("/admin/billing")
}
export async function getReferrals() {
  return apiFetch<any>("/billing/referrals")
}
