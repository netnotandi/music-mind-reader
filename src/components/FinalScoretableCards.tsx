import { useEffect, useState } from 'react'
import { AwardCard, type AwardIconKind } from './AwardCard'

export interface FinalScoretableCard {
  icon: AwardIconKind
  title: string
  subtitle: string
  playerNames: string[]
}

interface FinalScoretableCardsProps {
  cards: FinalScoretableCard[]
  // Reports "done browsing" - the caller decides what that means (here,
  // 06-Results.tsx calls the existing returnToLobby()). This component
  // never touches game state itself.
  onContinue: () => void
}

// A plain paginated deck - no swipe gesture, no transition/animation
// (deliberately, per the host: "just the cards"), just Prev/Next and dots.
export function FinalScoretableCards({ cards, onContinue }: FinalScoretableCardsProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    // Nobody qualified for any title (e.g. no ratings exist yet) - skip
    // straight past the empty deck rather than showing a blank screen.
    if (cards.length === 0) onContinue()
  }, [cards.length, onContinue])

  if (cards.length === 0) return null

  const card = cards[index]
  const atStart = index === 0
  const atEnd = index === cards.length - 1

  return (
    <div>
      <AwardCard {...card} />

      <div className="mt-4 flex items-center justify-center gap-2">
        {cards.map((c, i) => (
          <button
            key={c.icon}
            type="button"
            aria-label={`Card ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 w-2 rounded-full transition ${i === index ? 'bg-primary' : 'bg-border-strong'}`}
          />
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={atStart}
          onClick={() => setIndex((i) => i - 1)}
          className="flex-1 rounded-xl border border-border-strong px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Previous
        </button>
        <button
          type="button"
          disabled={atEnd}
          onClick={() => setIndex((i) => i + 1)}
          className="flex-1 rounded-xl border border-border-strong px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next →
        </button>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-4 w-full rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active"
      >
        Continue to Scoreboard
      </button>
    </div>
  )
}
