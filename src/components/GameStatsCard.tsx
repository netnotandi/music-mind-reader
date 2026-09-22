import { useState } from 'react'
import type { GameStatsForViewer } from '../logic/scoring'
import type { Player } from '../types'

interface GameStatsCardProps {
  stats: GameStatsForViewer
  players: Player[]
  viewerId: string
}

function joinNames(ids: string[], nameById: Map<string, string>): string {
  return ids.map((id) => nameById.get(id) ?? '?').join(' and ')
}

function times(count: number): string {
  return `${count} time${count === 1 ? '' : 's'}`
}

// A few interchangeable ways to phrase each of the two base lines, picked at
// random once per mount (see the useState lazy-initializers below) rather
// than always saying the exact same sentence every game.
const BEST_GUESSER_OF_YOU_PHRASES: ((names: string, count: number) => string)[] = [
  (names, count) => `${names} read you like a book — guessed your song ${times(count)}.`,
  (names, count) => `${names} had your number — guessed you right ${times(count)}.`,
  (names, count) => `${names} saw right through you — correct ${times(count)}.`,
]

const YOUR_BEST_GUESS_PHRASES: ((names: string, count: number) => string)[] = [
  (names, count) => `You had ${names}'s number — guessed them right ${times(count)}.`,
  (names, count) => `You read ${names} like an open book — guessed them right ${times(count)}.`,
  (names, count) => `You've got ${names} figured out — correct ${times(count)}.`,
]

// A personal, per-player summary shown once per game (after nominations,
// before the final Lobby scoreboard) - built entirely from the cumulative
// counters already folded into `players` by applyRoundScoresIfNeeded
// (gameStore.ts), so it needs no new writes. Every line is independently
// optional: whatever computeGameStatsForViewer couldn't find data for is
// just absent, never shown empty or zeroed-out.
// Rendered alongside FinalScoretableCards as one combined screen (see that
// component's own comment) - the shared "Continue to Scoreboard" button
// lives in 06-Results.tsx, not here.
export function GameStatsCard({ stats, players, viewerId }: GameStatsCardProps) {
  const nameById = new Map(players.map((p) => [p.id, p.name]))
  const viewerIsInSyncPair = stats.mostInSyncPair?.viewerIsMember ?? false

  // Chosen once per mount (lazy initializer), not on every render - this is
  // a fresh once-per-game screen, so the phrasing shouldn't flicker to a
  // different variant if something else causes a re-render while it's up.
  const [bestGuesserPhraseIndex] = useState(() => Math.floor(Math.random() * BEST_GUESSER_OF_YOU_PHRASES.length))
  const [yourBestGuessPhraseIndex] = useState(() => Math.floor(Math.random() * YOUR_BEST_GUESS_PHRASES.length))

  const lines: { emoji: string; text: string; caption?: string }[] = []

  if (stats.bestGuesserOfYou) {
    const { playerIds, count } = stats.bestGuesserOfYou
    lines.push({
      emoji: '🕵️',
      text: BEST_GUESSER_OF_YOU_PHRASES[bestGuesserPhraseIndex](joinNames(playerIds, nameById), count),
    })
  }

  if (stats.yourBestGuess) {
    const { playerIds, count } = stats.yourBestGuess
    lines.push({
      emoji: '🎯',
      text: YOUR_BEST_GUESS_PHRASES[yourBestGuessPhraseIndex](joinNames(playerIds, nameById), count),
    })
  }

  if (stats.hardestToRead.length > 0) {
    const names = joinNames(stats.hardestToRead, nameById)
    lines.push({
      emoji: '🕶️',
      text: `${names} — Hardest to Read`,
      caption: `Nobody guessed ${names}'s song correctly all night.`,
    })
  }

  if (stats.mostInSyncPair) {
    const [aId, bId] = stats.mostInSyncPair.playerIds
    const names = viewerIsInSyncPair
      ? `You and ${nameById.get(aId === viewerId ? bId : aId) ?? '?'}`
      : `${nameById.get(aId) ?? '?'} and ${nameById.get(bId) ?? '?'}`
    lines.push({
      emoji: '🎶',
      text: `${names} — Most in Sync`,
      caption: 'They gave each other the highest score.',
    })
  }

  if (stats.topOverallGuesser) {
    const { playerIds, count } = stats.topOverallGuesser
    lines.push({
      emoji: '🏆',
      text: `${joinNames(playerIds, nameById)} — Top Guesser (${count})`,
      caption: 'Most correct guesses of the night.',
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
              <span>
                {line.text}
                {line.caption && <span className="mt-0.5 block text-xs text-text-secondary">{line.caption}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
