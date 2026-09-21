import { Button } from "./button"
export function EmptyState({title,desc,action,icon}:{title:string;desc:string;action?:{label:string; onClick:()=>void};icon?:React.ReactNode}){
  return <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
    {icon && <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-500">{icon}</div>}
    <h3 className="font-semibold text-slate-900">{title}</h3>
    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{desc}</p>
    {action && <Button className="mt-5" onClick={action.onClick}>{action.label}</Button>}
  </div>
}
export function ErrorState({message,onRetry}:{message:string;onRetry?:()=>void}){
  return <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
    <p className="text-sm text-red-700 font-medium">{message}</p>
    {onRetry && <Button variant="secondary" className="mt-4" onClick={onRetry}>Try Again</Button>}
  </div>
}
