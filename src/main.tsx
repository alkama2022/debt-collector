import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import "./index.css"
import { AuthProvider } from "./hooks/useAuth"
import { ToastProvider } from "./components/ui/toast"
import { StoreProvider } from "./services/store"
import { ThemeProvider } from "./hooks/useTheme"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <StoreProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </StoreProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
)
