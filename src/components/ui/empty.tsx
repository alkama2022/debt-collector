import { Link } from "react-router-dom"
import { Button } from "./button"
import {
  Users, FileText, CreditCard, Bell, BarChart3,
  ArrowRight, Upload, Plus
} from "lucide-react"

// ─── Generic empty state ─────────────────────────────────────────────────────
export function EmptyState({
  title, desc, action, icon, secondaryAction,
}: {
  title: string
  desc: string
  icon?: React.ReactNode
  action?: { label: string; onClick: () => void }
  secondaryAction?: { label: string; onClick: () => void }
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-10 text-center">
      {icon && (
        <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4 text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">{desc}</p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center mt-5">
        {action && (
          <Button onClick={action.onClick} className="gap-1.5">
            <Plus className="w-4 h-4" /> {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="secondary" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900 p-8 text-center">
      <p className="text-sm text-red-700 dark:text-red-300 font-medium">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}

// ─── Contextual empty states per page ────────────────────────────────────────

export function EmptyCustomers({ onAdd, onImport }: { onAdd: () => void; onImport: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-10 text-center bg-white dark:bg-slate-800">
      <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center mx-auto mb-4">
        <Users className="w-7 h-7 text-violet-600" />
      </div>
      <h3 className="font-semibold text-lg">Add your first customer</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
        Every invoice, payment and reminder is linked to a customer.
        Add one now or import your whole list from Excel in 60 seconds.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center mt-5">
        <Button onClick={onAdd} className="gap-1.5">
          <Plus className="w-4 h-4" /> Add customer
        </Button>
        <Button variant="secondary" onClick={onImport} className="gap-1.5">
          <Upload className="w-4 h-4" /> Import from CSV / Excel
        </Button>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 max-w-xs mx-auto text-xs text-slate-500 dark:text-slate-400">
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border">📞 Phone reminders</div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border">💬 WhatsApp</div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border">📧 Email</div>
      </div>
    </div>
  )
}

export function EmptyInvoices({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-10 text-center bg-white dark:bg-slate-800">
      <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center mx-auto mb-4">
        <FileText className="w-7 h-7 text-brand-600" />
      </div>
      <h3 className="font-semibold text-lg">Create your first invoice</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
        Invoices track what you are owed. Once created, CollectNaija sends
        automated reminders and shows you who still needs to pay — without you lifting a finger.
      </p>
      <Button onClick={onAdd} className="mt-5 gap-1.5">
        <FileText className="w-4 h-4" /> Create invoice
      </Button>
      <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border max-w-sm mx-auto text-left text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
        <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2">What happens after you create one?</div>
        <div className="flex items-start gap-2"><span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">1</span> Invoice is linked to a customer with a due date</div>
        <div className="flex items-start gap-2"><span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">2</span> Automated WhatsApp reminder sent before due date</div>
        <div className="flex items-start gap-2"><span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">3</span> When paid, balance clears and receipt is sent</div>
      </div>
    </div>
  )
}

export function EmptyPayments({ onRecord }: { onRecord: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-10 text-center bg-white dark:bg-slate-800">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-4">
        <CreditCard className="w-7 h-7 text-emerald-600" />
      </div>
      <h3 className="font-semibold text-lg">No payments recorded yet</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
        Record every payment — cash, bank transfer, POS or online — and
        CollectNaija will automatically update the invoice balance and generate a receipt.
      </p>
      <Button onClick={onRecord} className="mt-5 gap-1.5">
        <CreditCard className="w-4 h-4" /> Record payment
      </Button>
      <p className="text-xs text-slate-400 mt-4">
        Tip: Payments from Paystack / Flutterwave are recorded automatically via webhook.
      </p>
    </div>
  )
}

export function EmptyReminders({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-10 text-center bg-white dark:bg-slate-800">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-4">
        <Bell className="w-7 h-7 text-amber-600" />
      </div>
      <h3 className="font-semibold text-lg">No reminders sent yet</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
        Reminders are sent automatically based on your rules — before due dates, on due date,
        and after. You can also send a manual reminder to any customer in one tap.
      </p>
      <Button onClick={onCreate} className="mt-5 gap-1.5">
        <Bell className="w-4 h-4" /> Create reminder rule
      </Button>
      <Link
        to="/settings?tab=reminders"
        className="mt-3 flex items-center justify-center gap-1 text-sm text-brand-600 font-medium hover:underline"
      >
        Configure automation rules <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}

export function EmptyReports() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-10 text-center bg-white dark:bg-slate-800">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mx-auto mb-4">
        <BarChart3 className="w-7 h-7 text-blue-600" />
      </div>
      <h3 className="font-semibold text-lg">No data to report yet</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
        Once you have customers, invoices and payments, your collection rate, cash flow
        chart and top debtors will appear here automatically.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <Link to="/customers" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium">
          <Users className="w-4 h-4" /> Start with customers
        </Link>
      </div>
    </div>
  )
}
