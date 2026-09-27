import { useState } from 'react'
import { AwardCard, type AwardIconKind } from './AwardCard'
import { useSwipeNavigation } from '../logic/useSwipeNavigation'

export interface FinalScoretableCard {
  icon: AwardIconKind
  title: string
  subtitle: string
  playerNames: string[]
}

interface FinalScoretableCardsProps {
  cards: FinalScoretableCard[]
}

// A plain paginated deck - no transition/animation between cards
// (deliberately, per the host: "just the cards"), just Prev/Next, dots, and
// (per later feedback) a swipe gesture as a third way to move between them.
// Pure browsing within itself - the caller (06-Results.tsx) renders this
// alongside GameStatsCard and owns the single "Continue to Scoreboard"
// action for both, since the host asked for the two to read as one combined
// screen rather than separate steps each gated behind their own button.
export function FinalScoretableCards({ cards }: FinalScoretableCardsProps) {
  const [index, setIndex] = useState(0)
  const swipeHandlers = useSwipeNavigation(
    () => setIndex((i) => Math.min(i + 1, cards.length - 1)),
    () => setIndex((i) => Math.max(i - 1, 0))
  )

  if (cards.length === 0) return null

  const card = cards[index]
  const atStart = index === 0
  const atEnd = index === cards.length - 1

  return (
    <div>
      <div {...swipeHandlers}>
        <AwardCard {...card} />
      </div>

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
    </div>
  )
}
