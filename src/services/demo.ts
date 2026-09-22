/**
 * demo.ts — Seeds realistic Nigerian business data for first-time users.
 * Called after signup if the user has no customers yet.
 * All data goes through the real API — no localStorage mocking.
 */
import { apiFetch } from "./api"

const DEMO_CUSTOMERS = [
  { name: "Musa Ibrahim",     phone: "+2348031234567", email: "musa.ibrahim@gmail.com" },
  { name: "Fatima Abubakar",  phone: "+2348059876543", email: "fatima.a@yahoo.com" },
  { name: "Chinedu Okonkwo",  phone: "+2347012345678", email: "chinedu.ok@gmail.com" },
  { name: "Aisha Bello",      phone: "+2348098765432", email: "" },
  { name: "Tunde Adeyemi",    phone: "+2348154321098", email: "tunde.ade@business.com" },
  { name: "Ngozi Eze",        phone: "+2347065432109", email: "" },
]

const INVOICE_DESCS = [
  "School fees — Term 1 2026",
  "School fees — Term 2 2026",
  "Registration fee",
  "Development levy",
  "School uniform set",
  "After-school programme",
]

const TODAY = new Date()
const pastDate  = (d: number) => new Date(TODAY.getTime() - d * 86400000).toISOString().slice(0, 10)
const futureDate = (d: number) => new Date(TODAY.getTime() + d * 86400000).toISOString().slice(0, 10)

export async function seedDemoWorkspace(orgId: string): Promise<void> {
  // Check if already seeded
  const flag = localStorage.getItem(`cn_demo_seeded_${orgId}`)
  if (flag === "1") return

  try {
    // 1 — Create customers
    const createdCustomers: { id: string; name: string }[] = []
    for (const c of DEMO_CUSTOMERS) {
      try {
        const raw = await apiFetch<{ id: string; name: string }>("/customers", {
          method: "POST",
          body: JSON.stringify(c),
          orgId,
        })
        createdCustomers.push({ id: raw.id, name: raw.name })
      } catch { /* skip duplicates */ }
    }

    if (createdCustomers.length === 0) {
      localStorage.setItem(`cn_demo_seeded_${orgId}`, "1")
      return
    }

    // 2 — Create invoices with varied statuses
    const invoiceScenarios = [
      // Overdue — needs collection
      { custIdx: 0, amount: 85000,  desc: INVOICE_DESCS[0], dueDate: pastDate(14),  status: "overdue" },
      { custIdx: 1, amount: 55000,  desc: INVOICE_DESCS[1], dueDate: pastDate(7),   status: "overdue" },
      { custIdx: 2, amount: 125000, desc: INVOICE_DESCS[0], dueDate: pastDate(21),  status: "overdue" },
      // Due soon
      { custIdx: 3, amount: 85000,  desc: INVOICE_DESCS[0], dueDate: futureDate(2), status: "sent" },
      { custIdx: 4, amount: 45000,  desc: INVOICE_DESCS[2], dueDate: futureDate(5), status: "sent" },
      // Already paid
      { custIdx: 5, amount: 85000,  desc: INVOICE_DESCS[0], dueDate: pastDate(30),  status: "paid" },
      { custIdx: 0, amount: 12000,  desc: INVOICE_DESCS[4], dueDate: pastDate(20),  status: "paid" },
    ]

    const createdInvoices: { id: string; balance: number; custName: string }[] = []

    for (let i = 0; i < invoiceScenarios.length; i++) {
      const s = invoiceScenarios[i]
      const cust = createdCustomers[s.custIdx]
      if (!cust) continue
      try {
        const amountKobo = Math.round(s.amount * 100)
        const raw = await apiFetch<{ id: string; balance: string }>(
          "/invoices",
          {
            method: "POST",
            headers: { "X-Idempotency-Key": `demo-${orgId}-inv-${i}` },
            body: JSON.stringify({
              customer: cust.id,
              due_date: s.dueDate,
              currency: "NGN",
              items: [{ name: s.desc, qty: 1, unit_price_minor: amountKobo }],
            }),
            orgId,
          }
        )
        createdInvoices.push({
          id: raw.id,
          balance: Number(raw.balance),
          custName: cust.name,
        })
      } catch { /* skip */ }
    }

    // 3 — Record payments for "paid" invoices (last 2)
    const paidInvoices = createdInvoices.slice(-2)
    for (let i = 0; i < paidInvoices.length; i++) {
      const inv = paidInvoices[i]
      try {
        await apiFetch("/payments", {
          method: "POST",
          headers: { "X-Idempotency-Key": `demo-${orgId}-pay-${i}` },
          body: JSON.stringify({
            invoice: inv.id,
            amount: inv.balance.toFixed(2),
            currency: "NGN",
            provider: "Bank transfer",
            provider_ref: `DEMO-PAY-${String(i + 1).padStart(4, "0")}`,
            status: "successful",
          }),
          orgId,
        })
      } catch { /* skip */ }
    }

    // 4 — Create default reminder rules
    const defaultRules = [
      { name: "7 days before due",  trigger: "before_due", offset_days: 7,  channel: "whatsapp" },
      { name: "On due date",        trigger: "on_due",     offset_days: 0,  channel: "whatsapp" },
      { name: "3 days overdue",     trigger: "after_due",  offset_days: 3,  channel: "sms" },
      { name: "7 days overdue",     trigger: "after_due",  offset_days: 7,  channel: "whatsapp" },
    ]
    for (const rule of defaultRules) {
      await apiFetch("/comms/rules", {
        method: "POST",
        body: JSON.stringify({ ...rule, enabled: true }),
        orgId,
      }).catch(() => {})
    }

    localStorage.setItem(`cn_demo_seeded_${orgId}`, "1")
  } catch (err) {
    // Silently fail — demo seed is non-critical
    console.warn("[demo] Seed failed:", err)
  }
}
