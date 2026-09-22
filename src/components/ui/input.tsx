import * as React from "react"
export const Input=React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & {label?:string; error?:string}>(
  ({label,error,className="",id,...props},ref)=>{
    const iid=id||`inp-${Math.random().toString(36).slice(2,7)}`
    return <div className="space-y-1.5">
      {label && <label htmlFor={iid} className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <input ref={ref} id={iid} className={`w-full h-11 px-3.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:focus:border-brand-500 transition-colors ${error?"border-red-300 dark:border-red-700":"border-slate-200 dark:border-slate-700"} ${className}`} {...props} />
      {error && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
    </div>
  }
)
Input.displayName="Input"

export const Textarea=React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & {label?:string; error?:string}>(
  ({label,error,className="",id,...props},ref)=>{
    const iid=id||`ta-${Math.random().toString(36).slice(2,7)}`
    return <div className="space-y-1.5">
      {label && <label htmlFor={iid} className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <textarea ref={ref} id={iid} className={`w-full min-h-[96px] px-3.5 py-3 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors ${error?"border-red-300 dark:border-red-700":"border-slate-200 dark:border-slate-700"} ${className}`} {...props} />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  }
)
Textarea.displayName="Textarea"
export const Select=(props: React.SelectHTMLAttributes<HTMLSelectElement> & {label?:string; error?:string; options:{value:string;label:string}[]})=>{
  const {label,error,options,className="",id,...rest}=props
  const iid=id||`sel-${Math.random().toString(36).slice(2,7)}`
  return <div className="space-y-1.5">
    {label && <label htmlFor={iid} className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
    <select id={iid} className={`w-full h-11 px-3.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[15px] focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors ${error?"border-red-300 dark:border-red-700":"border-slate-200 dark:border-slate-700"} ${className}`} {...rest}>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
  </div>
}
