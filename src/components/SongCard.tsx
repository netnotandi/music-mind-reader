import { accentColorFor } from '../logic/accentColors'

interface SongCardProps {
  title: string
  artist: string
  index: number
  total: number
}

export function SongCard({ title, artist, index, total }: SongCardProps) {
  const accent = accentColorFor(index)

  return (
    <div className={`rounded-2xl border-2 p-6 text-center ${accent.border} ${accent.bg}`}>
      <p className={`mb-3 text-sm font-semibold ${accent.text}`}>
        Song {index + 1} of {total}
      </p>
      <p className="text-2xl font-bold text-slate-100">{title}</p>
      <p className="mt-1 text-lg text-slate-400">{artist}</p>
    </div>
  )
}
