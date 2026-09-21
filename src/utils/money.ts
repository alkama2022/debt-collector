// Money helpers: backend is source of truth. Frontend display only.
export const calcInvoiceTotals = (items: { quantity: number; unitPrice: number; discount?: number; tax?: number }[]) => {
  let subtotal = 0
  let discount = 0
  let tax = 0
  for (const it of items) {
    const line = it.quantity * it.unitPrice
    subtotal += line
    discount += it.discount ?? 0
    tax += it.tax ?? 0
  }
  const total = subtotal - discount + tax
  return { subtotal, discount, tax, total }
}
