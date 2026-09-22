/**
 * sounds.ts — Lightweight Web Audio API sounds. No external files needed.
 * Falls back silently on browsers that block autoplay.
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!ctx) {
    try { ctx = new (window.AudioContext || (window as any).webkitAudioContext)() }
    catch { return null }
  }
  return ctx
}

function playTone(
  freq: number,
  duration: number,
  gain: number,
  type: OscillatorType = "sine",
  startTime = 0
) {
  const ac = getCtx()
  if (!ac) return
  try {
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.connect(g)
    g.connect(ac.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, ac.currentTime + startTime)
    g.gain.setValueAtTime(0, ac.currentTime + startTime)
    g.gain.linearRampToValueAtTime(gain, ac.currentTime + startTime + 0.01)
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startTime + duration)
    osc.start(ac.currentTime + startTime)
    osc.stop(ac.currentTime + startTime + duration)
  } catch { /* ignore */ }
}

/** 🎉 Payment received — a warm two-tone "ding" */
export function playPaymentSound() {
  playTone(880, 0.18, 0.22, "sine", 0)
  playTone(1108, 0.28, 0.18, "sine", 0.12)
}

/** 💬 Reminder sent — a soft single ping */
export function playReminderSound() {
  playTone(660, 0.15, 0.12, "sine", 0)
}

/** ⚠️  Alert / overdue — a subtle descending tone */
export function playAlertSound() {
  playTone(440, 0.12, 0.10, "triangle", 0)
  playTone(330, 0.14, 0.08, "triangle", 0.10)
}
