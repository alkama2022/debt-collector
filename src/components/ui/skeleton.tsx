export function Skeleton({className=""}:{className?:string}){ return <div className={`animate-pulse bg-slate-200 rounded ${className}`} /> }
export function StatSkeleton(){ return <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"><Skeleton className="h-4 w-24"/><Skeleton className="h-7 w-32"/><Skeleton className="h-3 w-20"/></div>}
