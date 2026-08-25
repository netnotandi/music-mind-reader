interface SongCardProps {
  title: string
  artist: string
  index: number
  total: number
}

export function SongCard({ title, artist, index, total }: SongCardProps) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 text-center">
      <p className="mb-3 text-sm text-slate-400">
        Lag {index + 1} af {total}
      </p>
      <p className="text-2xl font-bold text-slate-100">{title}</p>
      <p className="mt-1 text-lg text-slate-400">{artist}</p>
    </div>
  )
}
