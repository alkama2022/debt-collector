import { lazy, Suspense } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./hooks/useAuth"
import AppShell from "./layouts/AppShell"
const Landing = lazy(()=> import("./pages/Landing"))
const Login = lazy(()=> import("./pages/Login"))
const Signup = lazy(()=> import("./pages/Signup"))
const Onboarding = lazy(()=> import("./pages/Onboarding"))
const Dashboard = lazy(()=> import("./pages/Dashboard"))
const Customers = lazy(()=> import("./pages/Customers"))
const CustomerDetail = lazy(()=> import("./pages/CustomerDetail"))
const Invoices = lazy(()=> import("./pages/Invoices"))
const InvoiceDetail = lazy(()=> import("./pages/InvoiceDetail"))
const Payments = lazy(()=> import("./pages/Payments"))
const Reminders = lazy(()=> import("./pages/Reminders"))
const Reports = lazy(()=> import("./pages/Reports"))
const Settings = lazy(()=> import("./pages/Settings"))
const AI = lazy(()=> import("./pages/AI"))
const Languages = lazy(()=> import("./pages/Languages"))
const PayInvoice = lazy(()=> import("./pages/PayInvoice"))
const Pricing = lazy(()=> import("./pages/Pricing"))
const Billing = lazy(()=> import("./pages/Billing"))
const Usage = lazy(()=> import("./pages/Usage"))
const BillingInvoices = lazy(()=> import("./pages/BillingInvoices"))
const AdminBilling = lazy(()=> import("./pages/AdminBilling"))
const Campaigns = lazy(()=> import("./pages/Campaigns"))

function Protected({children}:{children:React.ReactNode}){
  const {user}=useAuth()
  if(!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
function Fallback(){ return <div className="min-h-[50vh] grid place-items-center p-8"><div className="flex items-center gap-3 text-sm text-slate-500"><span className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-brand-600 animate-spin"/> Loading…</div></div> }
export default function App(){
  return <Suspense fallback={<Fallback/>}><Routes>
    <Route path="/" element={<Landing/>} />
    <Route path="/login" element={<Login/>} />
    <Route path="/signup" element={<Signup/>} />
    <Route path="/pay/:id" element={<PayInvoice/>} />
    <Route path="/pricing" element={<Pricing/>} />
    <Route path="/onboarding" element={<Protected><Onboarding/></Protected>} />
    <Route element={<Protected><AppShell/></Protected>}>
      <Route path="/dashboard" element={<Dashboard/>} />
      <Route path="/customers" element={<Customers/>} />
      <Route path="/customers/:id" element={<CustomerDetail/>} />
      <Route path="/invoices" element={<Invoices/>} />
      <Route path="/invoices/:id" element={<InvoiceDetail/>} />
      <Route path="/payments" element={<Payments/>} />
      <Route path="/reminders" element={<Reminders/>} />
      <Route path="/reports" element={<Reports/>} />
      <Route path="/languages" element={<Languages/>} />
      <Route path="/settings" element={<Settings/>} />
      <Route path="/ai" element={<AI/>} />
      <Route path="/pricing" element={<Pricing/>} />
      <Route path="/billing" element={<Billing/>} />
      <Route path="/billing/usage" element={<Usage/>} />
      <Route path="/billing/invoices" element={<BillingInvoices/>} />
      <Route path="/admin/billing" element={<AdminBilling/>} />
      <Route path="/campaigns" element={<Campaigns/>} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>
}
