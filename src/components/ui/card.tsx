export function Card({className="",...p}: React.HTMLAttributes<HTMLDivElement>){ return <div className={`bg-white rounded-2xl border border-slate-200 shadow-card ${className}`} {...p} /> }
export function CardHeader({className="",...p}: React.HTMLAttributes<HTMLDivElement>){ return <div className={`p-5 ${className}`} {...p} /> }
export function CardContent({className="",...p}: React.HTMLAttributes<HTMLDivElement>){ return <div className={`p-5 pt-0 ${className}`} {...p} /> }
