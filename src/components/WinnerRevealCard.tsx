import { useEffect, useRef } from 'react'
import { AwardCard, type AwardIconKind } from './AwardCard'
import { pauseForWinnerReveal, resumeAfterWinnerReveal } from '../logic/backgroundMusic'
import { playWinnerCheer } from '../logic/winnerFanfare'

interface WinnerRevealCardProps {
  icon: AwardIconKind
  title: string
  subtitle: string
  playerNames: string[]
  // Called automatically once the whole reveal has played out (see
  // HOLD_AFTER_BURST_MS below) - also wired to a tap anywhere on the card,
  // so someone impatient (or a browser that never fires the burst
  // animation's finish event) always has a way through.
  onContinue: () => void
}

const SPIN_MS = 1300
// Fast rise (rays are already near full size/brightness a fifth of the way
// in - "arrive sooner"), a long hold at full brightness, then a fade at the
// very end - rather than a single linear grow-and-fade that read as gone
// almost as soon as it appeared.
const SUNBURST_MS = 2000
const GLOW_MS = 2300
// How long to sit on the settled, ray-free card after the burst has fully
// faded before moving on by itself - long enough to actually read the
// card, not so long it feels stuck.
const HOLD_AFTER_BURST_MS = 2000

// A one-shot entrance for the game's overall winner, built with the Web
// Animations API directly (no library) so it resets cleanly every time this
// component mounts fresh - the card spins in (rotateY + scale-up from
// nothing), and the instant it settles, two burst layers fire from behind
// it: a thin, dense sunburst (a repeating-conic-gradient used as a mask over
// a white-to-gold radial-gradient, so each ray is bright at the card and
// fades to gold/orange further out) for the "light rays" look, plus a
// softer blurred ring in the app's own brand gradient (cyan/violet/pink,
// same var()s AwardCard's own winner-ring icon already uses) for color. A
// real cheer sound clip (winnerFanfare.ts, one of a handful the host
// dropped into public/sounds/) starts the instant the spin begins. Wraps
// AwardCard rather than reimplementing it - same card, just with this
// choreography around it.
export function WinnerRevealCard({ icon, title, subtitle, playerNames, onContinue }: WinnerRevealCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const sunburstRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  // Kept fresh every render so the one-shot mount effect below (and its
  // setTimeout, which can fire well after the render that scheduled it)
  // always calls whatever onContinue the parent currently has, not a stale
  // one captured at mount.
  const onContinueRef = useRef(onContinue)
  onContinueRef.current = onContinue

  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    let holdTimer: ReturnType<typeof setTimeout> | null = null

    // Starts right as the spin begins, plays out to its own natural end.
    // stopCheer() is called from this effect's own cleanup below, so an
    // early unmount (React's dev-mode double-invoke, or a real early
    // tap-to-skip) can't leave a cheer still playing into the next screen.
    const stopCheer = playWinnerCheer()
    // Ducks the ambient background music (still technically phase:
    // 'results') for the duration of this one card, so it never fights the
    // cheer sound above - resumed in this same effect's cleanup, the moment
    // this card is left behind for nominations/stats.
    pauseForWinnerReveal()

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
      // Moves on by itself once the burst has fully faded and the card's
      // had a couple of quiet seconds on screen - no button needed for the
      // common case. GLOW_MS is the longer of the two burst layers.
      holdTimer = setTimeout(() => onContinueRef.current(), GLOW_MS + HOLD_AFTER_BURST_MS)
    }

    return () => {
      spinAnim.cancel()
      stopCheer()
      resumeAfterWinnerReveal()
      if (holdTimer !== null) clearTimeout(holdTimer)
    }
    // Runs once per mount - the whole point is a clean one-shot every time
    // this card is freshly shown, not something that reruns on prop changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <button
      type="button"
      onClick={onContinue}
      aria-label="Continue"
      className="flex w-full appearance-none flex-col items-center border-0 bg-transparent p-0 text-left"
    >
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
    </button>
  )
}
