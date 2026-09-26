import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Input, Select } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/toast"
import { useAuth } from "../hooks/useAuth"
import { apiFetch, track } from "../services/api"

const STEPS = ["Business", "Type", "Location", "Currency", "Size", "Tracking", "Customer", "Invoice"]

const COUNTRY_MAP: Record<string, string> = {
  Nigeria: "NG",
  Ghana: "GH",
  Kenya: "KE",
  "South Africa": "ZA",
}

export default function Onboarding() {
  const nav = useNavigate()
  const { push } = useToast()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    type: "school",
    country: "Nigeria",
    currency: "NGN",
    size: "11-50",
    tracking: "Notebook / WhatsApp",
    custName: "",
    custPhone: "",
    invAmount: "75000",
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const finish = async () => {
    setSaving(true)
    try {
      // Determine whether the user already has an org (created during signup).
      // If yes: PATCH it with the onboarding details instead of creating a second one.
      const existingOrgId = user?.org?.id || localStorage.getItem("cn_org_id")

      let org: { id: string; name: string; slug: string; currency: string; country: string }

      const orgPayload = {
        name: form.name || `${user?.name || "My"} Business`,
        country: COUNTRY_MAP[form.country] || "NG",
        currency: form.currency,
        timezone: "Africa/Lagos",
      }

      if (existingOrgId) {
        // PATCH the existing org — no second org created
        const res = await apiFetch<{ success: boolean; data: typeof org }>(
          `/organizations/${existingOrgId}`,
          { method: "PATCH", body: JSON.stringify(orgPayload) }
        )
        org = res.data
      } else {
        // No org yet (edge case) — create one
        const res = await apiFetch<{ success: boolean; data: typeof org }>(
          "/organizations",
          { method: "POST", body: JSON.stringify(orgPayload) }
        )
        org = res.data
      }

      // Persist org id so all subsequent requests use it
      localStorage.setItem("cn_org_id", org.id)

      // Step 2 — Create first customer (if provided)
      let customerId: string | null = null
      if (form.custName && form.custPhone) {
        try {
          const cust = await apiFetch<{ id: string }>("/customers", {
            method: "POST",
            body: JSON.stringify({ name: form.custName, phone: form.custPhone }),
            orgId: org.id,
          })
          customerId = cust.id
        } catch {
          // Non-critical — skip if customer creation fails
        }
      }

      // Step 3 — Create default reminder rules for the org
      try {
        const defaultRules = [
          { name: "7 days before due", trigger: "before_due", offset_days: 7, channel: "whatsapp", enabled: true },
          { name: "2 days before due", trigger: "before_due", offset_days: 2, channel: "whatsapp", enabled: true },
          { name: "On due date", trigger: "on_due", offset_days: 0, channel: "whatsapp", enabled: true },
          { name: "3 days overdue", trigger: "after_due", offset_days: 3, channel: "whatsapp", enabled: true },
          { name: "7 days overdue", trigger: "after_due", offset_days: 7, channel: "sms", enabled: true },
          { name: "14 days overdue", trigger: "after_due", offset_days: 14, channel: "email", enabled: true },
        ]
        for (const rule of defaultRules) {
          await apiFetch("/comms/rules", {
            method: "POST",
            body: JSON.stringify(rule),
            orgId: org.id,
          }).catch(() => {})
        }
      } catch {
        // Non-critical
      }

      // Step 4 — Create first invoice (if customer and amount provided)
      if (customerId && form.invAmount) {
        const amount = Number(form.invAmount.replace(/[^0-9]/g, ""))
        if (amount > 0) {
          try {
            await apiFetch("/invoices", {
              method: "POST",
              headers: { "X-Idempotency-Key": `onboarding-${org.id}-first-invoice` },
              body: JSON.stringify({
                customer: customerId,
                currency: form.currency,
                items: [{ name: "Service fee", qty: 1, unit_price_minor: amount * 100 }],
              }),
              orgId: org.id,
            })
          } catch {
            // Non-critical
          }
        }
      }

      track("onboarding_completed", { org_id: org.id, business_type: form.type })
      localStorage.setItem("cn_onboarded", "1")
      // Clear the demo-seeded flag so DemoSeeder runs on next dashboard visit
      localStorage.removeItem(`cn_demo_seeded_${org.id}`)

      // Update stored user with real org info
      const stored = localStorage.getItem("cn_user")
      if (stored) {
        try {
          const u = JSON.parse(stored)
          u.org = { id: org.id, name: org.name, type: form.type, country: org.country, currency: org.currency }
          localStorage.setItem("cn_user", JSON.stringify(u))
        } catch {}
      }

      push("Your workspace is ready — welcome to CollectNaija!", "success")
      nav("/dashboard")
    } catch (err: any) {
      const msg = err?.data?.message || err?.data?.name?.[0] || "Setup failed — please try again"
      push(msg, "error")
    } finally {
      setSaving(false)
    }
  }

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      finish()
    }
  }

  const back = () => {
    if (step > 0) setStep(s => s - 1)
    else nav("/signup")
  }

  return (
    <div className="min-h-screen-dvh bg-[#f8fafc] flex flex-col">
      <div className="max-w-2xl mx-auto w-full px-5 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link to="/" className="font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center text-xs font-bold">CN</div>
            CollectNaija
          </Link>
          <span className="text-xs text-slate-500">Step {step + 1} of {STEPS.length} — {STEPS[step]}</span>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Card */}
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          {step === 0 && (
            <>
              <h2 className="text-lg font-semibold">What is your business name?</h2>
              <p className="text-sm text-slate-600 mt-1">This appears on invoices and receipts.</p>
              <div className="mt-4">
                <Input
                  label="Business name"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  placeholder="e.g. Al-Hikma Private School"
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold">Business type</h2>
              <div className="mt-4">
                <Select
                  label="Type"
                  value={form.type}
                  onChange={e => set("type", e.target.value)}
                  options={[
                    { value: "school", label: "Private school" },
                    { value: "cooperative", label: "Cooperative / Thrift society" },
                    { value: "retail", label: "Retail / Wholesale" },
                    { value: "services", label: "Services / Consulting" },
                    { value: "healthcare", label: "Healthcare / Clinic" },
                    { value: "property", label: "Property / Landlord" },
                    { value: "other", label: "Other" },
                  ]}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-semibold">Where is your business?</h2>
              <div className="mt-4">
                <Select
                  label="Country"
                  value={form.country}
                  onChange={e => set("country", e.target.value)}
                  options={[
                    { value: "Nigeria", label: "🇳🇬 Nigeria" },
                    { value: "Ghana", label: "🇬🇭 Ghana" },
                    { value: "Kenya", label: "🇰🇪 Kenya" },
                    { value: "South Africa", label: "🇿🇦 South Africa" },
                  ]}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-lg font-semibold">What currency do you use?</h2>
              <div className="mt-4">
                <Select
                  label="Currency"
                  value={form.currency}
                  onChange={e => set("currency", e.target.value)}
                  options={[
                    { value: "NGN", label: "NGN — Nigerian Naira (₦)" },
                    { value: "GHS", label: "GHS — Ghana Cedi (₵)" },
                    { value: "KES", label: "KES — Kenyan Shilling (KSh)" },
                    { value: "USD", label: "USD — US Dollar ($)" },
                  ]}
                />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-lg font-semibold">How many customers do you have?</h2>
              <div className="mt-4">
                <Select
                  label="Customer count"
                  value={form.size}
                  onChange={e => set("size", e.target.value)}
                  options={[
                    { value: "1-10", label: "1–10 customers" },
                    { value: "11-50", label: "11–50 customers" },
                    { value: "51-200", label: "51–200 customers" },
                    { value: "200+", label: "200+ customers" },
                  ]}
                />
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="text-lg font-semibold">How do you currently track payments?</h2>
              <p className="text-sm text-slate-600 mt-1">No judgement — just helps us set things up for you.</p>
              <div className="mt-4">
                <Select
                  label="Current method"
                  value={form.tracking}
                  onChange={e => set("tracking", e.target.value)}
                  options={[
                    { value: "Notebook / WhatsApp", label: "Notebook / WhatsApp messages" },
                    { value: "Excel", label: "Excel / Google Sheets" },
                    { value: "Other app", label: "Another app" },
                    { value: "Nothing yet", label: "Nothing yet — starting fresh" },
                  ]}
                />
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <h2 className="text-lg font-semibold">Add your first customer</h2>
              <p className="text-sm text-slate-600 mt-1">
                Optional — skip if you prefer to{" "}
                <Link to="/customers" className="text-brand-600 underline">import from CSV</Link>{" "}
                after setup.
              </p>
              <div className="mt-4 space-y-3">
                <Input
                  label="Customer name"
                  value={form.custName}
                  onChange={e => set("custName", e.target.value)}
                  placeholder="e.g. Musa Ibrahim"
                />
                <Input
                  label="Phone number"
                  value={form.custPhone}
                  onChange={e => set("custPhone", e.target.value)}
                  placeholder="e.g. 0803 123 4567"
                />
              </div>
              <div className="mt-3 p-3 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-800">
                💡 Have many customers? Use Customers → Import CSV after setup. Up to 500 at once.
              </div>
            </>
          )}

          {step === 7 && (
            <>
              <h2 className="text-lg font-semibold">Create your first invoice</h2>
              <p className="text-sm text-slate-600 mt-1">Optional — you can do this from the Invoices page too.</p>
              <div className="mt-4">
                <Input
                  label={`Amount (${form.currency})`}
                  value={form.invAmount}
                  onChange={e => set("invAmount", e.target.value)}
                  placeholder="75000"
                />
              </div>
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border text-xs text-slate-600">
                ✅ When you click Finish, CollectNaija will:
                <ul className="mt-1.5 space-y-1 ml-3">
                  <li>• Create your organisation workspace</li>
                  <li>• Set up 6 default reminder rules (7 days before → 14 days after)</li>
                  {form.custName && <li>• Add {form.custName} as your first customer</li>}
                  {form.invAmount && form.custName && <li>• Create a {form.currency} {Number(form.invAmount.replace(/[^0-9]/g, "")).toLocaleString()} invoice</li>}
                </ul>
              </div>
            </>
          )}

          <div className="mt-6 flex justify-between">
            <Button variant="secondary" onClick={back} disabled={saving}>
              Back
            </Button>
            <Button onClick={next} disabled={saving}>
              {saving ? "Setting up…" : step === STEPS.length - 1 ? "Finish — Start collecting" : "Continue"}
            </Button>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500 text-center">
          Your data is saved to the server — secure, multi-tenant, org-scoped.
        </p>
      </div>
    </div>
  )
}
