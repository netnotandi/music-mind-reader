import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import type { AwardIconKind } from '../components/AwardCard'
import { type FinalScoretableCard, FinalScoretableCards } from '../components/FinalScoretableCards'
import { ScoreBoard } from '../components/ScoreBoard'
import {
  averageRating,
  computeCumulativeTitles,
  computeFinalScores,
  computeOverallWinners,
  computeScoreBreakdown,
  computeTitles,
} from '../logic/scoring'
import { getCurrentRoundSongs, useGameStore } from '../state/gameStore'
import { useThemeStore } from '../state/themeStore'
import type { Player } from '../types'

const CUMULATIVE_TITLE_META: Record<string, { icon: AwardIconKind; subtitle: string }> = {
  'Music Mind Reader': { icon: 'music-mind-reader', subtitle: 'Most correct guesses' },
  'Best Taste': { icon: 'best-taste', subtitle: 'Highest average rating' },
  'Master of Disguise': { icon: 'master-of-disguise', subtitle: 'Fewest correct guesses' },
  'Most Predictable': { icon: 'most-predictable', subtitle: 'Everyone guessed correctly' },
  'Musical Criminal': { icon: 'musical-criminal', subtitle: 'Lowest-rated song' },
}

// Built once every pre-committed round is done - the 5 titles above but
// cumulative across every round played, plus one more card for whoever has
// the single highest total score. A title nobody qualifies for (e.g. no
// rated songs yet) is simply omitted, same as the per-round ScoreBoard
// already does.
function buildFinalScoretableCards(players: Player[]): FinalScoretableCard[] {
  const nameById = new Map(players.map((p) => [p.id, p.name]))
  const playerIdsByTitle = new Map<string, string[]>()
  for (const { name, playerId } of computeCumulativeTitles(players)) {
    const ids = playerIdsByTitle.get(name) ?? []
    ids.push(playerId)
    playerIdsByTitle.set(name, ids)
  }

  const cards: FinalScoretableCard[] = []
  for (const [name, meta] of Object.entries(CUMULATIVE_TITLE_META)) {
    const playerIds = playerIdsByTitle.get(name)
    if (!playerIds || playerIds.length === 0) continue
    cards.push({
      icon: meta.icon,
      title: name,
      subtitle: meta.subtitle,
      playerNames: playerIds.map((id) => nameById.get(id) ?? '?'),
    })
  }

  const winnerIds = computeOverallWinners(players)
  if (winnerIds.length > 0) {
    cards.push({
      icon: 'overall-winner',
      title: 'Game Winner',
      subtitle: 'Most points overall',
      playerNames: winnerIds.map((id) => nameById.get(id) ?? '?'),
    })
  }

  return cards
}

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
  const roundsCompleted = useGameStore((s) => s.roundsCompleted)
  const totalRounds = useGameStore((s) => s.totalRounds)
  const leaveGame = useGameStore((s) => s.leaveGame)
  const returnToLobby = useGameStore((s) => s.returnToLobby)
  const applyFinalRoundScores = useGameStore((s) => s.applyFinalRoundScores)
  const hasReturnedToLobby = localPlayerId !== null && lobbyReadyPlayerIds.includes(localPlayerId)
  // This round (about to become roundsCompleted + 1) is the last of the
  // pre-committed total - chosen once at the first Game Setup, see
  // chooseTotalRounds in gameStore.ts.
  const isLastRound = roundsCompleted + 1 >= totalRounds
  const [showingFinalCards, setShowingFinalCards] = useState(false)

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

  // Folds this round's score in early (the same idempotent operation
  // returnToLobby triggers - see applyFinalRoundScores in gameStore.ts) so
  // the cumulative award cards about to render already include this
  // round's contribution, instead of only picking it up later once the
  // player continues past the deck.
  async function handleShowFinalCards() {
    await applyFinalRoundScores()
    setShowingFinalCards(true)
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 pb-8 pt-16">
      <h1 className="mb-6 text-center text-2xl font-bold text-text">Results</h1>

      {showingFinalCards ? (
        <FinalScoretableCards cards={buildFinalScoretableCards(players)} onContinue={handleGoToLobby} />
      ) : (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Scoreboard
          </h2>
          <div className="mb-8">
            <ScoreBoard
              players={players}
              scores={scores}
              titles={titles}
              breakdowns={breakdowns}
              songsByPlayer={songsByPlayer}
            />
          </div>

          {isLastRound ? (
            <button
              type="button"
              onClick={handleShowFinalCards}
              className="w-full rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active"
            >
              Final Scoretable →
            </button>
          ) : (
            <>
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
            </>
          )}
        </>
      )}
    </div>
  )
}
