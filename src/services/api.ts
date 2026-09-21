import { config } from "../config"

type ApiOpts = RequestInit & { auth?: boolean; orgId?: string | null }

/** Low-level fetch wrapper. Attaches Bearer token and X-Org-Id header automatically. */
export async function apiFetch<T>(path: string, opts: ApiOpts = {}): Promise<T> {
  const token = localStorage.getItem("cn_token")
  const orgId = opts.orgId !== undefined ? opts.orgId : localStorage.getItem("cn_org_id")

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  }

  if (opts.auth !== false && token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  if (orgId) {
    headers["X-Org-Id"] = orgId
  }
  // Nigerian Multilingual — send org language context
  const orgLang = typeof localStorage !== "undefined" ? (localStorage.getItem("cn_dashboard_lang") || localStorage.getItem("cn_lang")) : null
  if (orgLang && !headers["X-Org-Language"] && !headers["Accept-Language"]) {
    headers["X-Org-Language"] = orgLang
    headers["Accept-Language"] = orgLang
  }

  const res = await fetch(`${config.apiBaseUrl}${path}`, { ...opts, headers })

  // Token expired — attempt silent refresh once
  if (res.status === 401 && opts.auth !== false) {
    const refreshed = await tryRefreshToken()
    if (refreshed) {
      headers["Authorization"] = `Bearer ${localStorage.getItem("cn_token")}`
      const retry = await fetch(`${config.apiBaseUrl}${path}`, { ...opts, headers })
      const retryData = await retry.json().catch(() => ({}))
      if (!retry.ok) throw { status: retry.status, data: retryData }
      return retryData as T
    }
    // Refresh failed — clear session and redirect to login
    clearSession()
    window.location.href = "/login"
    throw { status: 401, data: {} }
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw { status: res.status, data }
  return data as T
}

async function tryRefreshToken(): Promise<boolean> {
  const refresh = localStorage.getItem("cn_refresh")
  if (!refresh) return false
  try {
    const res = await fetch(`${config.apiBaseUrl.replace("/v1", "")}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    })
    if (!res.ok) return false
    const data = await res.json()
    if (data.access) {
      localStorage.setItem("cn_token", data.access)
      if (data.refresh) localStorage.setItem("cn_refresh", data.refresh)
      return true
    }
    return false
  } catch {
    return false
  }
}

export function clearSession() {
  localStorage.removeItem("cn_token")
  localStorage.removeItem("cn_refresh")
  localStorage.removeItem("cn_user")
  localStorage.removeItem("cn_org_id")
}

// Analytics stub — no PII
export const track = (event: string, props?: Record<string, unknown>) => {
  if ((import.meta as any).env.DEV) console.log("[analytics]", event, props)
}
