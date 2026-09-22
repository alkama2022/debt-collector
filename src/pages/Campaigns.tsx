import { useState, useEffect } from "react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Modal } from "../components/ui/modal"
import { Input } from "../components/ui/input"
import { useToast } from "../components/ui/toast"
import { apiFetch } from "../services/api"
import {
  Megaphone, Plus, Play, Pause, CheckCircle, XCircle,
  BarChart2, RefreshCw, ChevronRight, Clock, Zap
} from "lucide-react"

type Campaign = {
  id: string
  name: string
  description: string
  status: "draft" | "active" | "paused" | "completed" | "cancelled"
  config: {
    channel?: string
    template?: string
  }
  started_at: string | null
  created_at: string
}

type CampaignStats = {
  total_events: number
  breakdown: Record<string, number>
  started_at: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:     { label: "Draft",     color: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300", icon: <Clock className="w-3 h-3" /> },
  active:    { label: "Active",    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: <Zap className="w-3 h-3" /> },
  paused:    { label: "Paused",    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", icon: <Pause className="w-3 h-3" /> },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400", icon: <XCircle className="w-3 h-3" /> },
}

const CHANNELS = ["whatsapp", "sms", "email", "voice"]

const DEFAULT_TEMPLATES: Record<string, string> = {
  whatsapp: "Hello {{customer_name}}, this is a reminder from {{business_name}}. Invoice {{invoice_number}} for {{amount_due}} is outstanding. Pay now: {{pay_link}}",
  sms: "{{business_name}}: Hi {{customer_name}}, invoice {{invoice_number}} for {{amount_due}} is overdue. Pay: {{pay_link}}",
  email: "Dear {{customer_name}},\n\nThis is a reminder from {{business_name}} regarding invoice {{invoice_number}} for {{amount_due}}.\n\nPlease settle your balance at: {{pay_link}}\n\nThank you.",
  voice: "Hello {{customer_name}}, you have an outstanding balance of {{amount_due}} with {{business_name}}. Please visit {{pay_link}} to make your payment.",
}

export default function Campaigns() {
  const { push } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [stats, setStats] = useState<Record<string, CampaignStats>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Create form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    channel: "whatsapp",
    template: DEFAULT_TEMPLATES.whatsapp,
  })
  const [creating, setCreating] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiFetch<any>("/collections/campaigns")
      const list = res.results ?? res ?? []
      setCampaigns(Array.isArray(list) ? list : [])
    } catch {
      push("Failed to load campaigns", "error")
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (id: string) => {
    try {
      const res = await apiFetch<{ success: boolean; data: CampaignStats }>(`/collections/campaigns/${id}/stats`)
      setStats(prev => ({ ...prev, [id]: res.data }))
    } catch { /* silently ignore */ }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    campaigns.forEach(c => {
      if (c.status === "active") loadStats(c.id)
    })
  }, [campaigns])

  const handleCreate = async () => {
    if (!form.name.trim()) return push("Please enter a campaign name", "error")
    setCreating(true)
    try {
      await apiFetch<Campaign>("/collections/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          status: "draft",
          config: { channel: form.channel, template: form.template },
        }),
      })
      push("Campaign created successfully", "success")
      setShowCreate(false)
      setForm({ name: "", description: "", channel: "whatsapp", template: DEFAULT_TEMPLATES.whatsapp })
      load()
    } catch (e: any) {
      const msg = e?.data?.detail || e?.data?.message || "Failed to create campaign"
      push(typeof msg === "string" ? msg : JSON.stringify(msg), "error")
    } finally {
      setCreating(false)
    }
  }

  const handleLaunch = async (campaign: Campaign) => {
    setActionLoading(campaign.id)
    try {
      const res = await apiFetch<any>(`/collections/campaigns/${campaign.id}/launch`, { method: "POST" })
      push(`Campaign launched! ${res.data?.events_created ?? 0} messages queued.`, "success")
      load()
    } catch (e: any) {
      push(e?.data?.message || "Failed to launch campaign", "error")
    } finally {
      setActionLoading(null)
    }
  }

  const handleStatusChange = async (campaign: Campaign, newStatus: string) => {
    setActionLoading(campaign.id)
    try {
      await apiFetch(`/collections/campaigns/${campaign.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      })
      push(`Campaign ${newStatus}`, "success")
      load()
    } catch {
      push("Action failed", "error")
    } finally {
      setActionLoading(null)
    }
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
        {cfg.icon}{cfg.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#0f4c81]" />
            Collection Campaigns
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Bulk outreach to customers with outstanding balances
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["draft", "active", "completed", "paused"] as const).map(s => {
          const count = campaigns.filter(c => c.status === s).length
          const cfg = STATUS_CONFIG[s]
          return (
            <Card key={s} className="p-4">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${cfg.color} mb-2`}>
                {cfg.icon}{cfg.label}
              </div>
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs text-slate-400">campaigns</div>
            </Card>
          )
        })}
      </div>

      {/* Campaign List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="p-12 text-center">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-600 dark:text-slate-400">No campaigns yet</h3>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            Create a campaign to send bulk reminders to all customers with outstanding balances.
          </p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> Create First Campaign
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => {
            const channelColor: Record<string, string> = {
              whatsapp: "#25D366", sms: "#2563eb", email: "#7c3aed", voice: "#d97706"
            }
            const ch = c.config?.channel || "whatsapp"
            const s = stats[c.id]
            const isLoading = actionLoading === c.id

            return (
              <Card key={c.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{c.name}</h3>
                      <StatusBadge status={c.status} />
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white uppercase"
                        style={{ background: channelColor[ch] || "#64748b" }}
                      >
                        {ch}
                      </span>
                    </div>
                    {c.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{c.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      Created {new Date(c.created_at).toLocaleDateString()}
                      {c.started_at && ` · Launched ${new Date(c.started_at).toLocaleDateString()}`}
                    </p>

                    {/* Stats bar for active campaigns */}
                    {s && (
                      <div className="mt-3 flex flex-wrap gap-3 text-xs">
                        <span className="text-slate-500">{s.total_events} total</span>
                        <span className="text-emerald-600">✓ {s.breakdown.sent || 0} sent</span>
                        <span className="text-amber-500">⏳ {s.breakdown.queued || 0} queued</span>
                        <span className="text-red-500">✗ {s.breakdown.failed || 0} failed</span>
                        {s.total_events > 0 && (
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${Math.round((s.breakdown.sent || 0) / s.total_events * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {c.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => handleLaunch(c)}
                        disabled={isLoading}
                      >
                        <Play className="w-3.5 h-3.5 mr-1" />
                        {isLoading ? "Launching…" : "Launch"}
                      </Button>
                    )}
                    {c.status === "active" && (
                      <>
                        <Button
                          variant="secondary" size="sm"
                          onClick={() => loadStats(c.id)}
                          disabled={isLoading}
                        >
                          <BarChart2 className="w-3.5 h-3.5 mr-1" /> Stats
                        </Button>
                        <Button
                          variant="secondary" size="sm"
                          onClick={() => handleStatusChange(c, "paused")}
                          disabled={isLoading}
                        >
                          <Pause className="w-3.5 h-3.5 mr-1" /> Pause
                        </Button>
                      </>
                    )}
                    {c.status === "paused" && (
                      <Button
                        size="sm"
                        onClick={() => handleLaunch(c)}
                        disabled={isLoading}
                      >
                        <Play className="w-3.5 h-3.5 mr-1" />
                        {isLoading ? "Resuming…" : "Resume"}
                      </Button>
                    )}
                    <button
                      onClick={() => setSelectedCampaign(c)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Collection Campaign">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Campaign Name *</label>
            <Input
              placeholder="e.g. September Overdue Sweep"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              placeholder="Optional — what this campaign is about"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Channel</label>
            <div className="grid grid-cols-4 gap-2">
              {CHANNELS.map(ch => {
                const colors: Record<string, string> = {
                  whatsapp: "#25D366", sms: "#2563eb", email: "#7c3aed", voice: "#d97706"
                }
                return (
                  <button
                    key={ch}
                    onClick={() => setForm(f => ({ ...f, channel: ch, template: DEFAULT_TEMPLATES[ch] || "" }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold uppercase border-2 transition-all ${
                      form.channel === ch
                        ? "border-current text-white"
                        : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400"
                    }`}
                    style={form.channel === ch ? { background: colors[ch], borderColor: colors[ch] } : {}}
                  >
                    {ch}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Message Template
              <span className="ml-2 text-xs font-normal text-slate-400">
                Variables: {"{{customer_name}}"} {"{{invoice_number}}"} {"{{amount_due}}"} {"{{pay_link}}"}
              </span>
            </label>
            <textarea
              className="w-full h-28 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#0f4c81]/30"
              value={form.template}
              onChange={e => setForm(f => ({ ...f, template: e.target.value }))}
              placeholder="Enter your message template…"
            />
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300">
            <strong>⚡ What happens when you launch:</strong> The campaign will create a reminder message for every customer with an open invoice and queue it for delivery. Messages are sent automatically every 2 minutes.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !form.name.trim()}>
              {creating ? "Creating…" : "Create Campaign"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <Modal
          open={!!selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          title={selectedCampaign.name}
        >
          <div className="space-y-4 text-sm">
            <div className="flex gap-2 flex-wrap">
              <StatusBadge status={selectedCampaign.status} />
              <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white uppercase bg-[#0f4c81]">
                {selectedCampaign.config?.channel || "whatsapp"}
              </span>
            </div>
            {selectedCampaign.description && (
              <p className="text-slate-600 dark:text-slate-300">{selectedCampaign.description}</p>
            )}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700">
              <div className="text-xs font-medium text-slate-500 mb-1">Message Template</div>
              <pre className="whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300 font-mono">
                {selectedCampaign.config?.template || "—"}
              </pre>
            </div>
            {stats[selectedCampaign.id] && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Total", val: stats[selectedCampaign.id].total_events, color: "text-slate-600" },
                  { label: "Sent", val: stats[selectedCampaign.id].breakdown.sent || 0, color: "text-emerald-600" },
                  { label: "Failed", val: stats[selectedCampaign.id].breakdown.failed || 0, color: "text-red-500" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                    <div className={`text-2xl font-bold ${color}`}>{val}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              {selectedCampaign.status === "active" && (
                <Button
                  variant="secondary"
                  onClick={() => { handleStatusChange(selectedCampaign, "paused"); setSelectedCampaign(null) }}
                >
                  <Pause className="w-4 h-4 mr-1" /> Pause
                </Button>
              )}
              {["draft", "paused"].includes(selectedCampaign.status) && (
                <Button onClick={() => { handleLaunch(selectedCampaign); setSelectedCampaign(null) }}>
                  <Play className="w-4 h-4 mr-1" /> Launch
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
