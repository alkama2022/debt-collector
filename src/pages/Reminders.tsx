import { useState, useEffect } from "react"
import { useStore } from "../services/store"
import { formatCurrency, formatDate } from "../utils/format"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Modal } from "../components/ui/modal"
import { Select, Textarea, Input } from "../components/ui/input"
import { StatusBadge } from "../components/ui/badge"
import { useToast } from "../components/ui/toast"
import { Skeleton } from "../components/ui/skeleton"
import { listReminderRules, createReminderRule, updateReminderRule, deleteReminderRule, runReminderRule, type RawRule } from "../services/live"
import { Zap, Plus, Power, Trash2, Play, History, Settings2 } from "lucide-react"
import { EmptyReminders } from "../components/ui/empty"

export default function Reminders() {
  const { reminders, invoices, loading, addReminder, refresh } = useStore()
  const { push } = useToast()

  const [topTab, setTopTab] = useState<"automation" | "history">("automation")
  const [tab, setTab] = useState<"all" | "queued" | "sent" | "failed" | "cancelled">("all")
  const [open, setOpen] = useState(false)
  const [selInv, setSelInv] = useState("")
  const [channel, setChannel] = useState("whatsapp")
  const [tpl, setTpl] = useState(
    "Hello {{customer_name}}, this is {{business_name}}. Invoice {{invoice_number}} for {{amount_due}} is due on {{due_date}}. Pay via {{payment_link}}."
  )
  const [saving, setSaving] = useState(false)

  // Automation rules
  const [rules, setRules] = useState<RawRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(true)
  const [ruleOpen, setRuleOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<RawRule | null>(null)
  const [ruleForm, setRuleForm] = useState({ name: "3 days after due — WhatsApp", trigger: "after_due" as RawRule["trigger"], offset_days: 3, channel: "whatsapp", template: "Hello {{customer_name}}, invoice {{invoice_number}} for {{amount_due}} is overdue. Pay now: {{payment_link}} — Thank you!", language: "auto", enabled: true })
  const [running, setRunning] = useState<string | null>(null)

  const openInvoices = invoices.filter(i => i.balance > 0)
  const list = reminders.filter(r => tab === "all" || r.status === tab)
  const currentInv = invoices.find(i => i.id === (selInv || openInvoices[0]?.id))
  const previewMessage = tpl
    .replace("{{customer_name}}", currentInv?.customerName || "Customer")
    .replace("{{business_name}}", "Your Business")
    .replace("{{invoice_number}}", currentInv?.number || "INV-XXXX")
    .replace("{{amount_due}}", formatCurrency(currentInv?.balance || 0))
    .replace("{{due_date}}", currentInv?.dueDate || "—")
    .replace("{{payment_link}}", `${window.location.origin}/pay/${currentInv?.id || "xxx"}`)

  const loadRules = async () => {
    setRulesLoading(true)
    try {
      const res = await listReminderRules()
      setRules(res.results || [])
    } catch {
      // fallback demo rules if backend not migrated yet
      setRules([])
    } finally {
      setRulesLoading(false)
    }
  }

  useEffect(() => { if (topTab === "automation") loadRules() }, [topTab])

  const saveRule = async () => {
    if (!ruleForm.name) { push("Rule name required", "error"); return }
    setSaving(true)
    try {
      if (editingRule) {
        const upd = await updateReminderRule(editingRule.id, ruleForm)
        setRules(rules.map(r => r.id === upd.id ? upd : r))
        push("Rule updated", "success")
      } else {
        const created = await createReminderRule(ruleForm)
        setRules([created, ...rules])
        push("Automation rule created — runs daily at 8am WAT", "success")
      }
      setRuleOpen(false)
      setEditingRule(null)
    } catch (e: any) {
      push(e?.data?.message || "Failed to save rule — check backend", "error")
    } finally {
      setSaving(false)
    }
  }

  const toggleRule = async (r: RawRule) => {
    try {
      const upd = await updateReminderRule(r.id, { enabled: !r.enabled })
      setRules(rules.map(x => x.id === r.id ? upd : x))
      push(upd.enabled ? "Rule enabled" : "Rule paused", "success")
    } catch {
      push("Failed to toggle", "error")
    }
  }

  const removeRule = async (id: string) => {
    if (!confirm("Delete this automation rule?")) return
    try {
      await deleteReminderRule(id)
      setRules(rules.filter(r => r.id !== id))
      push("Rule deleted", "success")
    } catch {
      push("Delete failed", "error")
    }
  }

  const runRule = async (id?: string) => {
    setRunning(id || "all")
    try {
      const res = await runReminderRule(id)
      push(`${res.message} — ${res.created} queued. Check History tab`, "success")
      refresh()
    } catch (e: any) {
      push(e?.data?.message || "Run failed — no open invoices matching rule date?", "error")
    } finally {
      setRunning(null)
    }
  }

  const save = async () => {
    const invId = selInv || openInvoices[0]?.id
    if (!invId) { push("Select invoice", "error"); return }
    setSaving(true)
    try {
      await addReminder({ invoiceId: invId, channel: channel as any })
      push(`Reminder scheduled via ${channel}`, "success")
      setOpen(false)
    } catch (e: any) {
      push(e?.data?.message || "Failed to schedule reminder", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="space-y-3">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Reminders</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{reminders.length} reminders • {rules.length} automation rules • Daily 8am WAT</p>
        </div>
        <div className="flex gap-2">
          {topTab === "automation" ? (
            <Button onClick={() => { setEditingRule(null); setRuleForm({ name: "Before due — WhatsApp", trigger: "before_due", offset_days: 3, channel: "whatsapp", template: "Hello {{customer_name}}, friendly reminder: invoice {{invoice_number}} for {{amount_due}} due on {{due_date}}. Pay: {{payment_link}}", language: "auto", enabled: true }); setRuleOpen(true) }} className="gap-2"><Zap className="w-4 h-4" /> New Automation</Button>
          ) : (
            <Button onClick={() => setOpen(true)}>Create Reminder</Button>
          )}
        </div>
      </div>

      {/* Top tabs: Automation vs History */}
      <div className="flex gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-700 w-fit">
        <button onClick={() => setTopTab("automation")} className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${topTab === "automation" ? "bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}><Settings2 className="w-4 h-4" /> Automation</button>
        <button onClick={() => setTopTab("history")} className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${topTab === "history" ? "bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}><History className="w-4 h-4" /> History</button>
      </div>

      {topTab === "automation" ? (
        <div className="space-y-4">
          <Card className="p-4 bg-gradient-to-br from-violet-600 to-brand-600 text-white border-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold flex items-center gap-2"><Zap className="w-4 h-4" /> Set once, collect while you sleep</h3>
                <p className="text-sm text-white/80 mt-1">Rules run daily 8am Africa/Lagos on open invoices. Includes <code className="bg-white dark:bg-slate-800/20 px-1.5 py-0.5 rounded text-xs">{"{{payment_link}}"}</code> (Paystack) + customer preferred language (ha/yo/ig/en). One click queues for all matching invoices.</p>
              </div>
              <Button variant="secondary" onClick={() => runRule(undefined)} disabled={!!running} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:bg-slate-700/50 gap-2">
                <Play className="w-4 h-4" /> {running === "all" ? "Running…" : "Run all enabled now"}
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800/20">Before due: -3d WhatsApp (Hausa friendly)</span>
              <span className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800/20">On due: SMS</span>
              <span className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800/20">+3d / +7d after: WhatsApp + Voice</span>
            </div>
          </Card>

          {rulesLoading ? <Skeleton className="h-32 w-full" /> : rules.length === 0 ? (
            <Card className="p-8 text-center">
              <Zap className="w-8 h-8 mx-auto text-violet-600" />
              <h3 className="font-semibold mt-3">No automation yet</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Create 3 rules and never chase manually again. Try presets below.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button variant="secondary" onClick={async () => {
                  const presets = [
                    { name: "3 days before due — WhatsApp (friendly)", trigger: "before_due" as const, offset_days: 3, channel: "whatsapp", template: "Hello {{customer_name}}, friendly reminder: invoice {{invoice_number}} for {{amount_due}} due {{due_date}}. Pay: {{payment_link}}", language: "auto", enabled: true },
                    { name: "On due date — SMS", trigger: "on_due" as const, offset_days: 0, channel: "sms", template: "Hi {{customer_name}}, invoice {{invoice_number}} due TODAY {{due_date}}: {{amount_due}}. Pay: {{payment_link}}", language: "auto", enabled: true },
                    { name: "3 days overdue — WhatsApp (firm)", trigger: "after_due" as const, offset_days: 3, channel: "whatsapp", template: "Hello {{customer_name}}, invoice {{invoice_number}} for {{amount_due}} is 3 days overdue. Pay now: {{payment_link}} — Thank you!", language: "auto", enabled: true },
                  ]
                  for (const p of presets) { try { await createReminderRule(p) } catch {} }
                  loadRules(); push("3 preset rules created — edit templates to add Hausa/Yoruba", "success")
                }}>Create 3 presets in 1 click</Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-3">
              {rules.map(r => (
                <Card key={r.id} className={`p-4 ${r.enabled ? "border-violet-200 bg-violet-50/50" : "opacity-60"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-[240px]">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${r.enabled ? "bg-emerald-50 dark:bg-emerald-950/300 animate-pulse" : "bg-slate-300"}`} />
                        <h4 className="font-semibold text-sm">{r.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${r.enabled ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300" : "bg-white dark:bg-slate-800"}`}>{r.enabled ? "Enabled" : "Paused"}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <span className="px-2 py-1 rounded-full bg-white dark:bg-slate-800 border capitalize">{r.trigger.replace("_", " ")} • {r.offset_days}d • {r.channel}</span>
                        <span className="px-2 py-1 rounded-full bg-white dark:bg-slate-800 border">Lang: {r.language}</span>
                        <span className="px-2 py-1 rounded-full bg-white dark:bg-slate-800 border">ID: {r.id.slice(0, 8)}</span>
                      </div>
                      <div className="mt-2 p-2 rounded-xl bg-white dark:bg-slate-800 border text-xs text-slate-700 dark:text-slate-300 font-mono line-clamp-2">{r.template}</div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button variant="secondary" onClick={() => toggleRule(r)} className="gap-1.5 text-xs h-8 px-2.5"><Power className="w-3.5 h-3.5" /> {r.enabled ? "Pause" : "Enable"}</Button>
                      <Button variant="secondary" onClick={() => { setEditingRule(r); setRuleForm({ name: r.name, trigger: r.trigger, offset_days: r.offset_days, channel: r.channel, template: r.template, language: r.language, enabled: r.enabled }); setRuleOpen(true) }} className="text-xs h-8 px-2.5">Edit</Button>
                      <Button onClick={() => runRule(r.id)} disabled={!!running} className="gap-1.5 text-xs h-8 px-2.5 bg-brand-600 hover:bg-brand-700"><Play className="w-3.5 h-3.5" /> {running === r.id ? "Queuing…" : "Run now"}</Button>
                      <Button variant="ghost" onClick={() => removeRule(r.id)} className="h-8 w-8 p-0 text-red-600 dark:text-red-400"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* History tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-1">
            {(["all", "queued", "sent", "failed", "cancelled"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t as any)}
                className={`px-3 py-2 rounded-full text-xs font-medium border capitalize whitespace-nowrap ${tab === t ? "bg-slate-900 text-white border-slate-900" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"}`}
              >
                {t} — {t === "all" ? reminders.length : reminders.filter(r => r.status === t).length}
              </button>
            ))}
          </div>

          <Card className="overflow-hidden">
            <div className="scroll-x">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left">Invoice</th>
                    <th className="text-right">Amount</th>
                    <th>Due</th>
                    <th>Channel</th>
                    <th>Status</th>
                    <th>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(r => (
                    <tr key={r.id} className="border-t hover:bg-slate-50 dark:bg-slate-700/50">
                      <td className="p-3 font-medium">{r.customerName || "—"}</td>
                      <td className="font-mono text-xs">{r.invoiceNumber || "—"}</td>
                      <td className="text-right">{formatCurrency(r.amount)}</td>
                      <td className="text-xs">{r.dueDate ? formatDate(r.dueDate) : "—"}</td>
                      <td className="text-xs capitalize text-center">{r.channel}</td>
                      <td className="text-center"><StatusBadge status={r.status} /></td>
                      <td className="text-xs">{r.sentAt ? formatDate(r.sentAt) : "—"}</td>
                    </tr>
                  ))}
                  {list.length === 0 && reminders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-0 border-0">
                        <div className="p-6">
                          <EmptyReminders onCreate={() => { setTopTab("automation"); setRuleOpen(true) }} />
                        </div>
                      </td>
                    </tr>
                  ) : list.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        No reminders match this filter.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Manual single reminder modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Create reminder (manual)">
        <div className="space-y-3">
          <Select
            label="Invoice"
            value={selInv || openInvoices[0]?.id || ""}
            onChange={e => setSelInv(e.target.value)}
            options={openInvoices.map(i => ({
              value: i.id,
              label: `${i.number} — ${i.customerName} — ${formatCurrency(i.balance)}`
            }))}
          />
          <Select
            label="Channel"
            value={channel}
            onChange={e => setChannel(e.target.value)}
            options={[
              { value: "whatsapp", label: "WhatsApp" },
              { value: "sms", label: "SMS" },
              { value: "email", label: "Email" },
            ]}
          />
          <Textarea label="Message template" value={tpl} onChange={e => setTpl(e.target.value)} />
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Variables: {"{{customer_name}}"} {"{{business_name}}"} {"{{invoice_number}}"} {"{{amount_due}}"} {"{{due_date}}"} {"{{payment_link}}"}
          </div>
          {currentInv && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border">
              <div className="text-xs font-medium">Live preview (with pay link)</div>
              <div className="text-sm mt-1 text-slate-700 dark:text-slate-300 break-words">{previewMessage}</div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save reminder"}</Button>
          </div>
        </div>
      </Modal>

      {/* Automation rule modal */}
      <Modal open={ruleOpen} onClose={() => { setRuleOpen(false); setEditingRule(null) }} title={editingRule ? "Edit automation rule" : "New automation rule"}>
        <div className="space-y-3">
          <Input label="Rule name" value={ruleForm.name} onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })} placeholder="e.g. 3 days after due — WhatsApp (firm)" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Trigger" value={ruleForm.trigger} onChange={e => setRuleForm({ ...ruleForm, trigger: e.target.value as any })} options={[{ value: "before_due", label: "Before due" }, { value: "on_due", label: "On due" }, { value: "after_due", label: "After due" }]} />
            <Input label="Offset days" type="number" value={String(ruleForm.offset_days)} onChange={e => setRuleForm({ ...ruleForm, offset_days: Number(e.target.value) || 0 })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Channel" value={ruleForm.channel} onChange={e => setRuleForm({ ...ruleForm, channel: e.target.value })} options={[{ value: "whatsapp", label: "WhatsApp" }, { value: "sms", label: "SMS" }, { value: "email", label: "Email" }, { value: "voice", label: "Voice" }]} />
            <Select label="Language" value={ruleForm.language} onChange={e => setRuleForm({ ...ruleForm, language: e.target.value })} options={[{ value: "auto", label: "auto (customer preferred)" }, { value: "en", label: "en" }, { value: "ha", label: "ha — Hausa" }, { value: "yo", label: "yo — Yoruba" }, { value: "ig", label: "ig — Igbo" }, { value: "pcm", label: "pcm — Pidgin" }]} />
          </div>
          <Textarea label="Template (use {{payment_link}})" value={ruleForm.template} onChange={e => setRuleForm({ ...ruleForm, template: e.target.value })} rows={4} />
          <div className="text-xs text-slate-500 dark:text-slate-400">Vars: {"{{customer_name}}"} {"{{invoice_number}}"} {"{{amount_due}}"} {"{{due_date}}"} {"{{payment_link}}"} — pay link = /pay/:id</div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ruleForm.enabled} onChange={e => setRuleForm({ ...ruleForm, enabled: e.target.checked })} /> Enabled (runs daily 8am)</label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setRuleOpen(false); setEditingRule(null) }} disabled={saving}>Cancel</Button>
            <Button onClick={saveRule} disabled={saving}>{saving ? "Saving…" : editingRule ? "Update rule" : "Create rule"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
