/**
 * useDemoSeed — seeds demo data the first time a user lands on the dashboard.
 * Only fires once per org (tracked in localStorage).
 * Runs silently in the background — never blocks the UI.
 */
import { useEffect, useRef } from "react"
import { useAuth } from "./useAuth"
import { useStore } from "../services/store"
import { seedDemoWorkspace } from "../services/demo"
import { apiFetch } from "../services/api"

export function useDemoSeed() {
  const { user } = useAuth()
  const { customers, loading, refresh } = useStore()
  const seeded = useRef(false)

  useEffect(() => {
    if (seeded.current) return
    if (!user?.org?.id) return
    if (loading) return

    const orgId = user.org.id
    const alreadySeeded = localStorage.getItem(`cn_demo_seeded_${orgId}`) === "1"
    if (alreadySeeded) return

    // Only seed if the org has no customers yet
    if (customers.length > 0) {
      // Mark as seeded so we don't check again
      localStorage.setItem(`cn_demo_seeded_${orgId}`, "1")
      return
    }

    seeded.current = true

    // Seed async — never blocks UI
    ;(async () => {
      try {
        await seedDemoWorkspace(orgId)
        // Refresh store so new data appears without page reload
        await refresh()
      } catch {
        // Silent fail — demo seed is non-critical
      }
    })()
  }, [user, customers.length, loading, refresh])
}

// Component wrapper
export function DemoSeeder() {
  useDemoSeed()
  return null
}
