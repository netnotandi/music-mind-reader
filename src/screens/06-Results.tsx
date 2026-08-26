import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { ScoreBoard } from '../components/ScoreBoard'
import { averageRating, computeFinalScores, computeScoreBreakdown, computeTitles } from '../logic/scoring'
import { getCurrentRoundSongs, useGameStore } from '../state/gameStore'

export function Results() {
  const navigate = useNavigate()
  const players = useGameStore((s) => s.players)
  const songs = useGameStore(useShallow(getCurrentRoundSongs))
  const guesses = useGameStore((s) => s.guesses)
  const ratings = useGameStore((s) => s.ratings)
  const resetGame = useGameStore((s) => s.resetGame)

  const round = { songs, guesses, ratings }
  const scores = computeFinalScores(round)
  const titles = computeTitles(round, players)
  const breakdowns = new Map(players.map((p) => [p.id, computeScoreBreakdown(round, p.id)]))
  const playerById = new Map(players.map((p) => [p.id, p]))

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 py-8">
      <h1 className="mb-6 text-center text-2xl font-bold text-slate-100">Results</h1>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Scoreboard</h2>
      <div className="mb-8">
        <ScoreBoard players={players} scores={scores} titles={titles} breakdowns={breakdowns} />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Songs Revealed</h2>
      <ul className="mb-8 space-y-2">
        {songs.map((song) => (
          <li key={song.id} className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-100">{song.title}</p>
                <p className="text-sm text-slate-400">{song.artist}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-emerald-300">{playerById.get(song.playerId)?.name}</p>
                <p className="text-xs text-slate-500">
                  avg rating {averageRating(song.id, ratings).toFixed(1)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => {
          resetGame()
          navigate('/')
        }}
        className="w-full rounded-xl border border-slate-600 px-5 py-3 font-semibold text-slate-100 transition hover:border-slate-400"
      >
        New Game
      </button>
    </div>
  )
}
