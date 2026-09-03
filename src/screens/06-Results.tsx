import { useShallow } from 'zustand/react/shallow'
import { ScoreBoard } from '../components/ScoreBoard'
import { averageRating, computeFinalScores, computeScoreBreakdown, computeTitles } from '../logic/scoring'
import { getCurrentRoundSongs, useGameStore } from '../state/gameStore'

export function Results() {
  const players = useGameStore((s) => s.players)
  const songs = useGameStore(useShallow(getCurrentRoundSongs))
  const guesses = useGameStore((s) => s.guesses)
  const ratings = useGameStore((s) => s.ratings)
  const startNewRound = useGameStore((s) => s.startNewRound)

  const round = { songs, guesses, ratings }
  const scores = computeFinalScores(round)
  const titles = computeTitles(round, players)
  const breakdowns = new Map(players.map((p) => [p.id, computeScoreBreakdown(round, p.id)]))
  const songsByPlayer = new Map(
    players.map((p) => [
      p.id,
      songs
        .filter((s) => s.playerId === p.id)
        .map((song) => ({ song, avgRating: averageRating(song.id, ratings) })),
    ])
  )

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 py-8">
      <h1 className="mb-6 text-center text-2xl font-bold text-slate-100">Results</h1>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Scoreboard</h2>
      <div className="mb-8">
        <ScoreBoard
          players={players}
          scores={scores}
          titles={titles}
          breakdowns={breakdowns}
          songsByPlayer={songsByPlayer}
        />
      </div>

      <button
        type="button"
        onClick={startNewRound}
        className="w-full rounded-xl border border-slate-600 px-5 py-3 font-semibold text-slate-100 transition hover:border-slate-400"
      >
        New Game
      </button>
    </div>
  )
}
