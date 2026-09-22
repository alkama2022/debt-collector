import { useParams, Link } from "react-router-dom"
import { useStore } from "../services/store"
import { formatCurrency, formatDate } from "../utils/format"
import { Card } from "../components/ui/card"
import { StatusBadge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/toast"
import { Skeleton } from "../components/ui/skeleton"
import { useState } from "react"
import { getInvoicePayLink, downloadInvoicePdf, triggerBlobDownload } from "../services/live"

export default function InvoiceDetail() {
  const { id } = useParams()
  const { invoices, payments, loading } = useStore()
  const { push } = useToast()
  const [downloading, setDownloading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [payUrl, setPayUrl] = useState<string | null>(null)

  const handleDownload = async (invoiceId: string, number: string) => {
    if (downloading) return
    setDownloading(true)
    try {
      const blob = await downloadInvoicePdf(invoiceId)
      triggerBlobDownload(blob, `${number}.pdf`)
      push("Invoice PDF downloaded — backend-generated", "success")
    } catch {
      push("Failed to download PDF — check auth / backend running", "error")
    } finally {
      setDownloading(false)
    }
  }

  const handleShareWhatsApp = async (invoiceId: string, number: string, customerName: string, balance: number, currency: string) => {
    if (sharing) return
    setSharing(true)
    try {
      let url = payUrl
      if (!url) {
        const data = await getInvoicePayLink(invoiceId)
        url = data.pay_url
        setPayUrl(url)
      }
      const amount = formatCurrency(balance, currency as any)
      const msg = `Hello ${customerName}, invoice ${number} for ${amount} is due. Pay securely here: ${url} — Thank you!`
      const wa = `https://wa.me/?text=${encodeURIComponent(msg)}`
      window.open(wa, "_blank")
      await navigator.clipboard?.writeText(url).catch(() => {})
      push("WhatsApp opened — pay link copied", "success")
    } catch {
      push("Failed to create pay link — check backend", "error")
    } finally {
      setSharing(false)
    }
  }

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )

  const inv = invoices.find(i => i.id === id)
  if (!inv) return (
    <div className="space-y-3">
      <Link to="/invoices" className="text-sm text-slate-600 dark:text-slate-400 hover:underline">← Back to invoices</Link>
      <div className="text-sm text-slate-500 dark:text-slate-400 p-8 text-center">Invoice not found.</div>
    </div>
  )

  const pays = payments.filter(p => p.invoiceId === inv.id)

  return (
    <div className="space-y-4">
      <Link to="/invoices" className="text-sm text-slate-600 dark:text-slate-400 hover:underline">← Back to invoices</Link>

      <Card className="p-6">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold font-mono">{inv.number}</h1>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {inv.customerName} — Due {formatDate(inv.dueDate)} — {inv.balance === 0 ? "Paid in full" : `${formatCurrency(inv.balance)} due`}
            </div>
            <div className="mt-2"><StatusBadge status={inv.status} /></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => { navigator.clipboard?.writeText(inv.number); push("Invoice number copied", "success") }}>
              Copy
            </Button>
            <Button variant="secondary" onClick={() => handleDownload(inv.id, inv.number)} disabled={downloading}>
              {downloading ? "Downloading…" : "Download PDF"}
            </Button>
            <Button onClick={() => handleShareWhatsApp(inv.id, inv.number, inv.customerName, inv.balance, inv.currency)} disabled={sharing || inv.balance <= 0}>
              {sharing ? "Opening…" : "Share on WhatsApp"}
            </Button>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Pay link: {payUrl ? <a href={payUrl} target="_blank" rel="noreferrer" className="text-brand-600 underline">{payUrl}</a> : <button onClick={() => getInvoicePayLink(inv.id).then(d => setPayUrl(d.pay_url)).catch(() => push("Login required for pay link", "error"))} className="text-brand-600 underline">Generate pay link</button>} • Link is pay/collectnaija + Paystack when configured
          </div>
        </div>

        {/* Line items */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 dark:text-slate-400 border-b">
              <tr>
                <th className="text-left py-2">Description</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Unit</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map(it => (
                <tr key={it.id} className="border-b">
                  <td className="py-3">{it.description}</td>
                  <td className="text-right">{it.quantity}</td>
                  <td className="text-right">{formatCurrency(it.unitPrice)}</td>
                  <td className="text-right font-medium">{formatCurrency(it.quantity * it.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <div className="w-full md:w-72 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Subtotal</span><span>{formatCurrency(inv.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Discount</span><span>-{formatCurrency(inv.discount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Tax</span><span>{formatCurrency(inv.tax)}</span></div>
            <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>{formatCurrency(inv.total)}</span></div>
            <div className="flex justify-between text-emerald-700 dark:text-emerald-300"><span>Amount paid</span><span>{formatCurrency(inv.amountPaid)}</span></div>
            <div className="flex justify-between font-bold text-brand-600 text-base"><span>Balance</span><span>{formatCurrency(inv.balance)}</span></div>
          </div>
        </div>
      </Card>

      {/* Payments on this invoice */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Payments</h3>
          <Link to="/payments" className="text-xs text-brand-600">Record payment</Link>
        </div>
        <div className="mt-3 space-y-2">
          {pays.length ? pays.map(p => (
            <div key={p.id} className="flex justify-between p-3 rounded-xl border">
              <div>
                <div className="text-sm font-medium">{p.reference} — {p.method}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{formatDate(p.date)}</div>
              </div>
              <div className="font-medium">{formatCurrency(p.amount)}</div>
            </div>
          )) : (
            <div className="text-sm text-slate-500 dark:text-slate-400 p-4 border border-dashed rounded-xl text-center">
              No payments yet — record one from Payments.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
