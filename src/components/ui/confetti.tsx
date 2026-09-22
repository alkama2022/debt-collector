import { useEffect, useState } from "react"

const COLORS = ["#0f4c81", "#059669", "#d97706", "#7c3aed", "#db2777", "#f59e0b", "#10b981"]
const EMOJIS = ["🎉", "💸", "✅", "🎊", "💰"]

export function ConfettiBurst({ trigger, onDone }: { trigger: number; onDone?: () => void }) {
  const [show, setShow] = useState(false)
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (trigger === 0) return
    setKey(k => k + 1)
    setShow(true)
    // haptic
    try { navigator.vibrate?.([40, 30, 40]) } catch {}
    const t = setTimeout(() => { setShow(false); onDone?.() }, 2200)
    return () => clearTimeout(t)
  }, [trigger, onDone])

  if (!show) return null
  return (
    <div key={key} aria-hidden className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {/* CSS confetti pieces */}
      {Array.from({ length: 28 }).map((_, i) => {
        const left = 10 + Math.random() * 80
        const delay = Math.random() * 0.3
        const duration = 1.6 + Math.random() * 0.9
        const size = 8 + Math.random() * 10
        const color = COLORS[i % COLORS.length]
        const rot = Math.random() * 360
        return (
          <span
            key={`c-${i}`}
            style={{
              left: `${left}%`,
              top: `-12px`,
              width: size,
              height: size * 0.6,
              background: color,
              transform: `rotate(${rot}deg)`,
              animation: `cn-fall ${duration}s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}s forwards`,
              borderRadius: i % 3 === 0 ? "50%" : "2px",
            }}
            className="absolute"
          />
        )
      })}
      {/* Emoji burst */}
      {Array.from({ length: 8 }).map((_, i) => {
        const left = 15 + Math.random() * 70
        const delay = 0.2 + Math.random() * 0.4
        const size = 22 + Math.random() * 14
        return (
          <span key={`e-${i}`} style={{ left: `${left}%`, top: "18%", fontSize: size, animation: `cn-float 1.8s ease-out ${delay}s forwards` }} className="absolute opacity-0">
            {EMOJIS[i % EMOJIS.length]}
          </span>
        )
      })}
      <style>{`
        @keyframes cn-fall {
          0% { transform: translateY(0) rotate(0deg) translateX(0); opacity:1; }
          80% { opacity:1; }
          100% { transform: translateY(92vh) rotate(720deg) translateX(${Math.random() > 0.5 ? "" : "-"}${20 + Math.random()*40}px); opacity:0; }
        }
        @keyframes cn-float {
          0% { transform: translateY(0) scale(0.6); opacity:0; }
          18% { opacity:1; }
          100% { transform: translateY(-42px) scale(1.1); opacity:0; }
        }
      `}</style>
    </div>
  )
}

export function useConfetti() {
  const [trigger, setTrigger] = useState(0)
  const burst = () => setTrigger(t => t + 1)
  return { trigger, burst, Confetti: (props: { onDone?: () => void }) => <ConfettiBurst trigger={trigger} onDone={props.onDone} /> }
}
