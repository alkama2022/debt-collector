import { config } from "../config"

type ApiOpts = RequestInit & { auth?: boolean }

export async function apiFetch<T>(path: string, opts: ApiOpts = {}): Promise<T> {
  const token = localStorage.getItem("cn_token")
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  }
  if (opts.auth !== false && token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${config.apiBaseUrl}${path}`, { ...opts, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // Structured error contract: {success:false, message, errors}
    throw { status: res.status, data }
  }
  return data as T
}

// TODO: Replace mock hooks with apiFetch when backend is ready.
// Example: export const listCustomers = () => apiFetch<{data:Customer[]}>("/customers")

// Analytics stubs — no PII
export const track = (event: string, props?: Record<string, unknown>) => {
  if ((import.meta as any).env.DEV) console.log("[analytics]", event, props)
  // TODO: wire to analytics provider
}
