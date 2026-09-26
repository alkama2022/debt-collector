import { useState, useEffect, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { formatCurrency } from "../utils/format"
import { useAuth } from "../hooks/useAuth"
import { useStore } from "../services/store"
import { fetchDashboardStats, type DashboardStats, createCommEvent } from "../services/live"
import { apiFetch } from "../services/api"
import { Card } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/toast"
import { Skeleton, StatSkeleton } from "../components/ui/skeleton"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import {
  MessageCircle, Send, Bell, TrendingUp, TrendingDown,
  Clock, CheckCircle, AlertTriangle, Users, FileText,
  CreditCard, BarChart3, Star
} from "lucide-react"

// ─── Collection Score ─────────────────────────────────────────────────────────
function CollectionScore({ rate }: { rate: number }) {
  const color = rate >= 75 ? "text-emerald-600" : rate >= 50 ? "text-amber-600" : "text-red-600"
  const bg    = rate >= 75 ? "bg-emerald-50 border-emerald-200" : rate >= 50 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"
  const label = rate >= 75 ? "Great" : rate >= 50 ? "Good" : "Needs work"
  const msg   = rate >= 75
    ? "You're collecting well. Keep sending reminders on time."
    : rate >= 50
    ? "More than half collected. Focus on the overdue accounts below."
    : "Several invoices are overdue. Use bulk reminders to follow up today."

  // Arc calculation (SVG)
  const r = 38, cx = 50, cy = 50
  const circ = 2 * Math.PI * r
  const pct = Math.min(rate / 100, 1)
  const dash = pct * circ

  return (
    <Card className={`p-5 border ${bg} flex items-center gap-4`}>
      <svg width="100" height="60" viewBox="0 0 100 60" className="shrink-0">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={rate >= 75 ? "#059669" : rate >= 50 ? "#d97706" : "#dc2626"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash / 2} ${circ}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x="50" y="52" textAnchor="middle" fontSize="14" fontWeight="700" fill={rate >= 75 ? "#059669" : rate >= 50 ? "#d97706" : "#dc2626"}>
          {rate}%
        </text>
      </svg>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Collection Score</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${bg} ${color}`}>{label}</span>
        </div>
        <p className="text-xs text-slate-600 mt-1 max-w-xs">{msg}</p>
      </div>
    </Card>
  )
}

// ─── WhatsApp Share Button ────────────────────────────────────────────────────
export function WhatsAppShareInvoice({ invoice, orgName }: { invoice: any; orgName?: string }) {
  const { push } = useToast()

  const shareViaWhatsApp = async () => {
    // Try to get a real pay link from the backend
    let payUrl = `${window.location.origin}/pay/${invoice.id}`
    try {
      const res = await apiFetch<{ success: boolean; data: { pay_url: string } }>(
        `/invoices/${invoice.id}/pay-link`
      )
      if (res?.data?.pay_url) payUrl = res.data.pay_url
    } catch { /* use fallback */ }

    const phone = invoice.customerPhone || ""
    const msg = [
      `Hello ${invoice.customerName},`,
      ``,
      `This is a payment reminder from ${orgName || "your business"}.`,
      ``,
      `📄 Invoice: ${invoice.number}`,
      `💰 Amount due: ${formatCurrency(invoice.balance)}`,
      `📅 Due date: ${invoice.dueDate || "As agreed"}`,
      ``,
      `Pay securely here:`,
      payUrl,
      ``,
      `Thank you 🙏`,
    ].join("\n")

    const encoded = encodeURIComponent(msg)
    const url = phone
      ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`

    window.open(url, "_blank", "noopener")
    push("WhatsApp opened with message ready to send", "success")
  }

  return (
    <button
      onClick={shareViaWhatsApp}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366] text-white text-xs font-semibold hover:bg-[#1fb855] transition min-h-[36px]"
      title="Send via WhatsApp"
    >
      <MessageCircle className="w-3.5 h-3.5" />
      WhatsApp
    </button>
  )
}

// ─── Today View ───────────────────────────────────────────────────────────────
function TodayView({ invoices, payments, onSendAll }: {
  invoices: any[]
  payments: any[]
  onSendAll: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const { user } = useAuth()

  const dueToday    = invoices.filter(i => i.dueDate === today && i.balance > 0)
  const overdue     = invoices.filter(i => i.status === "overdue" && i.balance > 0).slice(0, 5)
  const paidToday   = payments.filter(p => p.status === "successful" && p.date === today)
  const totalOverdue = invoices.filter(i => i.status === "overdue").length

  if (dueToday.length === 0 && overdue.length === 0 && paidToday.length === 0) {
    return (
      <Card className="p-8 text-center border border-dashed">
        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
        <h3 className="font-semibold">All clear for today</h3>
        <p className="text-sm text-slate-500 mt-1">No invoices due today and no overdue accounts. Well done.</p>
        <Link to="/invoices" className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand-600 font-medium hover:underline">
          <FileText className="w-4 h-4" /> Create an invoice
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* Payments received today */}
      {paidToday.length > 0 && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
            <CheckCircle className="w-4 h-4" />
            {paidToday.length} payment{paidToday.length > 1 ? "s" : ""} received today
            — {formatCurrency(paidToday.reduce((a, p) => a + p.amount, 0))}
          </div>
          <div className="mt-2 space-y-1">
            {paidToday.slice(0, 3).map(p => (
              <div key={p.id} className="text-xs text-emerald-800">
                ✓ {p.customerName} — {formatCurrency(p.amount)} via {p.method}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Due today */}
      {dueToday.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Due today ({dueToday.length})
            </div>
          </div>
          <div className="space-y-2">
            {dueToday.map(inv => (
              <TodayRow key={inv.id} inv={inv} orgName={user?.org?.name} tone="amber" />
            ))}
          </div>
        </div>
      )}

      {/* Overdue */}
      {overdue.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              Overdue ({totalOverdue})
            </div>
            {totalOverdue > 1 && (
              <button
                onClick={onSendAll}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
              >
                <Send className="w-3 h-3" />
                Send all {totalOverdue} reminders
              </button>
            )}
          </div>
          <div className="space-y-2">
            {overdue.map(inv => (
              <TodayRow key={inv.id} inv={inv} orgName={user?.org?.name} tone="red" />
            ))}
            {totalOverdue > 5 && (
              <Link to="/invoices?status=overdue" className="block text-xs text-center text-slate-500 hover:text-slate-800 py-2">
                +{totalOverdue - 5} more overdue invoices →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TodayRow({ inv, orgName, tone }: { inv: any; orgName?: string; tone: "amber" | "red" }) {
  const bg = tone === "red" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${bg} gap-2`}>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{inv.customerName}</div>
        <div className="text-xs text-slate-600">
          {inv.number} — {formatCurrency(inv.balance)}
          {inv.dueDate && ` — due ${inv.dueDate}`}
        </div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <WhatsAppShareInvoice invoice={inv} orgName={orgName} />
        <Link
          to={`/invoices/${inv.id}`}
          className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium hover:bg-slate-50 min-h-[36px] flex items-center"
        >
          View
        </Link>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const { customers, invoices, payments, addReminder, refresh } = useStore()
  const { push } = useToast()
  const nav = useNavigate()
  const [view, setView] = useState<"today" | "overview">("today")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [sendingAll, setSendingAll] = useState(false)

  useEffect(() => {
    fetchDashboardStats()
      .then(s => setStats(s))
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false))
  }, [invoices, payments])

  // Collection score
  const collectionScore = useMemo(() => {
    const total = invoices.filter(i => i.status !== "draft").length
    if (!total) return 0
    const paid = invoices.filter(i => i.status === "paid").length
    return Math.round((paid / total) * 100)
  }, [invoices])

  // Streak
  const streak = useMemo(() => {
    const days = new Set(payments.filter(p => p.status === "successful").map(p => p.date))
    if (!days.size) return 0
    let count = 0
    const d = new Date()
    for (let i = 0; i < 30; i++) {
      if (days.has(d.toISOString().slice(0, 10))) count++
      else if (count > 0) break
      d.setDate(d.getDate() - 1)
    }
    return count
  }, [payments])

  const overdueInvoices = invoices.filter(i => i.status === "overdue" && i.balance > 0)

  const handleSendAllOverdue = async () => {
    if (overdueInvoices.length === 0) return
    setSendingAll(true)
    let sent = 0
    for (const inv of overdueInvoices) {
      try {
        await addReminder({ invoiceId: inv.id, channel: "whatsapp" })
        sent++
      } catch { /* skip failed */ }
    }
    push(
      `${sent} WhatsApp reminder${sent !== 1 ? "s" : ""} queued for all overdue customers`,
      "success"
    )
    setSendingAll(false)
  }

  const hour = new Date().getHours()
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  if (loadingStats) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <StatSkeleton key={i} />)}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {greet}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
              Live
            </span>
            {streak > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
                🔥 {streak}-day streak
              </span>
            )}
            <span className="text-sm text-slate-500">{user?.org?.name}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/invoices" className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold min-h-[44px] inline-flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> Create Invoice
          </Link>
        </div>
      </div>

      {/* Collection Score */}
      {invoices.length > 0 && <CollectionScore rate={collectionScore} />}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-medium">
            <TrendingDown className="w-3.5 h-3.5" /> Outstanding
          </div>
          <div className="text-xl font-bold mt-2">{formatCurrency(stats?.totalOutstanding ?? 0)}</div>
          <div className="text-xs text-slate-500 mt-1">{stats?.customerCount ?? 0} customers</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-amber-600 uppercase font-medium">
            <Clock className="w-3.5 h-3.5" /> Due Today
          </div>
          <div className="text-xl font-bold mt-2">{formatCurrency(stats?.dueToday ?? 0)}</div>
          <div className="text-xs text-amber-600 mt-1">
            {invoices.filter(i => i.dueDate === new Date().toISOString().slice(0, 10) && i.balance > 0).length} invoices
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-red-600 uppercase font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> Overdue
          </div>
          <div className="text-xl font-bold mt-2 text-red-600">{formatCurrency(stats?.overdue ?? 0)}</div>
          <div className="text-xs text-red-600 mt-1">{overdueInvoices.length} accounts</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-emerald-600 uppercase font-medium">
            <TrendingUp className="w-3.5 h-3.5" /> Collected
          </div>
          <div className="text-xl font-bold mt-2 text-emerald-600">{formatCurrency(stats?.collectedThisMonth ?? 0)}</div>
          <div className="text-xs text-slate-500 mt-1">this month</div>
        </Card>
      </div>

      {/* View toggle */}
      <div className="flex gap-1">
        {(["today", "overview"] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-full text-sm font-medium border capitalize transition ${
              view === v
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            }`}
          >
            {v === "today" ? "📋 Today" : "📊 Overview"}
          </button>
        ))}
      </div>

      {/* Today view */}
      {view === "today" && (
        <TodayView
          invoices={invoices}
          payments={payments}
          onSendAll={handleSendAllOverdue}
        />
      )}

      {/* Overview */}
      {view === "overview" && (
        <div className="space-y-4">
          {/* Celebration banner */}
          {stats && stats.collectedThisMonth > 0 && (
            <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">🎉 {formatCurrency(stats.collectedThisMonth)} collected this month!</div>
                <div className="text-sm text-white/80">{stats.paymentCount} payments — keep it going</div>
              </div>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `We collected ${formatCurrency(stats.collectedThisMonth)} this month with CollectNaija 🔥`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl border border-white/30 text-sm font-medium"
              >
                Share 📣
              </a>
            </div>
          )}

          {/* Cash flow chart */}
          <Card className="p-5">
            <h2 className="font-semibold mb-4">Cash flow — last 7 days</h2>
            <div className="h-[240px]">
              {stats?.cashflow?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.cashflow}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v / 1000) + "k"} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Area type="monotone" dataKey="expected" name="Expected" stroke="#0f4c81" fill="#dbeafe" strokeWidth={2} />
                    <Area type="monotone" dataKey="collected" name="Collected" stroke="#059669" fill="#d1fae5" strokeWidth={2} />
                    <Area type="monotone" dataKey="overdue" name="Overdue" stroke="#dc2626" fill="#fee2e2" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-slate-400">
                  No data yet — create invoices and record payments.
                </div>
              )}
            </div>
          </Card>

          {/* Recent invoices */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Recent invoices</h2>
              <Link to="/invoices" className="text-sm text-brand-600 font-medium">View all</Link>
            </div>
            {invoices.length === 0 ? (
              <EmptyInvoices />
            ) : (
              <div className="space-y-2">
                {invoices.slice(0, 5).map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <span className="font-mono text-xs">{inv.number}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          inv.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                          inv.status === "overdue" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>{inv.status}</span>
                      </div>
                      <div className="text-xs text-slate-500 truncate">{inv.customerName} — {formatCurrency(inv.balance)}</div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {inv.balance > 0 && <WhatsAppShareInvoice invoice={inv} orgName={user?.org?.name} />}
                      <Link to={`/invoices/${inv.id}`} className="text-xs px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 font-medium min-h-[36px] flex items-center">View</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { to: "/customers", icon: Users, label: "Add Customer", color: "text-violet-600" },
              { to: "/invoices", icon: FileText, label: "Create Invoice", color: "text-brand-600" },
              { to: "/payments", icon: CreditCard, label: "Record Payment", color: "text-emerald-600" },
              { to: "/reports", icon: BarChart3, label: "View Reports", color: "text-amber-600" },
            ].map(a => (
              <Link key={a.to} to={a.to} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition text-center">
                <a.icon className={`w-6 h-6 ${a.color}`} />
                <span className="text-xs font-medium">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bulk send status */}
      {sendingAll && (
        <div className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm px-5 py-3 rounded-full shadow-xl flex items-center gap-2 z-50">
          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          Sending WhatsApp reminders…
        </div>
      )}
    </div>
  )
}

function EmptyInvoices() {
  return (
    <div className="text-center p-6 border border-dashed rounded-2xl">
      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
      <div className="font-semibold text-slate-600">No invoices yet</div>
      <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
        Create your first invoice and share it with a customer in one tap — via WhatsApp or email.
      </p>
      <Link
        to="/invoices"
        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium"
      >
        <FileText className="w-4 h-4" /> Create invoice
      </Link>
    </div>
  )
}
