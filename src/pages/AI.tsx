import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { apiFetch } from "../services/api"
import { formatCurrency } from "../utils/format"
import { Card } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/toast"
import { Skeleton } from "../components/ui/skeleton"
import { Bot, MessageSquare, AlertCircle, CheckCircle, Clock, TrendingUp, Zap } from "lucide-react"

type Conversation = {
  id: string
  state: string
  channel: string
  customer: string | null
  invoice: string | null
  created_at: string
  updated_at: string
}

type Promise = {
  id: string
  customer: string | null
  invoice: string | null
  promise_date: string
  amount: string
  status: "pending" | "kept" | "broken" | "cancelled"
  created_at: string
}

type Stats = {
  total: number
  active: number
  resolved: number
  escalated: number
  promises_pending: number
  promises_kept: number
  promises_broken: number
}

const STATE_COLORS: Record<string, "danger" | "warning" | "success" | "info" | "default"> = {
  INVOICE_CREATED: "default",
  REMINDER_SENT: "info",
  CUSTOMER_REPLIED: "info",
  NEGOTIATING: "warning",
  PROMISE_MADE: "warning",
  PROMISE_DUE: "warning",
  PAYMENT_RECEIVED: "success",
  RESOLVED: "success",
  COLLECTION_CLOSED: "success",
  ESCALATED: "danger",
  HUMAN_HANDOFF: "danger",
  PAYMENT_FAILED: "danger",
  OVERDUE: "danger",
  FOLLOW_UP: "warning",
  CANCELLED: "default",
}

export default function AI() {
  const { push } = useToast()
  const [tab, setTab] = useState<"overview" | "conversations" | "promises" | "compose">("overview")
  const [convs, setConvs] = useState<Conversation[]>([])
  const [promises, setPromises] = useState<Promise[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [stateFilter, setStateFilter] = useState("all")

  // Compose AI message state
  const [composeCustomerId, setComposeCustomerId] = useState("")
  const [composeMessage, setComposeMessage] = useState("")
  const [composeIntent, setComposeIntent] = useState("reminder")
  const [composeLang, setComposeLang] = useState("en")
  const [composedResponse, setComposedResponse] = useState("")
  const [composing, setComposing] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [convRes, promiseRes, custRes] = await Promise.allSettled([
          apiFetch<any>("/ai/conversations?page_size=100"),
          apiFetch<any>("/ai/promises?page_size=100"),
          apiFetch<any>("/customers?page_size=50"),
        ])

        const convList: Conversation[] = convRes.status === "fulfilled"
          ? (convRes.value.results ?? convRes.value ?? [])
          : []

        const promiseList: Promise[] = promiseRes.status === "fulfilled"
          ? (promiseRes.value.results ?? promiseRes.value ?? [])
          : []

        const custList = custRes.status === "fulfilled"
          ? (custRes.value.results ?? custRes.value ?? [])
          : []

        setConvs(convList)
        setPromises(promiseList)
        setCustomers(custList)

        // Compute stats
        const active = convList.filter(c =>
          !["RESOLVED", "COLLECTION_CLOSED", "CANCELLED", "PAYMENT_RECEIVED"].includes(c.state)
        ).length
        const resolved = convList.filter(c =>
          ["RESOLVED", "COLLECTION_CLOSED", "PAYMENT_RECEIVED"].includes(c.state)
        ).length
        const escalated = convList.filter(c =>
          ["ESCALATED", "HUMAN_HANDOFF"].includes(c.state)
        ).length

        setStats({
          total: convList.length,
          active,
          resolved,
          escalated,
          promises_pending: promiseList.filter(p => p.status === "pending").length,
          promises_kept: promiseList.filter(p => p.status === "kept").length,
          promises_broken: promiseList.filter(p => p.status === "broken").length,
        })
      } catch {
        push("Failed to load AI data", "error")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const escalateConv = async (id: string) => {
    try {
      await apiFetch(`/ai/conversations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ state: "HUMAN_HANDOFF" }),
      })
      setConvs(cs => cs.map(c => c.id === id ? { ...c, state: "HUMAN_HANDOFF" } : c))
      push("Escalated to human staff", "success")
    } catch { push("Failed to escalate", "error") }
  }

  const generateResponse = async () => {
    if (!composeCustomerId) { push("Select a customer", "error"); return }
    setComposing(true)
    try {
      const cust = customers.find(c => c.id === composeCustomerId)
      const res = await apiFetch<any>("/ai/generate-response", {
        method: "POST",
        body: JSON.stringify({
          text: composeMessage || "Payment reminder",
          customer_id: composeCustomerId,
          customer_name: cust?.name || "",
          intent: composeIntent,
          language: composeLang,
          amount_due: cust?.outstanding?.toString() || "0",
        }),
      })
      setComposedResponse(res.response || "")
    } catch (e: any) {
      push(e?.data?.message || "Failed to generate response", "error")
    } finally { setComposing(false) }
  }

  const filteredConvs = stateFilter === "all"
    ? convs
    : convs.filter(c => c.state === stateFilter)

  const stateOptions = ["all", "REMINDER_SENT", "CUSTOMER_REPLIED", "NEGOTIATING", "PROMISE_MADE", "ESCALATED", "HUMAN_HANDOFF", "RESOLVED"]

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Collections Agent</h1>
            <p className="text-xs text-slate-500">Real-time AI conversation management and promise tracking</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setTab("compose")} className="gap-2">
            <Zap className="w-4 h-4" /> Generate Response
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-1">
        {(["overview", "conversations", "promises", "compose"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 rounded-full text-xs font-medium border capitalize whitespace-nowrap ${tab === t ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-medium"><MessageSquare className="w-4 h-4" /> Total Conversations</div>
              <div className="text-2xl font-bold mt-2">{stats.total}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-amber-600 uppercase font-medium"><Clock className="w-4 h-4" /> Active</div>
              <div className="text-2xl font-bold mt-2 text-amber-600">{stats.active}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-emerald-600 uppercase font-medium"><CheckCircle className="w-4 h-4" /> Resolved</div>
              <div className="text-2xl font-bold mt-2 text-emerald-600">{stats.resolved}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-red-600 uppercase font-medium"><AlertCircle className="w-4 h-4" /> Escalated</div>
              <div className="text-2xl font-bold mt-2 text-red-600">{stats.escalated}</div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-3">
            <Card className="p-4">
              <div className="text-xs text-slate-500 uppercase font-medium">Promises Pending</div>
              <div className="text-2xl font-bold mt-2 text-amber-600">{stats.promises_pending}</div>
              <div className="text-xs text-slate-500 mt-1">Customers who said they will pay</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-500 uppercase font-medium">Promises Kept</div>
              <div className="text-2xl font-bold mt-2 text-emerald-600">{stats.promises_kept}</div>
              <div className="text-xs text-slate-500 mt-1">Payments received after promise</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-500 uppercase font-medium">Promises Broken</div>
              <div className="text-2xl font-bold mt-2 text-red-600">{stats.promises_broken}</div>
              <div className="text-xs text-slate-500 mt-1">Require follow-up or escalation</div>
            </Card>
          </div>

          {/* State breakdown */}
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Conversation States</h3>
            <div className="space-y-2">
              {Object.entries(
                convs.reduce((acc: Record<string, number>, c) => { acc[c.state] = (acc[c.state] || 0) + 1; return acc }, {})
              ).sort((a, b) => b[1] - a[1]).map(([state, count]) => (
                <div key={state} className="flex items-center gap-3">
                  <div className="w-32 text-xs font-medium text-slate-600 truncate">{state.replace(/_/g, " ")}</div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${STATE_COLORS[state] === "danger" ? "bg-red-500" : STATE_COLORS[state] === "warning" ? "bg-amber-500" : STATE_COLORS[state] === "success" ? "bg-emerald-500" : "bg-brand-500"}`}
                      style={{ width: `${(count / (convs.length || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs font-semibold w-8 text-right">{count}</div>
                </div>
              ))}
              {convs.length === 0 && (
                <div className="text-sm text-slate-500 text-center p-4 border border-dashed rounded-xl">
                  No conversations yet. AI conversations start automatically when invoices become due.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Conversations */}
      {tab === "conversations" && (
        <div className="space-y-4">
          <div className="flex gap-1 flex-wrap">
            {stateOptions.map(s => (
              <button
                key={s}
                onClick={() => setStateFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize ${stateFilter === s ? "bg-slate-900 text-white" : "bg-white border-slate-200"}`}
              >
                {s === "all" ? `All (${convs.length})` : s.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="text-left p-3">State</th>
                    <th className="text-left">Channel</th>
                    <th className="text-left">Customer</th>
                    <th className="text-left">Updated</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConvs.map(conv => (
                    <tr key={conv.id} className="border-t hover:bg-slate-50">
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          STATE_COLORS[conv.state] === "danger" ? "bg-red-100 text-red-700" :
                          STATE_COLORS[conv.state] === "warning" ? "bg-amber-100 text-amber-700" :
                          STATE_COLORS[conv.state] === "success" ? "bg-emerald-100 text-emerald-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {conv.state.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="text-xs capitalize">{conv.channel}</td>
                      <td className="text-xs text-slate-600 font-mono">{conv.customer ? conv.customer.slice(0, 8) + "…" : "—"}</td>
                      <td className="text-xs text-slate-500">{new Date(conv.updated_at).toLocaleDateString()}</td>
                      <td className="pr-3 text-right">
                        {!["RESOLVED", "COLLECTION_CLOSED", "HUMAN_HANDOFF"].includes(conv.state) && (
                          <button
                            onClick={() => escalateConv(conv.id)}
                            className="text-xs px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            Escalate
                          </button>
                        )}
                        {conv.state === "HUMAN_HANDOFF" && (
                          <span className="text-xs text-red-600 font-medium">Needs staff</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredConvs.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-sm text-slate-500">No conversations match this filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Promises */}
      {tab === "promises" && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Promises to Pay</h3>
            <p className="text-xs text-slate-500 mt-1">Recorded when AI detects a customer commitment to pay.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="text-left p-3">Customer</th>
                  <th className="text-left">Invoice</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Promise Date</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {promises.map(p => (
                  <tr key={p.id} className="border-t hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs">{p.customer ? p.customer.slice(0, 8) + "…" : "—"}</td>
                    <td className="font-mono text-xs">{p.invoice ? p.invoice.slice(0, 8) + "…" : "—"}</td>
                    <td className="text-right font-medium">{formatCurrency(Number(p.amount))}</td>
                    <td className="text-center text-xs">{p.promise_date}</td>
                    <td className="text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        p.status === "kept" ? "bg-emerald-100 text-emerald-700" :
                        p.status === "broken" ? "bg-red-100 text-red-700" :
                        p.status === "pending" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {promises.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-sm text-slate-500">No promises recorded yet. They appear when the AI detects a customer commitment.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Compose AI Response */}
      {tab === "compose" && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-violet-600" />
            <h3 className="font-semibold">Generate AI Response</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Generate a professional, contextual collection message for a customer using the AI engine.
            Uses OpenAI/Anthropic if configured, otherwise natural template fallback.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Customer</label>
              <select
                value={composeCustomerId}
                onChange={e => setComposeCustomerId(e.target.value)}
                className="mt-1 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select customer…</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.phone || "no phone"}</option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Intent</label>
                <select
                  value={composeIntent}
                  onChange={e => setComposeIntent(e.target.value)}
                  className="mt-1 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="reminder">Payment reminder</option>
                  <option value="overdue">Overdue notice</option>
                  <option value="negotiation">Payment arrangement</option>
                  <option value="promise">Follow up on promise</option>
                  <option value="receipt">Payment confirmed</option>
                  <option value="human_handoff">Escalation notice</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Language</label>
                <select
                  value={composeLang}
                  onChange={e => setComposeLang(e.target.value)}
                  className="mt-1 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="en">English</option>
                  <option value="pcm">Nigerian Pidgin</option>
                  <option value="ha">Hausa</option>
                  <option value="yo">Yoruba</option>
                  <option value="ig">Igbo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Customer's message (optional — for contextual reply)</label>
              <textarea
                value={composeMessage}
                onChange={e => setComposeMessage(e.target.value)}
                placeholder="e.g. 'I will pay on Friday'"
                className="mt-1 w-full h-20 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <Button onClick={generateResponse} disabled={composing} className="w-full">
              {composing ? "Generating…" : "Generate AI Response"}
            </Button>

            {composedResponse && (
              <div className="mt-4 p-4 rounded-xl bg-violet-50 border border-violet-200">
                <div className="text-xs font-medium text-violet-700 mb-2">Generated message:</div>
                <div className="text-sm text-slate-800 leading-relaxed">{composedResponse}</div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => { navigator.clipboard?.writeText(composedResponse); push("Copied!", "success") }}
                    className="text-xs px-3 py-1.5 rounded-full border border-violet-300 text-violet-700 hover:bg-violet-100"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => setComposedResponse("")}
                    className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
