import * as React from "react"
export function Modal({open,onClose,title,children}:{open:boolean;onClose:()=>void;title:string;children:React.ReactNode}){
  if(!open) return null
  return <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-soft max-h-[90vh] overflow-auto m-0 sm:m-4">
      <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center" aria-label="Close">×</button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
}
