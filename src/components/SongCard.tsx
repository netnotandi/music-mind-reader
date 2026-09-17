import type { ReactNode } from 'react'
import { accentColorFor } from '../logic/accentColors'
import { songLabel } from '../logic/songLabel'
import { useThemeStore } from '../state/themeStore'

interface SongCardProps {
  title: string
  artist: string
  // The YouTube video title, when the player picked a search result - used
  // to fill in for a sparse/empty title or artist so the card never shows a
  // bare "" line.
  youtubeTitle?: string
  index: number
  total: number
  // This player still owes a guess/rating for the song shown here. The card
  // (the "environment" around the song) turns pink so it reads at a glance
  // as "you're not done with this one" - see the round-mode straggler flow.
  needsAnswer?: boolean
  // Optional slot for a small corner control (e.g. SaveSongButton) - kept as
  // a plain ReactNode rather than a dedicated prop so this presentational
  // card stays agnostic to what the action actually does.
  action?: ReactNode
}

export function SongCard({ title, artist, youtubeTitle, index, total, needsAnswer = false, action }: SongCardProps) {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  const accent = accentColorFor(index, resolvedTheme)

  const border = needsAnswer ? 'border-pink' : accent.border
  const bg = needsAnswer ? 'bg-pink/15' : accent.bg
  const label = needsAnswer ? 'text-pink' : accent.text

  const { primary, secondary } = songLabel({ title, artist, youtubeTitle })

  return (
    <div className={`relative rounded-2xl border-2 p-6 text-center ${border} ${bg}`}>
      {action && <div className="absolute right-3 top-3">{action}</div>}
      <p className={`mb-3 text-sm font-semibold ${label}`}>
        Song {index + 1} of {total}
      </p>
      <p className="line-clamp-3 text-2xl font-bold text-text">{primary}</p>
      {secondary && <p className="mt-1 line-clamp-2 text-lg text-text-secondary">{secondary}</p>}
    </div>
  )
}
