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
// Fast rise (rays are already near full size/brightness a fifth of the way
// in - "arrive sooner"), a long hold at full brightness, then a fade at the
// very end - rather than a single linear grow-and-fade that read as gone
// almost as soon as it appeared.
const SUNBURST_MS = 2000
const GLOW_MS = 2300

// A one-shot entrance for the game's overall winner, built with the Web
// Animations API directly (no library) so it resets cleanly every time this
// component mounts fresh - the card spins in (rotateY + scale-up from
// nothing), and the instant it settles, two burst layers fire from behind
// it: a thin, dense sunburst (a repeating-conic-gradient used as a mask over
// a white-to-gold radial-gradient, so each ray is bright at the card and
// fades to gold/orange further out) for the "light rays" look, plus a
// softer blurred ring in the app's own brand gradient (cyan/violet/pink,
// same var()s AwardCard's own winner-ring icon already uses) for color.
// Wraps AwardCard rather than reimplementing it - same card, just with this
// choreography around it.
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
          { transform: 'scale(0.4) rotate(0deg)', opacity: 1, offset: 0 },
          { transform: 'scale(1.6) rotate(8deg)', opacity: 1, offset: 0.2 },
          { transform: 'scale(2.1) rotate(18deg)', opacity: 1, offset: 0.7 },
          { transform: 'scale(2.8) rotate(25deg)', opacity: 0, offset: 1 },
        ],
        { duration: SUNBURST_MS, easing: 'ease-out', fill: 'forwards' }
      )
      glowRef.current?.animate(
        [
          { transform: 'scale(0.5)', opacity: 0.9, offset: 0 },
          { transform: 'scale(1.4)', opacity: 0.9, offset: 0.2 },
          { transform: 'scale(1.8)', opacity: 0.9, offset: 0.7 },
          { transform: 'scale(2.2)', opacity: 0, offset: 1 },
        ],
        { duration: GLOW_MS, easing: 'ease-out', fill: 'forwards' }
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
            // The conic-gradient only controls WHICH thin wedges are visible
            // (mask alpha) - the actual color comes from the radial-gradient
            // background underneath, so each ray is bright white at the
            // card and fades to gold/orange further out, not a flat white
            // wedge end to end.
            background: 'radial-gradient(circle, #ffffff 0%, #ffe9b0 30%, #ffb84d 60%, transparent 82%)',
            WebkitMaskImage: 'repeating-conic-gradient(#000 0deg 1.2deg, transparent 1.2deg 8deg)',
            maskImage: 'repeating-conic-gradient(#000 0deg 1.2deg, transparent 1.2deg 8deg)',
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
