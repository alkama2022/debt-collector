import { Routes, Route, Navigate } from "react-router-dom"
import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Onboarding from "./pages/Onboarding"
import Dashboard from "./pages/Dashboard"
import Customers from "./pages/Customers"
import CustomerDetail from "./pages/CustomerDetail"
import Invoices from "./pages/Invoices"
import InvoiceDetail from "./pages/InvoiceDetail"
import Payments from "./pages/Payments"
import Reminders from "./pages/Reminders"
import Reports from "./pages/Reports"
import Settings from "./pages/Settings"
import AppShell from "./layouts/AppShell"
import { useAuth } from "./hooks/useAuth"

function Protected({children}:{children:React.ReactNode}){
  const {user}=useAuth()
  if(!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
export default function App(){
  return <Routes>
    <Route path="/" element={<Landing/>} />
    <Route path="/login" element={<Login/>} />
    <Route path="/signup" element={<Signup/>} />
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
      <Route path="/settings" element={<Settings/>} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
