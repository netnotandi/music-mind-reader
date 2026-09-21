import { useEffect, useRef } from 'react'
import { AwardCard, type AwardIconKind } from './AwardCard'

interface WinnerRevealCardProps {
  icon: AwardIconKind
  title: string
  subtitle: string
  playerNames: string[]
  // Always clickable, even mid-animation - a stuttering animation on a
  // slow device should never be the thing standing between someone and the
  // rest of the game-end flow.
  onContinue: () => void
}

const SPIN_MS = 1300
const BURST_MS = 800

// A one-shot entrance for the game's overall winner, built with the Web
// Animations API directly (no library) so it resets cleanly every time this
// component mounts fresh - the card spins in (rotateY + scale-up from
// nothing), and the instant it settles, two burst layers fire from behind
// it: a sharp white sunburst (repeating-conic-gradient wedges) for the
// "light rays" look, plus a softer blurred ring in the app's own brand
// gradient (cyan/violet/pink, same var()s AwardCard's own winner-ring icon
// already uses) for color. Wraps AwardCard rather than reimplementing it -
// same card, just with this choreography around it.
export function WinnerRevealCard({ icon, title, subtitle, playerNames, onContinue }: WinnerRevealCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const sunburstRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const spinAnim = card.animate(
      [
        { transform: 'perspective(900px) rotateY(720deg) scale(0.35)', opacity: 0 },
        { transform: 'perspective(900px) rotateY(340deg) scale(0.75)', opacity: 1, offset: 0.5 },
        { transform: 'perspective(900px) rotateY(0deg) scale(1)', opacity: 1 },
      ],
      { duration: SPIN_MS, easing: 'cubic-bezier(0.15, 0.8, 0.2, 1)', fill: 'forwards' }
    )

    spinAnim.onfinish = () => {
      sunburstRef.current?.animate(
        [
          { transform: 'scale(0.2) rotate(0deg)', opacity: 0.9 },
          { transform: 'scale(2.8) rotate(25deg)', opacity: 0 },
        ],
        { duration: BURST_MS, easing: 'ease-out', fill: 'forwards' }
      )
      glowRef.current?.animate(
        [
          { transform: 'scale(0.3)', opacity: 0.85 },
          { transform: 'scale(2.2)', opacity: 0 },
        ],
        { duration: BURST_MS + 300, easing: 'ease-out', fill: 'forwards' }
      )
    }

    return () => {
      spinAnim.cancel()
    }
    // Runs once per mount - the whole point is a clean one-shot every time
    // this card is freshly shown, not something that reruns on prop changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <div
          ref={glowRef}
          className="pointer-events-none absolute h-64 w-64 rounded-full opacity-0"
          style={{
            background:
              'conic-gradient(from 0deg, var(--mmr-brand-cyan), var(--mmr-brand-violet), var(--mmr-brand-pink), var(--mmr-brand-cyan))',
            filter: 'blur(28px)',
          }}
        />
        <div
          ref={sunburstRef}
          className="pointer-events-none absolute h-72 w-72 opacity-0"
          style={{
            background:
              'repeating-conic-gradient(rgba(255,255,255,0.95) 0deg 5deg, transparent 5deg 22deg)',
            borderRadius: '9999px',
          }}
        />
        <div ref={cardRef} className="relative w-full max-w-md" style={{ transformStyle: 'preserve-3d' }}>
          <AwardCard icon={icon} title={title} subtitle={subtitle} playerNames={playerNames} />
        </div>
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="mt-6 w-full max-w-md rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active"
      >
        Continue →
      </button>
    </div>
  )
}
