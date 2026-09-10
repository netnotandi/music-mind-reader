import { accentColorFor } from '../logic/accentColors'
import { useThemeStore } from '../state/themeStore'

interface SongCardProps {
  title: string
  artist: string
  index: number
  total: number
  // This player still owes a guess/rating for the song shown here. The card
  // (the "environment" around the song) turns pink so it reads at a glance
  // as "you're not done with this one" - see the round-mode straggler flow.
  needsAnswer?: boolean
}

export function SongCard({ title, artist, index, total, needsAnswer = false }: SongCardProps) {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  const accent = accentColorFor(index, resolvedTheme)

  const border = needsAnswer ? 'border-pink' : accent.border
  const bg = needsAnswer ? 'bg-pink/15' : accent.bg
  const label = needsAnswer ? 'text-pink' : accent.text

  return (
    <div className={`rounded-2xl border-2 p-6 text-center ${border} ${bg}`}>
      <p className={`mb-3 text-sm font-semibold ${label}`}>
        Song {index + 1} of {total}
      </p>
      <p className="text-2xl font-bold text-text">{title}</p>
      <p className="mt-1 text-lg text-text-secondary">{artist}</p>
    </div>
  )
}
