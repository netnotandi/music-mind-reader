import type { Player } from '../types'
import type { Title } from '../logic/scoring'

interface ScoreBoardProps {
  players: Player[]
  scores: Record<string, number>
  titles: Title[]
}

export function ScoreBoard({ players, scores, titles }: ScoreBoardProps) {
  const ranked = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))

  return (
    <div className="space-y-2">
      {ranked.map((player, i) => {
        const playerTitles = titles.filter((t) => t.playerId === player.id)
        return (
          <div
            key={player.id}
            className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">#{i + 1}</span>
                <span className="font-medium text-slate-100">{player.name}</span>
              </div>
              {playerTitles.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {playerTitles.map((t) => (
                    <span
                      key={t.name}
                      className="rounded-full bg-fuchsia-400/20 px-2 py-0.5 text-xs text-fuchsia-300"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className="text-lg font-semibold text-emerald-300">
              {(scores[player.id] ?? 0).toFixed(1)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
