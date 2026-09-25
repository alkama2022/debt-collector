import { createContext, useContext, useEffect, useState } from "react"
import type { AppUser } from "../types"
import { apiFetch, clearSession, track } from "../services/api"
import { config } from "../config"

type AuthCtx = {
  user: AppUser | null
  login: (email: string, password: string) => Promise<void>
  signup: (data: { name: string; email: string; password: string; orgName?: string }) => Promise<void>
  logout: () => void
  /** Switch the active org. Updates cn_org_id and re-fetches /me to sync state. */
  switchOrg: (orgId: string) => Promise<void>
  /** Update the stored AppUser.org in-place (called after a PATCH /organizations/<pk>). */
  updateOrg: (patch: Partial<AppUser["org"]>) => void
  loading: boolean
}

const Ctx = createContext<AuthCtx>(null as any)

// Raw shapes returned by the backend
type RawOrg = { id: string; slug: string; name: string; country: string; currency: string; timezone?: string }
type RawUser = { id: string; email: string; name: string; org?: RawOrg | null }
type Paginated<T> = { count: number; results: T[] }

/** Build an AppUser from a RawUser that already includes org (from login/signup/me responses) */
function buildAppUserFromRaw(rawUser: RawUser, org: RawOrg | null | undefined): AppUser {
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
}

/** After login/signup: set tokens then return an AppUser */
async function buildAppUser(accessToken: string): Promise<AppUser> {
  // Always set the token first so subsequent requests are authenticated
  localStorage.setItem("cn_token", accessToken)

  // Step 1: Get real user data + org from /auth/me (org is now included in the response)
  try {
    const meRes = await apiFetch<{ success: boolean; data: RawUser & { org?: RawOrg | null } }>("/auth/me")
    const rawUser = meRes.data
    const org = rawUser.org ?? null
    if (org) localStorage.setItem("cn_org_id", org.id)
    return buildAppUserFromRaw(rawUser, org)
  } catch {
    // Fallback: decode from JWT
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
      const rawUser: RawUser = { id: payload.user_id || payload.id || "", email: payload.email || "", name: payload.name || "" }
      return buildAppUserFromRaw(rawUser, null)
    } catch {}
    return { id: "", name: "User", email: "", role: "owner", org: { id: "", name: config.appName, type: "business", country: config.countryDefault, currency: config.currencyDefault as AppUser["org"]["currency"] } }
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
      const res = await apiFetch<{
        success: boolean
        data: { user: RawUser & { org?: RawOrg | null }; access: string; refresh: string }
      }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }), auth: false }
      )
      localStorage.setItem("cn_refresh", res.data.refresh)
      // Set token immediately so buildAppUser's /me call is authenticated
      localStorage.setItem("cn_token", res.data.access)
      // Use the org already embedded in the response — no extra /organizations request needed
      const org = res.data.user.org ?? null
      if (org) localStorage.setItem("cn_org_id", org.id)
      const appUser = buildAppUserFromRaw(res.data.user, org)
      setUser(appUser)
      track("login_completed")
    } finally {
      setLoading(false)
    }
  }

  const signup = async (data: { name: string; email: string; password: string; orgName?: string }) => {
    setLoading(true)
    try {
      const res = await apiFetch<{
        success: boolean
        data: { user: RawUser & { org?: RawOrg | null }; access: string; refresh: string }
      }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password, org_name: data.orgName || data.name }),
        auth: false,
      })
      localStorage.setItem("cn_refresh", res.data.refresh)
      localStorage.setItem("cn_token", res.data.access)
      const org = res.data.user.org ?? null
      if (org) localStorage.setItem("cn_org_id", org.id)
      const appUser = buildAppUserFromRaw(res.data.user, org)
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

  const switchOrg = async (orgId: string) => {
    // 1. Ask the backend to validate membership and return full org data
    const res = await apiFetch<{
      success: boolean
      data: RawOrg & { role: string }
    }>(`/organizations/${orgId}/switch`, { method: "POST" })

    const rawOrg = res.data
    // 2. Persist new active org
    localStorage.setItem("cn_org_id", orgId)
    // 3. Update the AppUser in state — keep everything else, just swap the org
    setUser(prev => {
      if (!prev) return prev
      const updated: AppUser = {
        ...prev,
        role: (rawOrg.role as AppUser["role"]) ?? prev.role,
        org: {
          id: rawOrg.id,
          name: rawOrg.name,
          type: "business",
          country: rawOrg.country ?? prev.org.country,
          currency: (rawOrg.currency as AppUser["org"]["currency"]) ?? prev.org.currency,
        },
      }
      localStorage.setItem("cn_user", JSON.stringify(updated))
      return updated
    })
    track("org_switched", { org_id: orgId })
  }

  const updateOrg = (patch: Partial<AppUser["org"]>) => {
    setUser(prev => {
      if (!prev) return prev
      const updated: AppUser = { ...prev, org: { ...prev.org, ...patch } }
      localStorage.setItem("cn_user", JSON.stringify(updated))
      return updated
    })
  }

  return (
    <Ctx.Provider value={{ user, login, signup, logout, switchOrg, updateOrg, loading }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
