import { createContext, useContext, useEffect, useState } from "react"
import type { AppUser } from "../types"
import { apiFetch, clearSession, track } from "../services/api"
import { config } from "../config"

type AuthCtx = {
  user: AppUser | null
  login: (email: string, password: string) => Promise<void>
  signup: (data: { name: string; email: string; password: string }) => Promise<void>
  logout: () => void
  loading: boolean
}

const Ctx = createContext<AuthCtx>(null as any)

// Raw shapes returned by the backend
type RawOrg = { id: string; slug: string; name: string; country: string; currency: string; timezone: string }
type RawUser = { id: string; email: string; name: string }
type Paginated<T> = { count: number; results: T[] }

/** After login/signup: fetch real user + org data from the API */
async function buildAppUser(accessToken: string): Promise<AppUser> {
  // Always set the token first so subsequent requests are authenticated
  localStorage.setItem("cn_token", accessToken)

  // Step 1: Get real user data from /auth/me
  let rawUser: RawUser = { id: "", email: "", name: "" }
  try {
    const meRes = await apiFetch<{ success: boolean; data: RawUser }>("/auth/me")
    rawUser = meRes.data
  } catch {
    // Fallback: decode from JWT (only has user_id, no email)
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
      rawUser = { id: payload.user_id || payload.id || "", email: payload.email || "", name: payload.name || "" }
    } catch {}
  }

  // Step 2: Get user's organization
  try {
    const orgs = await apiFetch<Paginated<RawOrg>>("/organizations")
    const org = orgs.results?.[0]
    if (org) {
      localStorage.setItem("cn_org_id", org.id)
    }
    return {
      id: rawUser.id,
      name: rawUser.name || rawUser.email.split("@")[0],
      email: rawUser.email,
      role: "owner",
      org: org
        ? {
            id: org.id,
            name: org.name,
            type: "business",
            country: org.country,
            currency: org.currency as AppUser["org"]["currency"],
          }
        : {
            id: "",
            name: config.appName,
            type: "business",
            country: config.countryDefault,
            currency: config.currencyDefault as AppUser["org"]["currency"],
          },
    }
  } catch {
    // No org yet — fresh signup before onboarding
    return {
      id: rawUser.id,
      name: rawUser.name || rawUser.email.split("@")[0],
      email: rawUser.email,
      role: "owner",
      org: {
        id: "",
        name: config.appName,
        type: "business",
        country: config.countryDefault,
        currency: config.currencyDefault as AppUser["org"]["currency"],
      },
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    const raw = localStorage.getItem("cn_user")
    if (raw) try { return JSON.parse(raw) } catch {}
    return null
  })
  const [loading, setLoading] = useState(false)

  // Persist user object so it survives page refresh
  useEffect(() => {
    if (user) localStorage.setItem("cn_user", JSON.stringify(user))
  }, [user])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const tokens = await apiFetch<{ access: string; refresh: string }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }), auth: false }
      )
      localStorage.setItem("cn_refresh", tokens.refresh)
      // buildAppUser sets cn_token then calls /auth/me + /organizations
      const appUser = await buildAppUser(tokens.access)
      setUser(appUser)
      track("login_completed")
    } finally {
      setLoading(false)
    }
  }

  const signup = async (data: { name: string; email: string; password: string }) => {
    setLoading(true)
    try {
      const res = await apiFetch<{
        success: boolean
        data: { user: RawUser; access: string; refresh: string }
      }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
        auth: false,
      })
      localStorage.setItem("cn_refresh", res.data.refresh)
      // buildAppUser sets cn_token then calls /auth/me + /organizations
      const appUser = await buildAppUser(res.data.access)
      setUser(appUser)
      track("signup_completed")
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    clearSession()
    setUser(null)
  }

  return (
    <Ctx.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
