import * as React from "react"
export function Button({variant="primary",size="md",className="",...props}: React.ButtonHTMLAttributes<HTMLButtonElement> & {variant?:"primary"|"secondary"|"ghost"|"danger",size?:"sm"|"md"|"lg"}){
  const base="inline-flex items-center justify-center font-medium rounded-xl transition disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
  const variants={
    primary:"bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 shadow-sm",
    secondary:"bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700",
    ghost:"text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
    danger:"bg-red-600 text-white hover:bg-red-700"
  }[variant]
  const sizes={sm:"h-9 px-3 text-sm",md:"h-11 px-5 text-[15px] min-h-[44px]",lg:"h-12 px-7 text-[15px]"}[size]
  return <button className={`${base} ${variants} ${sizes} ${className}`} {...props} />
}
