import { useState, useEffect } from "react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/toast"
import { apiFetch } from "../services/api"
import { formatCurrency } from "../utils/format"
import { Download, TrendingUp, TrendingDown, Users, FileText, MessageSquare, AlertCircle, RefreshCw } from "lucide-react"
import { EmptyReports } from "../components/ui/empty"

type KPIs = {
  total_outstanding: number
  total_overdue: number
  total_collected: number
  collection_rate: number
  open_invoices: number
  overdue_invoices: number
  total_customers: number
}

type CashFlowPoint = { date: string; collected: number; outstanding: number }
type AgingBucket = { total: number; count: number }
type Aging = { current: AgingBucket; "1_30": AgingBucket; "31_60": AgingBucket; "61_90": AgingBucket; "90_plus": AgingBucket }
type ChannelStat = { channel: string; total: number; sent: number; failed: number; success_rate: number }
type TopDebtor = { id: string; name: string; phone: string; outstanding: number; overdue: number; invoice_count: number }

type ReportData = {
  range_days: number
  kpis: KPIs
  cash_flow: CashFlowPoint[]
  aging: Aging
  channel_stats: ChannelStat[]
  top_debtors: TopDebtor[]
}

const RANGES = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "3 months", value: 90 },
  { label: "12 months", value: 365 },
]

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: "#25D366",
  sms: "#2563eb",
  email: "#7c3aed",
  voice: "#d97706",
}

export default function Reports() {
  const { push } = useToast()
  const [range, setRange] = useState(30)
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ success: boolean; data: ReportData }>(
        `/reports/summary?range=${range}`
      )
      setData(res.data)
    } catch (e: any) {
      setError("Failed to load report. Please try again.")
      push("Failed to load report", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() }, [range])

  const handleExport = async (fmt: "csv" | "pdf") => {
    setExporting(fmt)
    try {
      const token = localStorage.getItem("cn_token")
      const orgId = localStorage.getItem("cn_org_id")
      const apiBase = (import.meta as any).env.VITE_API_BASE_URL || ""
      const res = await fetch(`${apiBase}/reports/export?format=${fmt}&range=${range}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(orgId ? { "X-Org-Id": orgId } : {}),
        },
      })
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `collectnaija-report-${range}d.${fmt}`
      a.click()
      URL.revokeObjectURL(url)
      push(`${fmt.toUpperCase()} exported successfully`, "success")
    } catch {
      push("Export failed — try again", "error")
    } finally {
      setExporting(null)
    }
  }

  const BRAND = "#0f4c81"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time aggregates from your live data
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                range === r.value
                  ? "bg-[#0f4c81] text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              {r.label}
            </button>
          ))}
          <Button variant="secondary" size="sm" onClick={fetchReport} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleExport("csv")} disabled={!!exporting}>
            <Download className="w-4 h-4 mr-1" />
            {exporting === "csv" ? "Exporting…" : "CSV"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleExport("pdf")} disabled={!!exporting}>
            <Download className="w-4 h-4 mr-1" />
            {exporting === "pdf" ? "Exporting…" : "PDF"}
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <Button variant="secondary" size="sm" onClick={fetchReport} className="ml-auto">Retry</Button>
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-700/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            label="Outstanding"
            value={formatCurrency(data.kpis.total_outstanding)}
            sub={`${data.kpis.open_invoices} open invoices`}
            icon={<FileText className="w-5 h-5" />}
            color="text-blue-600"
            bg="bg-blue-50 dark:bg-blue-950/30"
          />
          <KpiCard
            label="Overdue"
            value={formatCurrency(data.kpis.total_overdue)}
            sub={`${data.kpis.overdue_invoices} accounts`}
            icon={<TrendingDown className="w-5 h-5" />}
            color="text-red-600"
            bg="bg-red-50 dark:bg-red-950/30"
          />
          <KpiCard
            label="Collected"
            value={formatCurrency(data.kpis.total_collected)}
            sub={`Last ${range} days`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="text-emerald-600"
            bg="bg-emerald-50 dark:bg-emerald-950/30"
          />
          <KpiCard
            label="Collection Rate"
            value={`${data.kpis.collection_rate}%`}
            sub={`${data.kpis.total_customers} customers`}
            icon={<Users className="w-5 h-5" />}
            color={data.kpis.collection_rate >= 50 ? "text-emerald-600" : "text-amber-600"}
            bg={data.kpis.collection_rate >= 50 ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-amber-50 dark:bg-amber-950/30"}
          />
        </div>
      ) : null}

      {/* Charts Row */}
      {data && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Cash Flow Chart */}
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Cash Flow</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.cash_flow} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradOutstanding" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number) => [`₦${v.toLocaleString()}`, ""]}
                  labelStyle={{ fontSize: 11 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="collected" name="Collected" stroke="#059669" fill="url(#gradCollected)" strokeWidth={2} />
                <Area type="monotone" dataKey="outstanding" name="Outstanding" stroke={BRAND} fill="url(#gradOutstanding)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Channel Effectiveness */}
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Channel Effectiveness</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.channel_stats} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="channel" tick={{ fontSize: 11 }} tickFormatter={c => c.toUpperCase()} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip labelStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="sent" name="Sent" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Aging Buckets + Top Debtors */}
      {data && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Invoice Aging */}
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Invoice Aging</h3>
            <div className="space-y-3">
              {[
                { label: "Current (not yet due)", key: "current", color: "bg-emerald-500" },
                { label: "1–30 days overdue", key: "1_30", color: "bg-amber-400" },
                { label: "31–60 days overdue", key: "31_60", color: "bg-orange-500" },
                { label: "61–90 days overdue", key: "61_90", color: "bg-red-500" },
                { label: "90+ days overdue", key: "90_plus", color: "bg-red-800" },
              ].map(({ label, key, color }) => {
                const bucket = data.aging[key as keyof Aging]
                const maxVal = Math.max(...Object.values(data.aging).map(b => b.total), 1)
                const pct = Math.round(bucket.total / maxVal * 100)
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-400">{label}</span>
                      <span className="font-medium">{formatCurrency(bucket.total)} <span className="text-xs text-slate-400">({bucket.count})</span></span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Top Debtors */}
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Top Debtors</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">
                    <th className="text-left pb-2">Customer</th>
                    <th className="text-right pb-2">Outstanding</th>
                    <th className="text-right pb-2">Invoices</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_debtors.map((d, i) => (
                    <tr key={d.id} className="border-b dark:border-slate-700/50 last:border-0">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#0f4c81]/10 text-[#0f4c81] text-xs flex items-center justify-center font-bold">{i + 1}</span>
                          <div>
                            <div className="font-medium leading-tight">{d.name}</div>
                            <div className="text-xs text-slate-400">{d.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right font-medium text-red-600 dark:text-red-400">{formatCurrency(d.outstanding)}</td>
                      <td className="text-right text-slate-500">{d.invoice_count}</td>
                    </tr>
                  ))}
                  {data.top_debtors.length === 0 && (
                    <tr><td colSpan={3} className="py-8 text-center text-slate-400 text-sm">No outstanding debtors 🎉</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Channel Details */}
      {data && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#0f4c81]" />
            Reminder Channel Details
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            {data.channel_stats.map(ch => (
              <div key={ch.channel} className="p-4 rounded-xl border dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div
                  className="text-xs font-bold uppercase mb-2 px-2 py-0.5 rounded-full inline-block text-white"
                  style={{ background: CHANNEL_COLORS[ch.channel] || "#64748b" }}
                >
                  {ch.channel}
                </div>
                <div className="text-2xl font-bold mt-1">{ch.total}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">total sent</div>
                <div className="mt-2 flex gap-3 text-xs">
                  <span className="text-emerald-600">✓ {ch.sent} sent</span>
                  <span className="text-red-500">✗ {ch.failed} failed</span>
                </div>
                <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${ch.success_rate}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">{ch.success_rate}% success rate</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function KpiCard({
  label, value, sub, icon, color, bg,
}: {
  label: string; value: string; sub: string; icon: React.ReactNode; color: string; bg: string
}) {
  return (
    <Card className="p-4">
      <div className={`w-9 h-9 rounded-xl ${bg} ${color} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-xl font-bold mt-0.5">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
    </Card>
  )
}
