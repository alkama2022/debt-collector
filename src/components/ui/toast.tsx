import { createContext, useContext, useState } from "react"
type Toast={id:number;msg:string;tone?:"success"|"error"|"info"}
const Ctx=createContext<{push:(m:string,t?:Toast["tone"])=>void}>(null as any)
export function ToastProvider({children}:{children:React.ReactNode}){
  const [toasts,setToasts]=useState<Toast[]>([])
  const push=(msg:string,tone:Toast["tone"]="info")=>{
    const id=Date.now(); setToasts(t=>[...t,{id,msg,tone}]); setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3000)
  }
  return <Ctx.Provider value={{push}}>
    {children}
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(t=><div key={t.id} className={`px-4 py-3 rounded-xl shadow-soft dark:shadow-softDark text-sm font-medium border backdrop-blur ${t.tone==="success"?"bg-emerald-600 text-white border-emerald-700":t.tone==="error"?"bg-red-600 text-white border-red-700":"bg-slate-900 dark:bg-slate-800 text-white border-slate-700"}`}>{t.msg}</div>)}
    </div>
  </Ctx.Provider>
}
export const useToast=()=>useContext(Ctx)
