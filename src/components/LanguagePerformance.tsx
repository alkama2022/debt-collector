import { useEffect, useState } from "react"
import { Card } from "./ui/card"
import { Badge, LanguageBadge } from "./ui/badge"
import { BarChart3, TrendingUp, AlertCircle, Volume2 } from "lucide-react"
import { liveLanguageMetrics } from "../services/live"
import type { LanguageMetric } from "../services/live"

/**
 * §24 — language quality monitoring.
 *
 * Every figure is computed server-side from collected data. Languages with no
 * activity show 0 rather than being hidden, because "we have never collected
 * in Igbo" is itself a finding a business owner needs to see.
 */
function Metric({ label, value, suffix = "%" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold tabular-nums">
        {value}
        {value > 0 && <span className="text-xs font-normal text-slate-500">{suffix}</span>}
      </div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{label}</div>
    </div>
  )
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
      <div
        className="h-full rounded-full bg-brand-600 dark:bg-brand-400 transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

export function LanguagePerformance() {
  const [metrics, setMetrics] = useState<LanguageMetric[] | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    liveLanguageMetrics()
      .then(r => {
        if (!active) return
        setMetrics(r.metrics || [])
        setNote(r.note || null)
      })
      .catch(e => {
        if (!active) return
        setError("Metrics unavailable — the API is not reachable.")
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-brand-600 animate-spin" />
          Loading language performance…
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-5">
        <div className="flex gap-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      </Card>
    )
  }

  const withActivity = (metrics || []).filter(m => m.comm_total > 0 || m.customers > 0)

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start gap-2">
        <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shrink-0">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold">Language performance</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Collection outcomes per customer language, computed from your data.
          </p>
        </div>
      </div>

      {withActivity.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
          No collection activity recorded yet. Metrics appear once messages are sent.
        </p>
      ) : (
        <>
          {/* Responsive: cards on phones, table from lg up */}
          <div className="grid gap-3 lg:hidden">
            {withActivity.map(m => (
              <div key={m.code} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <LanguageBadge code={m.code} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{m.native_name}</span>
                  {m.quality_status && m.quality_status !== "production" && (
                    <Badge tone="warning">{m.quality_status}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Metric label="Response rate" value={m.response_rate} />
                  <Metric label="Payment conversion" value={m.payment_conversion_rate} />
                  <Metric label="Escalation rate" value={m.escalation_rate} />
                  <Metric label="Customers" value={m.customers} suffix="" />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block scroll-x">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="text-left p-3">Language</th>
                  <th className="text-right">Customers</th>
                  <th className="text-left w-[160px]">Response rate</th>
                  <th className="text-right">Payment conversion</th>
                  <th className="text-right">Escalation</th>
                  <th className="text-right">Human corrections</th>
                  <th className="text-right">Voice completion</th>
                </tr>
              </thead>
              <tbody>
                {withActivity.map(m => (
                  <tr key={m.code} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <LanguageBadge code={m.code} />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{m.native_name}</span>
                      </div>
                    </td>
                    <td className="text-right tabular-nums">{m.customers}</td>
                    <td className="pr-3">
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums text-xs w-10">{m.response_rate}%</span>
                        <Bar value={m.response_rate} />
                      </div>
                    </td>
                    <td className="text-right tabular-nums">{m.payment_conversion_rate}%</td>
                    <td className="text-right tabular-nums">{m.escalation_rate}%</td>
                    <td className="text-right tabular-nums">{m.human_correction_rate}%</td>
                    <td className="text-right tabular-nums">
                      {m.voice_calls > 0 ? `${m.voice_completion_rate}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {note && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-start gap-1.5">
          <Volume2 className="w-3.5 h-3.5 shrink-0 mt-px" /> {note}
        </p>
      )}
    </Card>
  )
}
