/**
 * usePaymentPolling — polls /payments every 30 seconds.
 * When a new successful payment arrives that wasn't in the previous snapshot,
 * it dispatches an in-app notification, plays a sound and optionally
 * triggers confetti.
 *
 * Only active when the user is authenticated and has an org.
 */
import { useEffect, useRef, useCallback } from "react"
import { listPayments } from "../services/live"
import { playPaymentSound } from "../utils/sounds"
import { useStore } from "../services/store"
import { useAuth } from "./useAuth"

const POLL_INTERVAL_MS = 30_000   // 30 seconds
const SOUND_ENABLED_KEY = "cn_sound_enabled"

function isSoundEnabled(): boolean {
  try { return localStorage.getItem(SOUND_ENABLED_KEY) !== "0" }
  catch { return true }
}

export function usePaymentPolling() {
  const { user } = useAuth()
  const { refresh } = useStore()
  const knownPaymentIds = useRef<Set<string>>(new Set())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRun = useRef(true)

  const poll = useCallback(async () => {
    if (!user || !localStorage.getItem("cn_token")) return
    if (!localStorage.getItem("cn_org_id")) return

    try {
      const res = await listPayments({ status: "successful" })
      const incoming = res.results ?? []

      if (isFirstRun.current) {
        // Seed known IDs on first run — no notifications for existing payments
        incoming.forEach(p => knownPaymentIds.current.add(p.id))
        isFirstRun.current = false
        return
      }

      // Find truly new payments
      const newPayments = incoming.filter(p => !knownPaymentIds.current.has(p.id))

      if (newPayments.length > 0) {
        // Update known set
        newPayments.forEach(p => knownPaymentIds.current.add(p.id))

        // Play sound
        if (isSoundEnabled()) {
          playPaymentSound()
        }

        // Refresh the store so all pages reflect the new payments immediately
        await refresh()

        // Dispatch browser notification if user has granted permission
        if (Notification.permission === "granted") {
          const total = newPayments.reduce((a, p) => a + Number(p.amount), 0)
          const names = newPayments.map(p => p.invoice?.toString().slice(0, 8) ?? "").join(", ")
          new Notification("💰 Payment received!", {
            body: `₦${total.toLocaleString()} received${names ? ` — ${names}` : ""}`,
            icon: "/favicon.ico",
          })
        }
      }
    } catch {
      // Silent fail — polling errors should not interrupt the user
    }
  }, [user, refresh])

  useEffect(() => {
    if (!user) return

    // Request notification permission once
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {})
    }

    // Kick off first poll then schedule repeating
    poll()
    timerRef.current = setInterval(poll, POLL_INTERVAL_MS)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      isFirstRun.current = true
      knownPaymentIds.current.clear()
    }
  }, [user, poll])
}

// Component wrapper so it can be dropped into the tree
export function PaymentPoller() {
  usePaymentPolling()
  return null
}
