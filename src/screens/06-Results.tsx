import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { ScoreBoard } from '../components/ScoreBoard'
import { averageRating, computeFinalScores, computeScoreBreakdown, computeTitles } from '../logic/scoring'
import { getCurrentRoundSongs, useGameStore } from '../state/gameStore'
import { useThemeStore } from '../state/themeStore'

export function Results() {
  // Light-only: "Leave Game" reads as a violet-outlined secondary action
  // instead of a plain navy-bordered one - dark keeps its current look.
  const isLight = useThemeStore((s) => s.resolvedTheme === 'light')
  const navigate = useNavigate()
  const players = useGameStore((s) => s.players)
  const songs = useGameStore(useShallow(getCurrentRoundSongs))
  const guesses = useGameStore((s) => s.guesses)
  const ratings = useGameStore((s) => s.ratings)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const lobbyReadyPlayerIds = useGameStore((s) => s.lobbyReadyPlayerIds)
  const leaveGame = useGameStore((s) => s.leaveGame)
  const returnToLobby = useGameStore((s) => s.returnToLobby)
  const hasReturnedToLobby = localPlayerId !== null && lobbyReadyPlayerIds.includes(localPlayerId)

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

  // Per-device only - leaving never touches the shared room, so everyone
  // else can keep discussing the results for as long as they want. Passing
  // false keeps this player's row (songs, scores, titles) on everyone
  // else's scoreboard - the round's already over, so there's no "seat" to
  // free up the way there would be mid-lobby or mid-game.
  function handleLeave() {
    leaveGame(false)
    navigate('/')
  }

  // Per-device, just like Leave Game - marks this player ready and moves
  // only THIS device to Lobby, without waiting for or disturbing anyone
  // still reviewing Results. No explicit navigate here: the app-wide phase
  // watcher picks up this player's own readiness and moves them to Lobby
  // itself. Once every player has done this, a separate watcher folds the
  // round's scores into everyone's total and resets things for next round.
  function handleGoToLobby() {
    returnToLobby()
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 py-8">
      <h1 className="mb-6 text-center text-2xl font-bold text-text">Results</h1>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">Scoreboard</h2>
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
        disabled={hasReturnedToLobby}
        onClick={handleGoToLobby}
        className="mb-3 w-full rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-bg disabled:text-disabled-text"
      >
        {hasReturnedToLobby ? '✓ Heading to Lobby — waiting for others' : 'Go to Lobby'}
      </button>

      <button
        type="button"
        onClick={handleLeave}
        className={
          isLight
            ? 'w-full rounded-xl border-[1.5px] border-primary bg-surface px-5 py-3 font-semibold text-primary transition'
            : 'w-full rounded-xl border border-border-strong px-5 py-3 font-semibold text-text transition hover:border-border-strong'
        }
      >
        Leave Game
      </button>
    </div>
  )
}
