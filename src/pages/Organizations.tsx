import { useEffect, useState } from "react"
import { Building2, Check, ChevronRight, Edit2, Globe, Plus, RefreshCw, Trash2, Users, X } from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { apiFetch } from "../services/api"
import { useToast } from "../components/ui/toast"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input, Select } from "../components/ui/input"

// ─── Types ────────────────────────────────────────────────────────────────────

type OrgItem = {
  id: string
  slug: string
  name: string
  country: string
  currency: string
  timezone: string
  is_demo: boolean
  created_at: string
  role: string | null
}

type Member = {
  id: string
  name: string
  email: string
  role: string
  joined_at: string
}

const CURRENCIES = [
  { value: "NGN", label: "NGN — Nigerian Naira (₦)" },
  { value: "GHS", label: "GHS — Ghana Cedi (₵)" },
  { value: "KES", label: "KES — Kenyan Shilling (KSh)" },
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "ZAR", label: "ZAR — South African Rand (R)" },
  { value: "GBP", label: "GBP — British Pound (£)" },
]

const COUNTRIES = [
  { value: "NG", label: "🇳🇬 Nigeria" },
  { value: "GH", label: "🇬🇭 Ghana" },
  { value: "KE", label: "🇰🇪 Kenya" },
  { value: "ZA", label: "🇿🇦 South Africa" },
  { value: "GB", label: "🇬🇧 United Kingdom" },
  { value: "US", label: "🇺🇸 United States" },
]

const ROLE_BADGE: Record<string, string> = {
  owner:    "bg-violet-100 text-violet-700",
  admin:    "bg-blue-100 text-blue-700",
  staff:    "bg-slate-100 text-slate-600",
  readonly: "bg-slate-100 text-slate-500",
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditOrgModal({
  org,
  onClose,
  onSaved,
}: {
  org: OrgItem
  onClose: () => void
  onSaved: (updated: OrgItem) => void
}) {
  const { push } = useToast()
  const [name, setName] = useState(org.name)
  const [country, setCountry] = useState(org.country)
  const [currency, setCurrency] = useState(org.currency)
  const [timezone, setTimezone] = useState(org.timezone)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) return push("Business name is required.", "error")
    setSaving(true)
    try {
      const res = await apiFetch<{ success: boolean; data: OrgItem }>(
        `/organizations/${org.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ name: name.trim(), country, currency, timezone }),
        }
      )
      push("Organisation updated.", "success")
      onSaved(res.data)
    } catch (err: any) {
      push(err?.data?.message || "Failed to update organisation.", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Edit Organisation</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <Input
            label="Business name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Al-Hikma Private School"
          />
          <Select
            label="Country"
            value={country}
            onChange={e => setCountry(e.target.value)}
            options={COUNTRIES}
          />
          <Select
            label="Currency"
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            options={CURRENCIES}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Timezone
            </label>
            <input
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              placeholder="Africa/Lagos"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={saving} className="flex-1">
            Cancel
          </Button>
          <Button onClick={save} disabled={saving} className="flex-1">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Create Org Modal ─────────────────────────────────────────────────────────

function CreateOrgModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (org: OrgItem) => void
}) {
  const { push } = useToast()
  const [name, setName] = useState("")
  const [country, setCountry] = useState("NG")
  const [currency, setCurrency] = useState("NGN")
  const [saving, setSaving] = useState(false)

  const create = async () => {
    if (!name.trim()) return push("Business name is required.", "error")
    setSaving(true)
    try {
      const res = await apiFetch<{ success: boolean; data: OrgItem }>(
        "/organizations",
        {
          method: "POST",
          body: JSON.stringify({ name: name.trim(), country, currency, timezone: "Africa/Lagos" }),
        }
      )
      push(`"${res.data.name}" created.`, "success")
      onCreated(res.data)
    } catch (err: any) {
      push(err?.data?.message || "Failed to create organisation.", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">New Organisation</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <Input
            label="Business name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Ikeja Cooperative Society"
            autoFocus
          />
          <Select
            label="Country"
            value={country}
            onChange={e => setCountry(e.target.value)}
            options={COUNTRIES}
          />
          <Select
            label="Currency"
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            options={CURRENCIES}
          />
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={saving} className="flex-1">
            Cancel
          </Button>
          <Button onClick={create} disabled={saving} className="flex-1">
            {saving ? "Creating…" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Members Panel ────────────────────────────────────────────────────────────

function MembersPanel({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<{ success: boolean; results: Member[] }>(`/organizations/${orgId}/members`)
      .then(r => setMembers(r.results))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orgId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500" /> Members
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">Loading…</div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No members found.</div>
        ) : (
          <ul className="space-y-3">
            {members.map(m => (
              <li key={m.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{m.name || m.email}</p>
                  <p className="text-xs text-slate-500">{m.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_BADGE[m.role] ?? ROLE_BADGE.staff}`}>
                  {m.role}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Button variant="secondary" onClick={onClose} className="w-full mt-5">
          Close
        </Button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Organizations() {
  const { user, switchOrg, updateOrg } = useAuth()
  const { push } = useToast()
  const activeOrgId = user?.org?.id ?? localStorage.getItem("cn_org_id") ?? ""

  const [orgs, setOrgs] = useState<OrgItem[]>([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState<string | null>(null)
  const [editOrg, setEditOrg] = useState<OrgItem | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [membersOrgId, setMembersOrgId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    apiFetch<{ success: boolean; count: number; results: OrgItem[] }>("/organizations")
      .then(r => setOrgs(r.results))
      .catch(() => push("Failed to load organisations.", "error"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSwitch = async (org: OrgItem) => {
    if (org.id === activeOrgId) return
    setSwitching(org.id)
    try {
      await switchOrg(org.id)
      push(`Switched to "${org.name}"`, "success")
      // Reload the page so all store data is scoped to the new org
      setTimeout(() => window.location.href = "/dashboard", 300)
    } catch (err: any) {
      push(err?.data?.message || "Failed to switch organisation.", "error")
    } finally {
      setSwitching(null)
    }
  }

  const handleSaved = (updated: OrgItem) => {
    setOrgs(prev => prev.map(o => o.id === updated.id ? updated : o))
    // If the updated org is the active one, sync AppUser
    if (updated.id === activeOrgId) {
      updateOrg({
        name: updated.name,
        country: updated.country,
        currency: updated.currency as any,
      })
    }
    setEditOrg(null)
  }

  const handleCreated = (org: OrgItem) => {
    setOrgs(prev => [...prev, org])
    setShowCreate(false)
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organisations</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your workspaces and switch between them.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
          <Button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> New org
          </Button>
        </div>
      </div>

      {/* Org cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <Card className="p-10 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No organisations yet.</p>
          <Button onClick={() => setShowCreate(true)} className="mt-4">
            Create your first org
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {orgs.map(org => {
            const isActive = org.id === activeOrgId
            const isSwitching = switching === org.id
            return (
              <Card
                key={org.id}
                className={`p-4 transition ${isActive ? "ring-2 ring-brand-500 dark:ring-brand-400" : "hover:shadow-md"}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                    <Building2 className="w-5 h-5" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold truncate">{org.name}</span>
                      {isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      )}
                      {org.is_demo && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                          Demo
                        </span>
                      )}
                      {org.role && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_BADGE[org.role] ?? ROLE_BADGE.staff}`}>
                          {org.role}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {org.country}
                      </span>
                      <span>{org.currency}</span>
                      <span>{org.timezone}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Members */}
                    <button
                      onClick={() => setMembersOrgId(org.id)}
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="View members"
                    >
                      <Users className="w-4 h-4 text-slate-500" />
                    </button>
                    {/* Edit — only owner/admin */}
                    {(org.role === "owner" || org.role === "admin") && (
                      <button
                        onClick={() => setEditOrg(org)}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </button>
                    )}
                    {/* Switch */}
                    {!isActive && (
                      <button
                        onClick={() => handleSwitch(org)}
                        disabled={!!switching}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 disabled:opacity-50 transition min-h-[36px]"
                        title="Switch to this org"
                      >
                        {isSwitching ? (
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                        Switch
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {editOrg && (
        <EditOrgModal
          org={editOrg}
          onClose={() => setEditOrg(null)}
          onSaved={handleSaved}
        />
      )}
      {showCreate && (
        <CreateOrgModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
      {membersOrgId && (
        <MembersPanel
          orgId={membersOrgId}
          onClose={() => setMembersOrgId(null)}
        />
      )}
    </div>
  )
}
