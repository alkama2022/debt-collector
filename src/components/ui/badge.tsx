export function Badge({children,tone="neutral",className=""}:{children:React.ReactNode,tone?:"neutral"|"success"|"warning"|"danger"|"info",className?:string}){
  const map={
    neutral:"bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600",
    success:"bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    warning:"bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    danger:"bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    info:"bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
  }[tone]
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${map} ${className}`}>{children}</span>
}

export function LanguageBadge({code, label}:{code: string, label?: string}){
  const tones: Record<string, "info"|"success"|"warning"|"neutral"> = {en:"neutral", ha:"info", yo:"warning", ig:"success", pcm:"info"}
  const tone = tones[code] ?? "neutral"
  const display: Record<string,string> = {en:"English", ha:"Hausa", yo:"Yorùbá", ig:"Igbo", pcm:"Pidgin", ff:"Fula", kr:"Kanuri", tiv:"Tiv"}
  return <Badge tone={tone}><span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" /> {label ?? display[code] ?? code.toUpperCase()}</Badge>
}
export function StatusBadge({status}:{status:string}){
  const s=status.toLowerCase()
  if(["paid","successful","sent"].includes(s)) return <Badge tone="success">{status}</Badge>
  if(["pending","scheduled","partial","sent"].includes(s)) return <Badge tone="warning">{status}</Badge>
  if(["overdue","failed","cancelled"].includes(s)) return <Badge tone="danger">{status}</Badge>
  return <Badge tone="neutral">{status}</Badge>
}
