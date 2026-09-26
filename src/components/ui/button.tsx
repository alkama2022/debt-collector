import * as React from "react"
export function Button({variant="primary",size="md",className="",...props}: React.ButtonHTMLAttributes<HTMLButtonElement> & {variant?:"primary"|"secondary"|"ghost"|"danger",size?:"sm"|"md"|"lg"}){
  const base="inline-flex items-center justify-center text-center gap-2 font-medium rounded-xl transition disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 touch-manipulation"
  const variants={
    primary:"bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 shadow-sm",
    secondary:"bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700",
    ghost:"text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
    danger:"bg-red-600 text-white hover:bg-red-700"
  }[variant]
  // `sm` keeps a compact 40px box for pointer devices but grows to the 44px
  // touch minimum on coarse pointers; `md`/`lg` are already comfortable.
  const sizes={
    sm:"min-h-[40px] px-3 text-sm [@media(pointer:coarse)]:min-h-[44px]",
    md:"min-h-[44px] px-4 sm:px-5 text-[15px]",
    lg:"min-h-[48px] px-5 sm:px-7 text-[15px] sm:text-base",
  }[size]
  return <button className={`${base} ${variants} ${sizes} ${className}`} {...props} />
}
