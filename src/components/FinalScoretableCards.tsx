import { useState } from 'react'
import { AwardCard, type AwardIconKind } from './AwardCard'

export interface FinalScoretableCard {
  icon: AwardIconKind
  title: string
  subtitle: string
  playerNames: string[]
}

interface FinalScoretableCardsProps {
  cards: FinalScoretableCard[]
}

// A plain paginated deck - no swipe gesture, no transition/animation
// (deliberately, per the host: "just the cards"), just Prev/Next and dots.
// Pure browsing within itself - the caller (06-Results.tsx) renders this
// alongside GameStatsCard and owns the single "Continue to Scoreboard"
// action for both, since the host asked for the two to read as one combined
// screen rather than separate steps each gated behind their own button.
export function FinalScoretableCards({ cards }: FinalScoretableCardsProps) {
  const [index, setIndex] = useState(0)

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
    </div>
  )
}
