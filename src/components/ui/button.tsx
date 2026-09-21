import * as React from "react"
export function Button({variant="primary",size="md",className="",...props}: React.ButtonHTMLAttributes<HTMLButtonElement> & {variant?:"primary"|"secondary"|"ghost"|"danger",size?:"sm"|"md"|"lg"}){
  const base="inline-flex items-center justify-center font-medium rounded-xl transition disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
  const variants={primary:"bg-brand-600 text-white hover:bg-brand-700 shadow-sm",secondary:"bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",ghost:"text-slate-600 hover:bg-slate-100",danger:"bg-red-600 text-white hover:bg-red-700"}[variant]
  const sizes={sm:"h-9 px-3 text-sm",md:"h-11 px-5 text-[15px] min-h-[44px]",lg:"h-12 px-7 text-[15px]"}[size]
  return <button className={`${base} ${variants} ${sizes} ${className}`} {...props} />
}
