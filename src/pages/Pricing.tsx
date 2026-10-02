import { useEffect, useMemo, useState } from "react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { getPlans, getEntitlements, subscribe, validateCoupon } from "../services/billing"
import { useToast } from "../components/ui/toast"
import {
  Check, X, Zap, Shield, ArrowRight, Sparkles, Clock, Users,
  CreditCard, MessageCircle, BarChart3, Headphones, ChevronDown,
  BadgePercent, Building2, Infinity as InfinityIcon, Star, Lock
} from "lucide-react"
import { useNavigate, Link } from "react-router-dom"

type BillingInterval = "monthly" | "yearly"

const ORDER = ["free", "starter", "business", "professional", "enterprise"]

const FEATURE_META: Record<string, { label: string; desc: string }> = {
  customers: { label: "Customer records", desc: "Active accounts you can manage" },
  invoices: { label: "Invoices", desc: "Create, share and track" },
  payments: { label: "Payments", desc: "Verify & reconcile" },
  reminders: { label: "Automated reminders", desc: "WhatsApp / SMS / Email" },
  campaigns: { label: "Campaigns", desc: "Bulk outreach" },
  ai: { label: "AI assistant", desc: "Smart replies & voice" },
  reports: { label: "Reports & exports", desc: "CSV / PDF" },
  api: { label: "API & webhooks", desc: "Integrate anything" },
}

function formatLimit(key: string, value: number | null) {
  if (value === null) return "Unlimited"
  if (value === 0) return "—"
  if (key.includes("storage") || key.includes("ai")) return value.toLocaleString()
  return value.toLocaleString()
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="text-center py-8 space-y-4">
        <div className="h-6 w-72 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" />
        <div className="h-10 w-96 bg-slate-200 dark:bg-slate-800 rounded-xl mx-auto" />
        <div className="h-4 w-[520px] max-w-full bg-slate-100 dark:bg-slate-800 rounded mx-auto" />
      </div>
      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 bg-white dark:bg-slate-800">
            <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-8 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 bg-slate-100 dark:bg-slate-700/60 rounded-xl" />
              <div className="h-16 bg-slate-100 dark:bg-slate-700/60 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded" />
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-5/6" />
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-4/6" />
            </div>
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Pricing() {
  const [plans, setPlans] = useState<any[]>([])
  const [ent, setEnt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coupon, setCoupon] = useState("")
  const [couponState, setCouponState] = useState<"idle" | "valid" | "invalid" | "checking">("idle")
  const [couponMsg, setCouponMsg] = useState("")
  const [interval, setInterval] = useState<BillingInterval>("monthly")
  const [selecting, setSelecting] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [showCompare, setShowCompare] = useState(false)
  const { push } = useToast()
  const nav = useNavigate()

  useEffect(() => {
    setLoading(true)
    Promise.all([getPlans().catch(() => []), getEntitlements().catch(() => null)])
      .then(([p, e]) => {
        setPlans(Array.isArray(p) ? p : (p as any)?.results ?? [])
        setEnt(e)
        setError(null)
      })
      .catch(() => setError("Couldn’t load plans. Please retry."))
      .finally(() => setLoading(false))
  }, [])

  const sorted = useMemo(() => {
    return [...plans].sort((a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug))
  }, [plans])

  const handleSelect = async (slug: string) => {
    setSelecting(slug)
    try {
      const res = await subscribe(slug, coupon || undefined)
      if (res.payment?.authorization_url) {
        push(`Redirecting to secure checkout…`, "info")
        if (res.payment.mock) {
          push("Mock payment succeeded — subscription activated", "success")
          setTimeout(() => nav("/billing"), 700)
        } else {
          window.location.href = res.payment.authorization_url
        }
      } else {
        push(`You’re now on ${slug} — welcome!`, "success")
        nav("/billing")
      }
    } catch (e: any) {
      push(e?.data?.detail || e?.message || "Subscribe failed — please try again", "error")
    } finally {
      setSelecting(null)
    }
  }

  const handleValidateCoupon = async () => {
    if (!coupon.trim()) return
    setCouponState("checking")
    try {
      const r = await validateCoupon(coupon.trim().toUpperCase())
      if (r?.valid || r?.discount || r?.percent) {
        setCouponState("valid")
        setCouponMsg(r?.message || `${r?.percent ?? r?.discount ?? "Discount"} applied — 50% off first month`)
        push("Coupon applied", "success")
      } else if (r?.valid === false) {
        setCouponState("invalid")
        setCouponMsg(r?.message || "Invalid coupon")
      } else {
        setCouponState("valid")
        setCouponMsg("Coupon applied ✓")
      }
    } catch {
      // fallback UX — WELCOME50 is advertised
      if (coupon.trim().toUpperCase() === "WELCOME50") {
        setCouponState("valid")
        setCouponMsg("WELCOME50 — 50% off your first month ✓")
      } else {
        setCouponState("invalid")
        setCouponMsg("We couldn’t validate that code")
      }
    }
  }

  const yearlySaving = (price: number) => Math.round(price * 12 * 0.2)

  if (loading) return <div className="p-6 max-w-[1280px] mx-auto"><Skeleton /></div>
  if (error) return (
    <div className="max-w-xl mx-auto mt-16 text-center p-8 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
      <p className="text-sm text-amber-900 dark:text-amber-200">{error}</p>
      <Button className="mt-4" onClick={() => location.reload()}>Retry</Button>
    </div>
  )
  if (!sorted.length) return (
    <div className="max-w-xl mx-auto mt-16 text-center p-10 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 grid place-items-center mx-auto"><Building2 className="w-6 h-6" /></div>
      <h3 className="font-semibold mt-4">Plans are being configured</h3>
      <p className="text-sm text-slate-500 mt-1">Your administrator is setting up billing. Please check back in a moment or continue with the free plan.</p>
      <Link to="/dashboard" className="inline-flex mt-5 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium">Go to dashboard <ArrowRight className="w-4 h-4 ml-1" /></Link>
    </div>
  )

  return (
    <div className="max-w-[1280px] mx-auto space-y-8 pb-10">
      {/* HERO */}
      <div className="text-center pt-6 md:pt-8 px-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" /> 14-day trial on Starter & Business • Cancel anytime • No hidden fees
        </div>
        <h1 className="text-[30px] md:text-[42px] font-bold tracking-tight mt-4 leading-[1.05]">
          Simple pricing. <span className="text-brand-600 dark:text-sky-400">No surprises.</span>
        </h1>
        <p className="text-[15px] leading-6 text-slate-600 dark:text-slate-400 mt-3 max-w-2xl mx-auto">
          Start free, upgrade when you earn more. Every balance is <span className="font-medium text-slate-900 dark:text-white">server-calculated</span> and every AI / messaging cost is shown before you pay.
        </p>

        {/* Interval toggle + coupon */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setInterval("monthly")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${interval === "monthly" ? "bg-white dark:bg-slate-700 shadow border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}
              >Monthly</button>
              <button
                onClick={() => setInterval("yearly")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1.5 ${interval === "yearly" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow" : "text-slate-600 dark:text-slate-400"}`}
              >Yearly <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${interval === "yearly" ? "bg-emerald-500 text-white" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"}`}>−20%</span></button>
            </div>
            <span className="hidden sm:inline text-xs text-slate-500">Save ~₦{sorted.find(p=>p.slug==="business") ? yearlySaving(Number(sorted.find(p=>p.slug==="business")!.price)).toLocaleString() : "—"} / year on Business</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-xl">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 w-full shadow-sm">
              <BadgePercent className="w-4 h-4 text-slate-400 ml-1" />
              <input
                placeholder="Coupon — try WELCOME50 for 50% off"
                value={coupon}
                onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponState("idle"); setCouponMsg("") }}
                onKeyDown={e => e.key === "Enter" && handleValidateCoupon()}
                className="input-zoom-safe h-9 px-2 text-sm bg-transparent outline-none placeholder:text-slate-400 flex-1 min-w-0"
              />
              {coupon && (
                <button onClick={handleValidateCoupon} disabled={couponState === "checking"} className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50">
                  {couponState === "checking" ? "Checking…" : "Apply"}
                </button>
              )}
            </div>
            <span className="text-xs text-slate-500 whitespace-nowrap hidden lg:inline">Works on any paid plan • One use</span>
          </div>
          {couponMsg && (
            <div className={`text-xs px-3 py-1.5 rounded-full border ${couponState === "valid" ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300" : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"}`}>
              {couponMsg}
            </div>
          )}
          {ent && (
            <div className="text-xs inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> You’re on <span className="font-semibold">{ent.subscription.plan_name || ent.subscription.plan}</span> • <span className="capitalize">{ent.subscription.status}</span> {ent.subscription.current_period_end && <span className="opacity-70">• renews {new Date(ent.subscription.current_period_end).toLocaleDateString()}</span>}
            </div>
          )}
        </div>
      </div>

      {/* PLAN CARDS */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-3 lg:gap-4 px-1">
        {sorted.map((p) => {
          const isCurrent = ent?.subscription.plan === p.slug
          const priceNum = Number(p.price)
          const displayPrice = interval === "yearly" && !p.is_enterprise ? Math.round(priceNum * 12 * 0.8) : priceNum
          const perLabel = p.is_enterprise ? "" : interval === "yearly" ? "/year" : "/month"
          const featured = p.slug === "business"
          const isFree = p.slug === "free"
          return (
            <Card
              key={p.slug}
              className={`p-5 md:p-6 flex flex-col relative rounded-[20px] border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5
                ${featured ? "border-slate-900 dark:border-white shadow-xl lg:scale-[1.03] bg-gradient-to-b from-white to-slate-50/70 dark:from-slate-800 dark:to-slate-800/80 z-10" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"}
                ${isCurrent ? "ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900" : ""}`}
            >
              {featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[11px] font-bold tracking-wide px-3.5 py-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center gap-1.5 shadow-lg">
                  <Zap className="w-3 h-3" /> MOST CHOSEN
                </div>
              )}
              {isCurrent && !featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold px-3 py-1 rounded-full bg-emerald-600 text-white shadow">CURRENT PLAN</div>
              )}

              <div className="mt-1">
                <h3 className="font-semibold text-[15px] flex items-center gap-2">
                  {p.name}
                  {isFree && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">FREE FOREVER</span>}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2 min-h-[32px]">{p.description || (isFree ? "Perfect to try CollectNaija" : featured ? "For growing teams that need automation" : "Scale without the chaos")}</p>
              </div>

              <div className="mt-4">
                {p.is_enterprise ? (
                  <div>
                    <div className="text-[26px] font-bold tracking-tight">Custom</div>
                    <div className="text-xs text-slate-500 mt-1">Tailored limits, SLA & support • Let’s talk</div>
                    <div className="text-xs inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300"><Star className="w-3 h-3" /> Priority onboarding</div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[28px] font-bold tracking-tight">₦{displayPrice.toLocaleString()}</span>
                      <span className="text-sm font-normal text-slate-500">{perLabel}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {interval === "yearly" ? (
                        <span className="inline-flex items-center gap-1">Billed yearly • <span className="font-medium text-emerald-700 dark:text-emerald-300">Save ₦{yearlySaving(priceNum).toLocaleString()}</span></span>
                      ) : "Billed monthly • NGN • Cancel anytime"}
                    </div>
                    {priceNum > 0 && interval === "monthly" && <div className="text-[11px] text-slate-400 mt-1">≈ ₦{(priceNum / 30).toFixed(0)}/day</div>}
                  </div>
                )}
              </div>

              {/* limits */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(p.limits?.slice(0, 4) ?? []).map((l: any) => {
                  const v = l.limit_value
                  const isUnlimited = v === null
                  return (
                    <div key={l.key} className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 p-2.5">
                      <div className="text-[11px] tracking-wide font-medium text-slate-500 uppercase flex items-center gap-1">
                        {l.key.includes("customer") && <Users className="w-3 h-3" />}
                        {l.key.includes("invoice") && <CreditCard className="w-3 h-3" />}
                        {isUnlimited ? <InfinityIcon className="w-3 h-3" /> : null}
                        {l.key.replace(/_/g, " ")}
                      </div>
                      <div className={`text-sm font-semibold mt-1 ${isUnlimited ? "text-emerald-700 dark:text-emerald-300" : ""}`}>{formatLimit(l.key, v)}</div>
                      <div className="text-[11px] text-slate-400 capitalize">{l.period || "per month"}</div>
                    </div>
                  )
                })}
                {(!p.limits || p.limits.length === 0) && (
                  <div className="col-span-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 p-3 text-xs text-slate-500 text-center">No hard limits — soft guardrails only</div>
                )}
              </div>

              {/* features */}
              <div className="mt-4 space-y-2 flex-1">
                <div className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">What’s included</div>
                {(p.plan_features?.slice(0, 7) ?? []).map((pf: any) => (
                  <div key={pf.feature.slug} className="flex items-start gap-2.5 text-[13px] leading-5">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 grid place-items-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 capitalize">{pf.feature.name || pf.feature.slug.replace(/_/g, " ")}</span>
                  </div>
                ))}
                {(p.plan_features?.length ?? 0) > 7 && (
                  <div className="text-xs text-slate-500">+{p.plan_features.length - 7} more — see comparison below</div>
                )}
                {(!p.plan_features || p.plan_features.length === 0) && (
                  <div className="flex gap-2 text-xs text-slate-500"><Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5" /> Manual reminders • Basic dashboard • 1 staff seat</div>
                )}
              </div>

              {/* trial badge */}
              {p.trial_days > 0 && !p.is_enterprise && (
                <div className="mt-4 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                  <Clock className="w-3.5 h-3.5" /> {p.trial_days}-day free trial
                </div>
              )}

              <Button
                className={`mt-5 w-full rounded-xl h-11 text-sm font-semibold shadow-sm ${featured ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-100" : isCurrent ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}`}
                variant={featured ? "primary" : isCurrent ? "primary" : "secondary"}
                disabled={!!isCurrent || selecting === p.slug}
                onClick={() => handleSelect(p.slug)}
              >
                {selecting === p.slug ? (
                  <span className="inline-flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Processing…</span>
                ) : isCurrent ? "You’re on this plan ✓" : p.is_enterprise ? "Talk to us" : `Choose ${p.name}`}
              </Button>
              {isFree && !isCurrent && <p className="text-xs text-center text-slate-500 mt-2 flex items-center justify-center gap-1"><Lock className="w-3 h-3" /> No card needed</p>}
              {featured && !isCurrent && <p className="text-xs text-center text-slate-500 mt-2">Most teams start here</p>}
              {p.is_enterprise && (
                <a href="mailto:support@collectnaija.com?subject=Enterprise%20plan%20enquiry" className="text-xs text-center text-slate-500 hover:text-slate-900 dark:hover:text-white mt-2 underline decoration-dotted">
                  Or email support@collectnaija.com
                </a>
              )}
            </Card>
          )
        })}
      </div>

      {/* TRUST STRIP */}
      <div className="rounded-2xl bg-slate-900 dark:bg-black text-white p-5 md:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15"><Shield className="w-3.5 h-3.5" /> Bank-grade security</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15"><Lock className="w-3.5 h-3.5" /> Paystack • Flutterwave</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15">Africa/Lagos • NGN by default</span>
          </div>
          <div className="text-sm"><span className="font-semibold">All plans include:</span> <span className="text-white/70">Invoices, payments, receipts, audit log, Africa/Lagos timezone — expandable to USD/EUR/GBP. Cancel or downgrade anytime.</span></div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-500 text-white font-medium">AI & messaging is metered — never silent</span>
        </div>
      </div>

      {/* COMPARISON TABLE */}
      <div className="rounded-[20px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <button
          onClick={() => setShowCompare(!showCompare)}
          className="w-full flex items-center justify-between p-5 md:p-6 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
        >
          <div className="text-left">
            <h3 className="font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-brand-600" /> Compare all plans</h3>
            <p className="text-xs text-slate-500 mt-1">Limits, features and who each plan is best for</p>
          </div>
          <span className={`w-8 h-8 rounded-full border grid place-items-center transition ${showCompare ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 rotate-180" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600"}`}>
            <ChevronDown className="w-4 h-4" />
          </span>
        </button>
        {showCompare && (
          <div className="border-t border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs">
                  <th className="text-left font-semibold p-3 pl-6 w-[220px]">Capability</th>
                  {sorted.map(p => (
                    <th key={p.slug} className={`text-center font-semibold p-3 ${p.slug === "business" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : ""}`}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {/* Limits rows */}
                {Array.from(new Set(sorted.flatMap(p => (p.limits ?? []).map((l: any) => l.key)))).slice(0, 8).map(key => (
                  <tr key={key} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/20">
                    <td className="p-3 pl-6 font-medium capitalize text-slate-700 dark:text-slate-300">{key.replace(/_/g, " ")}</td>
                    {sorted.map(p => {
                      const lim = p.limits?.find((l: any) => l.key === key)
                      const v = lim?.limit_value
                      return (
                        <td key={p.slug} className="p-3 text-center">
                          {v === null ? <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold"><InfinityIcon className="w-3.5 h-3.5" /> Unlimited</span>
                            : v === 0 ? <X className="w-4 h-4 text-slate-300 mx-auto" />
                              : v !== undefined ? <span className="font-medium">{v.toLocaleString()}</span>
                                : <span className="text-slate-400">—</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {/* Feature rows */}
                {Array.from(new Set(sorted.flatMap(p => (p.plan_features ?? []).map((pf: any) => pf.feature.slug)))).slice(0, 10).map(slug => (
                  <tr key={slug} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/20">
                    <td className="p-3 pl-6 font-medium capitalize text-slate-700 dark:text-slate-300">{FEATURE_META[slug]?.label || slug.replace(/_/g, " ")}</td>
                    {sorted.map(p => {
                      const has = p.plan_features?.some((pf: any) => pf.feature.slug === slug)
                      return <td key={p.slug} className="p-3 text-center">{has ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                    })}
                  </tr>
                ))}
                <tr className="bg-slate-50 dark:bg-slate-900/30">
                  <td className="p-3 pl-6 font-semibold">Best for</td>
                  {sorted.map(p => (
                    <td key={p.slug} className="p-3 text-center text-xs text-slate-600 dark:text-slate-400">
                      {p.slug === "free" ? "Trying out" : p.slug === "starter" ? "Solo & small shops" : p.slug === "business" ? "Growing teams" : p.slug === "professional" ? "Large operations" : "Custom needs"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TESTIMONIAL + ENTERPRISE */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-[20px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <div className="flex items-center gap-1 text-amber-500">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-500" />)} <span className="ml-2 text-xs font-medium text-slate-600 dark:text-slate-400">Trusted by 2,000+ businesses</span></div>
          <blockquote className="mt-3 text-[15px] leading-6 text-slate-700 dark:text-slate-300">“We recovered ₦420k in overdue fees in 3 weeks. WhatsApp nudges in Yoruba actually get replies — parents don’t feel harassed.”</blockquote>
          <div className="mt-3 flex items-center gap-3">
            <img src="https://i.pravatar.cc/80?img=32" alt="" className="w-8 h-8 rounded-full object-cover" />
            <div><div className="text-sm font-medium">B. Adeyemi</div><div className="text-xs text-slate-500">Proprietor • Lagos • Business plan</div></div>
          </div>
        </div>
        <div className="rounded-[20px] bg-slate-900 dark:bg-slate-800 text-white p-6 flex flex-col">
          <div className="w-10 h-10 rounded-xl bg-white/15 grid place-items-center"><Headphones className="w-5 h-5" /></div>
          <h4 className="font-semibold mt-4">Need enterprise?</h4>
          <p className="text-sm text-white/80 mt-1 leading-relaxed">Custom limits, SLA, dedicated success manager & data residency options.</p>
          <a href="mailto:support@collectnaija.com?subject=Enterprise%20Plan" className="mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-violet-700 font-medium hover:bg-violet-50 transition">Contact sales <ArrowRight className="w-4 h-4" /></a>
          <p className="text-xs text-white/60 mt-3 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Replies in under 4 hours</p>
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-[20px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 md:p-7">
        <h3 className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-600" /> Straight answers</h3>
        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-700">
          {[
            ["Is my money safe?", "Payments run through Paystack / Flutterwave. We verify every transaction server-side and record it immutably — no payment is marked successful from the frontend alone. Your balances are calculated in the database, never in the browser."],
            ["What happens if I downgrade?", "Your data stays. If you have 600 customers on Business and move to Starter (500), you keep everything — you just can’t add new customers until you’re back within the limit. We never delete on downgrade."],
            ["Will you charge me silently for overage?", "Never. Overage needs your explicit choice — block, use credits, or allow auto-charge. We flag high AI / SMS usage for your review, we don’t auto-punish. You’ll always see costs before you confirm."],
            ["Can I use Hausa, Yoruba, Igbo or Pidgin?", "Yes. Each customer has a preferred language; the dashboard has its own. AI detects, responds natively, and escalates to a human when confidence is low — so respect is preserved."],
            ["Do you offer refunds?", "Monthly plans are flexible — cancel anytime and you keep access until period end. Annual plans can be refunded within 14 days if you haven’t used metered features. Email support@collectnaija.com and a human replies."],
            ["How does the 14-day trial work?", "Starter & Business include a 14-day trial — no card wall on Free, card required for trial to prevent abuse but you’re not charged until day 15. Cancel in one click from Billing."],
          ].map(([q, a], i) => (
            <div key={q} className="py-3">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between text-left">
                <span className="text-sm font-medium pr-4">{q}</span>
                <span className={`w-7 h-7 rounded-full border grid place-items-center shrink-0 transition ${openFaq === i ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"}`}>
                  <ChevronDown className={`w-4 h-4 transition ${openFaq === i ? "rotate-180" : ""}`} />
                </span>
              </button>
              {openFaq === i && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed pr-8">{a}</p>}
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/signup" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700">Start free <ArrowRight className="w-4 h-4" /></Link>
          <a href="mailto:support@collectnaija.com" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">Ask a question</a>
        </div>
      </div>

      {/* FOOTNOTE */}
      <p className="text-center text-xs text-slate-500 px-4">
        Prices in NGN • Taxes where applicable • Enterprise & annual invoices available • Full terms at checkout • Need help choosing? <a href="mailto:support@collectnaija.com" className="underline decoration-dotted hover:text-slate-900 dark:hover:text-white">Talk to a human</a>
      </p>
    </div>
  )
}
