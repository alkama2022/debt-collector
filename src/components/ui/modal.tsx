import * as React from "react"

export function Modal({open,onClose,title,children,footer}:{
  open:boolean
  onClose:()=>void
  title:string
  children:React.ReactNode
  footer?:React.ReactNode
}){
  // Escape to dismiss + lock the page behind the sheet.
  React.useEffect(()=>{
    if(!open) return
    const h=(e:KeyboardEvent)=>{ if(e.key==="Escape") onClose() }
    window.addEventListener("keydown",h)
    const prev=document.body.style.overflow
    document.body.style.overflow="hidden"
    return ()=>{ window.removeEventListener("keydown",h); document.body.style.overflow=prev }
  },[open,onClose])

  if(!open) return null
  return <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
    <div className="absolute inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="relative bg-white dark:bg-slate-800 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-soft dark:shadow-softDark max-h-[92dvh] overflow-auto overscroll-contain m-0 sm:m-4 border border-transparent dark:border-slate-700"
    >
      {/* Drag affordance for the phone sheet */}
      <div className="sm:hidden sticky top-0 z-10 bg-white dark:bg-slate-800 pt-2 pb-1 flex justify-center">
        <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
      </div>
      <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-5 py-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-900 dark:text-white min-w-0 break-anywhere">{title}</h3>
        <button onClick={onClose} className="w-9 h-9 shrink-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors text-xl leading-none" aria-label="Close">×</button>
      </div>
      <div className="p-5 pb-safe">{children}</div>
      {footer && <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-5 py-3 flex justify-end gap-2">{footer}</div>}
    </div>
  </div>
}
