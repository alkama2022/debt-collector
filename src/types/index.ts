export type Currency = "NGN" | "USD" | "GHS" | "KES" | "ZAR" | "GBP"

export type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "overdue" | "cancelled"
export type PaymentStatus = "pending" | "successful" | "failed" | "refunded"
export type ReminderStatus = "scheduled" | "sent" | "failed" | "cancelled"
export type ReminderChannel = "whatsapp" | "sms" | "email"

export interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  customerId: string
  totalInvoiced: number
  totalPaid: number
  outstanding: number
  overdue: number
  status: "active" | "archived"
  createdAt: string
  preferredLanguage?: string
  languageHistory?: { code: string; changed_at: string; changed_by?: string }[]
}

export interface InvoiceItem { id: string; description: string; quantity: number; unitPrice: number; discount?: number; tax?: number }
export interface Invoice {
  id: string
  number: string
  customerId: string
  customerName: string
  issueDate: string
  dueDate: string
  status: InvoiceStatus
  items: InvoiceItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  amountPaid: number
  balance: number
  currency: Currency
}

export interface Payment {
  id: string
  invoiceId: string
  invoiceNumber: string
  customerName: string
  amount: number
  currency: Currency
  method: string
  reference: string
  status: PaymentStatus
  date: string
  notes?: string
}

export interface Reminder {
  id: string
  customerName: string
  invoiceNumber: string
  amount: number
  dueDate: string
  channel: ReminderChannel
  status: ReminderStatus
  sentAt?: string
  scheduledAt: string
}

export interface Org {
  id: string
  name: string
  type: string
  country: string
  currency: Currency
}

export interface AppUser {
  id: string
  name: string
  email: string
  role: "owner" | "admin" | "finance_manager" | "staff" | "viewer"
  avatar?: string
  org: Org
}

export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string[]>
}
