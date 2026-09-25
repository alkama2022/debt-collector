import { useParams, Link, useSearchParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { formatCurrency, formatDate } from "../utils/format"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { getPublicPayInfo, publicInitializePayment, publicVerifyPayment } from "../services/live"
import { ConfettiBurst } from "../components/ui/confetti"

type PublicInvoice = {
  invoice_number: string
  customer_name: string
  due_date: string | null
  total: string
  balance: string
  currency: string
  status: string
  org_name: string
}

export default function PayInvoice() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const reference = search.get("reference") || search.get("trxref")
  const [inv, setInv] = useState<PublicInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState(false)
  const [verifyNote, setVerifyNote] = useState<string | null>(null)

  // Load public pay info (no auth) + handle Paystack callback verify
  useEffect(() => {
    if (!id) return
    // If returning from Paystack with reference, verify first (public endpoint — no auth needed)
    if (reference) {
      setVerifyNote("Verifying payment with Paystack…")
      publicVerifyPayment(reference).then(() => {
        setVerifyNote("Verified — updating invoice status…")
      }).catch(() => {
        setVerifyNote("Verification pending — balance will update automatically.")
      }).finally(() => {
        getPublicPayInfo(id)
          .then(data => { setInv(data); setSuccess(true) })
          .catch(() => setError("Invoice not found — ask the business for a new link."))
          .finally(() => setLoading(false))
      })
      return
    }
    getPublicPayInfo(id).then(setInv).catch(() => setError("Invoice not found or link has expired. Ask the business for a new link.")).finally(() => setLoading(false))
  }, [id, reference])

  const handlePay = async () => {
    if (!id || !inv) return
    if (Number(inv.balance) <= 0) return
    setPaying(true)
    try {
      // Use the public endpoint — works whether or not the customer is logged in
      const init = await publicInitializePayment(id)
      if (init.mock) {
        // Mock mode: verify immediately
        await publicVerifyPayment(init.reference).catch(() => {})
        setSuccess(true)
      } else if (init.authorization_url) {
        window.location.href = init.authorization_url
      }
    } catch (e: any) {
      setError(e?.data?.message || "Payment initialization failed. Please try again or contact the business.")
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">{verifyNote || "Loading invoice…"}</div>
  if (success) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <ConfettiBurst trigger={1} />
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl animate-bounce">✓</div>
        <h1 className="text-xl font-bold mt-4">Payment received 🎉</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Thank you — your payment for <b>{inv?.invoice_number}</b> of <b>{formatCurrency(Number(inv?.balance || 0), inv?.currency || "NGN")}</b> is being verified. {verifyNote || "Receipt will be sent via WhatsApp/SMS."}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">Powered by CollectNaija + Paystack. Balance auto-updated via webhook/signal — <code>Invoice.balance</code> recalculated, reminders cancelled, receipt generated.</p>
        <Link to="/" className="mt-6 inline-block text-sm text-brand-600 font-medium">Back to CollectNaija →</Link>
      </Card>
    </div>
  )
  if (error) return <div className="min-h-screen flex items-center justify-center p-6"><Card className="p-6 max-w-md w-full text-center"><p className="text-sm text-red-600 dark:text-red-400">{error}</p><Link to="/" className="mt-4 inline-block text-sm text-brand-600">Go home</Link></Card></div>

  const balance = Number(inv?.balance || 0)
  const currency = inv?.currency || "NGN"

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center text-xs font-bold">CN</div><span className="font-semibold">CollectNaija — Secure Pay</span></div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">Paystack secured</span>
        </div>
      </header>
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Card className="p-6 md:p-8">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold font-mono">{inv?.invoice_number}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{inv?.org_name || "CollectNaija Business"} — Due {inv?.due_date ? formatDate(inv.due_date) : "—"} — <span className="capitalize">{inv?.status}</span></p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Customer: {inv?.customer_name} • {currency}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${balance <= 0 ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300" : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800"}`}>{balance <= 0 ? "Paid" : `${formatCurrency(balance, currency)} due`}</span>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border flex justify-between items-center">
            <div><div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Amount due</div><div className="text-2xl font-bold mt-1">{formatCurrency(balance, currency)}</div><div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total {formatCurrency(Number(inv?.total || 0), currency)} • Auto-updates invoice balance on success</div></div>
            <div className="text-right text-xs text-slate-500 dark:text-slate-400">Invoice {inv?.invoice_number}<br />Powered by CollectNaija</div>
          </div>

          <div className="mt-6 space-y-3">
            <Button onClick={handlePay} disabled={paying || balance <= 0} className="w-full justify-center min-h-[48px] text-base">
              {balance <= 0 ? "Already paid" : paying ? "Initializing…" : `Pay ${formatCurrency(balance, currency)} with Paystack`}
            </Button>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Mock mode (no PAYSTACK_SECRET_KEY) → verifies instantly. Real mode → redirects to Paystack checkout, then webhook <code>/api/v1/webhooks/payments/paystack</code> marks successful and <code>signals.py</code> recalculates <code>balance = total - SUM(successful payments)</code>, sets status, cancels queued reminders, creates receipt.</p>
            <div className="flex gap-2">
              <a href={`https://wa.me/?text=${encodeURIComponent(`I want to pay ${inv?.invoice_number} — ${formatCurrency(balance, currency)}: ${window.location.href}`)}`} target="_blank" rel="noreferrer" className="flex-1 py-3 rounded-xl border bg-white dark:bg-slate-800 text-center text-sm font-medium">Share pay link on WhatsApp</a>
              <Link to="/" className="flex-1 py-3 rounded-xl border bg-slate-900 text-white text-center text-sm font-medium">Back home</Link>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800">
            Demo: When <code>PAYSTACK_SECRET_KEY</code> is set, click Pay → Paystack checkout → <code>charge.success</code> webhook → <code>webhooks/tasks.py</code> upserts <code>Payment(status=successful)</code> → <code>signals._ensure_receipt</code> + balance recalculated. Configure <code>PAYSTACK_WEBHOOK_SECRET</code> for HMAC verify, set <code>FRONTEND_URL</code>.
          </div>
        </Card>
        <p className="text-xs text-slate-400 text-center mt-4">CollectNaija © 2026 • Secure • Org-isolated • Audit logged • Webhook idempotent via <code>provider_ref</code></p>
      </div>
    </div>
  )
}
