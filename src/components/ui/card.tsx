export function Card({className="",...p}: React.HTMLAttributes<HTMLDivElement>){ return <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card dark:shadow-softDark transition-colors ${className}`} {...p} /> }
export function CardHeader({className="",...p}: React.HTMLAttributes<HTMLDivElement>){ return <div className={`p-5 ${className}`} {...p} /> }
export function CardContent({className="",...p}: React.HTMLAttributes<HTMLDivElement>){ return <div className={`p-5 pt-0 ${className}`} {...p} /> }
