import type { GameStatsForViewer } from '../logic/scoring'
import type { Player } from '../types'

interface GameStatsCardProps {
  stats: GameStatsForViewer
  players: Player[]
  viewerId: string
  onContinue: () => void
}

function joinNames(ids: string[], nameById: Map<string, string>): string {
  return ids.map((id) => nameById.get(id) ?? '?').join(' and ')
}

// A personal, per-player summary shown once per game (after nominations,
// before the final Lobby scoreboard) - built entirely from the cumulative
// counters already folded into `players` by applyRoundScoresIfNeeded
// (gameStore.ts), so it needs no new writes. Every line is independently
// optional: whatever computeGameStatsForViewer couldn't find data for is
// just absent, never shown empty or zeroed-out.
export function GameStatsCard({ stats, players, viewerId, onContinue }: GameStatsCardProps) {
  const nameById = new Map(players.map((p) => [p.id, p.name]))
  const viewerIsInSyncPair = stats.mostInSyncPair?.viewerIsMember ?? false

  const lines: { emoji: string; text: string }[] = []

  if (stats.bestGuesserOfYou) {
    const { playerIds, count } = stats.bestGuesserOfYou
    lines.push({
      emoji: '🕵️',
      text: `${joinNames(playerIds, nameById)} read you like a book — guessed your song ${count} time${count === 1 ? '' : 's'}.`,
    })
  }

  if (stats.yourBestGuess) {
    const { playerIds, count } = stats.yourBestGuess
    lines.push({
      emoji: '🎯',
      text: `You had ${joinNames(playerIds, nameById)}'s number — guessed them right ${count} time${count === 1 ? '' : 's'}.`,
    })
  }

  if (stats.hardestToRead.length > 0) {
    lines.push({
      emoji: '🕶️',
      text: `${joinNames(stats.hardestToRead, nameById)} — hardest to read. Nobody guessed them all game.`,
    })
  }

  if (stats.mostInSyncPair) {
    const [aId, bId] = stats.mostInSyncPair.playerIds
    lines.push({
      emoji: '🎶',
      text: viewerIsInSyncPair
        ? `You and ${nameById.get(aId === viewerId ? bId : aId) ?? '?'} have similar taste.`
        : `${nameById.get(aId) ?? '?'} and ${nameById.get(bId) ?? '?'} have similar taste.`,
    })
  }

  if (stats.topOverallGuesser) {
    const { playerIds, count } = stats.topOverallGuesser
    lines.push({
      emoji: '🏆',
      text: `${joinNames(playerIds, nameById)} had the most correct guesses tonight (${count}).`,
    })
  }

  return (
    <div>
      <h2 className="mb-1 text-center text-lg font-bold text-text">Your game, in review</h2>
      <p className="mb-4 text-center text-sm text-text-secondary">A few things from tonight</p>

      {lines.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface-muted px-4 py-4 text-center text-sm text-text-secondary">
          Not enough data yet to say anything interesting — play a few more rounds next time.
        </p>
      ) : (
        <ul className="space-y-2">
          {lines.map((line, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-text"
            >
              <span className="flex-shrink-0 text-lg leading-none">{line.emoji}</span>
              <span>{line.text}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onContinue}
        className="mt-6 w-full rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active"
      >
        Continue to Scoreboard
      </button>
    </div>
  )
}
