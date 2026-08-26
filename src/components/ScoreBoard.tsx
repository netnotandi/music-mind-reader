import { useState } from 'react'
import type { Player, Song } from '../types'
import type { ScoreBreakdownRow, Title } from '../logic/scoring'

interface ScoreBoardProps {
  players: Player[]
  scores: Record<string, number>
  titles: Title[]
  breakdowns: Map<string, ScoreBreakdownRow[]>
  songsByPlayer: Map<string, { song: Song; avgRating: number }[]>
}

function formatPoints(points: number) {
  return Number.isInteger(points) ? String(points) : points.toFixed(1)
}

export function ScoreBoard({ players, scores, titles, breakdowns, songsByPlayer }: ScoreBoardProps) {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null)
  const ranked = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))

  return (
    <div className="space-y-3">
      {ranked.map((player, i) => {
        const playerTitles = titles.filter((t) => t.playerId === player.id)
        const isExpanded = expandedPlayerId === player.id
        const rows = breakdowns.get(player.id) ?? []
        const ownedSongs = songsByPlayer.get(player.id) ?? []

        return (
          <div key={player.id} className="rounded-xl border border-slate-700 bg-slate-800/50">
            <button
              type="button"
              onClick={() => setExpandedPlayerId(isExpanded ? null : player.id)}
              className="w-full px-5 py-4 text-left"
            >
              <div className="flex items-center justify-between">
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
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-emerald-300">
                    {(scores[player.id] ?? 0).toFixed(1)}
                  </span>
                  <span className={`text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </div>
              </div>

              {ownedSongs.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-slate-700/60 pt-3">
                  {ownedSongs.map(({ song, avgRating }) => (
                    <div key={song.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-slate-100">{song.title}</span>
                        <span className="text-sm text-slate-400">{song.artist}</span>
                      </div>
                      <span className="flex-shrink-0 text-xs text-slate-500">
                        avg rating {avgRating.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </button>

            {isExpanded && (
              <div className="border-t border-slate-700 px-5 py-4">
                {rows.length === 0 ? (
                  <p className="text-sm text-slate-500">No points earned this round.</p>
                ) : (
                  <ul className="space-y-2">
                    {rows.map((row, j) => (
                      <li key={j} className="flex items-start justify-between gap-3 text-sm">
                        <div>
                          <p className="font-medium text-slate-200">{row.label}</p>
                          <p className="text-xs text-slate-500">{row.detail}</p>
                        </div>
                        <span className="flex-shrink-0 font-semibold text-emerald-300">
                          +{formatPoints(row.points)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
