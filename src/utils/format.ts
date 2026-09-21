import dayjs from "dayjs"

export const formatCurrency = (amount: number, currency = "NGN", locale = "en-NG") => {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

export const formatDate = (iso: string, fmt = "DD MMM YYYY") => dayjs(iso).format(fmt)
export const formatDateTime = (iso: string) => dayjs(iso).format("DD MMM YYYY, h:mm A")

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ")

// Safe money display: values are backend-provided; never compute with float in UI for authoritative totals
export const displayMoney = (value: number, currency = "NGN") => formatCurrency(value, currency)
