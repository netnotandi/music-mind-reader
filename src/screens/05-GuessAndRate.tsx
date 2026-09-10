import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { NowPlayingPlayer } from '../components/NowPlayingPlayer'
import { SongCard } from '../components/SongCard'
import { getCurrentRoundSongs, useGameStore } from '../state/gameStore'
import { useThemeStore } from '../state/themeStore'
import type { Player, Song } from '../types'

interface Answer {
  guessedPlayerId: string | null
  rating: number | null
}

interface AnswerFormProps {
  song: Song
  index: number
  total: number
  isOwnSong: boolean
  visiblePlayers: Player[]
  assignedElsewhere: Map<string, string>
  // The valid rating values for this round's category: 0..(N-2) where N is
  // the number of songs in play, so each rater has exactly one distinct
  // value per other song. Computed by the parent from the actual song count.
  ratingScale: number[]
  unavailableRatings: Set<number>
  initialAnswer: Answer | undefined
  onSubmit: (guessedPlayerId: string, rating: number | null) => void
}

// Keyed by `song.id` from the parent, so React remounts this (and resets
// guessedPlayerId/rating from initialAnswer) whenever the song changes.
function AnswerForm({
  song,
  index,
  total,
  isOwnSong,
  visiblePlayers,
  assignedElsewhere,
  ratingScale,
  unavailableRatings,
  initialAnswer,
  onSubmit,
}: AnswerFormProps) {
  // Light-only: an ordinary in-progress selection reads as pale-violet
  // ("Selected items" pattern), not the green reserved for confirmed/
  // connected/correct signals - dark keeps its original green-selected chip.
  const isLight = useThemeStore((s) => s.resolvedTheme === 'light')
  const [guessedPlayerId, setGuessedPlayerId] = useState(initialAnswer?.guessedPlayerId ?? null)
  const [rating, setRating] = useState(initialAnswer?.rating ?? null)

  const maxRating = ratingScale.length > 0 ? ratingScale[ratingScale.length - 1] : 0
  // Once every rating value has already been given to another song in this
  // category, there's nothing left to assign here - the guess still counts,
  // it just won't contribute a score.
  const ratingAvailable = ratingScale.some((v) => !unavailableRatings.has(v))

  return (
    <>
      <div className="mb-6">
        <SongCard title={song.title} artist={song.artist} index={index} total={total} />
      </div>

      {isOwnSong ? (
        <div className="mb-6 rounded-xl border border-border bg-surface-muted px-4 py-4 text-center text-text-secondary">
          This is your own song — you don't guess or rate it.
        </div>
      ) : (
        <>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Whose song is it?
          </h2>
          <div className="mb-6 flex flex-wrap gap-2">
            {visiblePlayers.map((p) => {
              const assignedTo = assignedElsewhere.get(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setGuessedPlayerId(p.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    guessedPlayerId === p.id
                      ? isLight
                        ? 'border-primary bg-primary-soft text-primary'
                        : 'border-success bg-success/20 text-success'
                      : 'border-border-strong text-text-secondary hover:border-border-strong'
                  }`}
                >
                  <span className="inline-block max-w-[9rem] truncate align-bottom">{p.name}</span>
                  {assignedTo && <span className="ml-1 text-xs text-text-muted">· {assignedTo}</span>}
                </button>
              )
            })}
          </div>

          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Rating (0–{maxRating})
          </h2>
          {!ratingAvailable && (
            <p className="mb-2 text-xs text-text-muted">
              You've already used every rating on other songs in this category - this one won't get a
              score from you.
            </p>
          )}
          <div className="mb-6 flex flex-wrap gap-2">
            {ratingScale.map((value) => {
              const disabled = unavailableRatings.has(value)
              return (
                <button
                  key={value}
                  type="button"
                  disabled={disabled}
                  onClick={() => setRating(value)}
                  className={`h-10 w-10 rounded-full border text-sm font-semibold transition ${
                    rating === value
                      ? 'border-rating bg-rating-soft text-rating'
                      : disabled
                        ? 'border-disabled-border text-disabled-text'
                        : 'border-border-strong text-text-secondary hover:border-border-strong'
                  }`}
                >
                  {value}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            disabled={!guessedPlayerId || (ratingAvailable && rating === null)}
            onClick={() =>
              guessedPlayerId !== null && (!ratingAvailable || rating !== null) && onSubmit(guessedPlayerId, rating)
            }
            className="mb-6 w-full rounded-lg border border-primary bg-primary px-4 py-2 font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-bg disabled:text-disabled-text"
          >
            {initialAnswer ? 'Update Answer' : 'Submit'}
          </button>
        </>
      )}
    </>
  )
}

export function GuessAndRate() {
  const songs = useGameStore(useShallow(getCurrentRoundSongs))
  const currentSongIndex = useGameStore((s) => s.currentSongIndex)
  // The group's shared, official position (currentSongIndex) is separate
  // from what THIS device happens to be looking at (viewIndex). Normally
  // it follows currentSongIndex automatically (so the group still moves
  // through songs together, same as before), but the moment a player
  // browses backward it detaches - the effect below only pulls viewIndex
  // forward when it was still tracking the old shared position, so someone
  // reviewing an earlier song is never yanked back to the live one.
  const [viewIndex, setViewIndex] = useState(currentSongIndex)
  const wasTrackingRef = useRef(currentSongIndex)
  useEffect(() => {
    // Capture the prior value as a plain variable before mutating the ref -
    // setViewIndex's updater callback runs on React's own schedule, not
    // necessarily before the next line, so reading wasTrackingRef.current
    // from inside it could see the already-updated value instead of the
    // one from before this change.
    const previouslyTracked = wasTrackingRef.current
    wasTrackingRef.current = currentSongIndex
    setViewIndex((v) => (v === previouslyTracked ? currentSongIndex : v))
  }, [currentSongIndex])
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const hostId = useGameStore((s) => s.hostId)
  const players = useGameStore((s) => s.players)
  const categories = useGameStore((s) => s.categories)
  const guesses = useGameStore((s) => s.guesses)
  const ratings = useGameStore((s) => s.ratings)
  const confirmedPlayerIds = useGameStore((s) => s.confirmedPlayerIds)
  const submitGuess = useGameStore((s) => s.submitGuess)
  const clearGuess = useGameStore((s) => s.clearGuess)
  const submitRating = useGameStore((s) => s.submitRating)
  const devSubmitGuessAs = useGameStore((s) => s.devSubmitGuessAs)
  const devSubmitRatingAs = useGameStore((s) => s.devSubmitRatingAs)
  const nextSong = useGameStore((s) => s.nextSong)
  const confirmFinalAnswers = useGameStore((s) => s.confirmFinalAnswers)
  const finishRound = useGameStore((s) => s.finishRound)

  const song = songs[viewIndex]
  // Deliberately keyed off the group's real position, not viewIndex - this
  // is what's actually audible right now, so it must never follow a player
  // browsing an earlier song locally to review/edit their own answer.
  const currentSong = songs[currentSongIndex]
  const isHost = localPlayerId !== null && localPlayerId === hostId
  const hostPlayer = players.find((p) => p.id === hostId)

  if (!song || !localPlayerId) {
    return (
      <div className="mx-auto max-w-md px-6 py-8 text-text-secondary">
        No song playing — go back to the Lobby.
      </div>
    )
  }

  const isOwnSong = song.playerId === localPlayerId
  const isViewingCurrent = viewIndex === currentSongIndex
  const isGroupOnLastSong = currentSongIndex >= songs.length - 1
  // Once viewing the actual current/last song, "Next Song" is replaced by
  // the confirm-final-answers flow below - reaching the end of the round
  // is a real, shared transition, so it needs everyone's explicit sign-off
  // rather than whoever happens to click through first.
  const showConfirmFlow = isViewingCurrent && isGroupOnLastSong
  const hasConfirmed = confirmedPlayerIds.includes(localPlayerId)
  const allConfirmed = players.length > 0 && confirmedPlayerIds.length >= players.length
  const isFirstOfCategory = viewIndex === 0 || songs[viewIndex - 1]?.categoryId !== song.categoryId
  const categoryName = categories.find((c) => c.id === song.categoryId)?.name
  const categorySongs = songs.filter((s) => s.categoryId === song.categoryId)
  // Always at least 0-10 (the original fixed scale). Ratings are a
  // distinct-value ranking of the OTHER songs in the category, so N songs
  // need N-1 values - once N-1 exceeds 11 (i.e. more than 12 players) the
  // top of the scale grows: 13 -> 0-11, 14 -> 0-12, etc.
  const maxRating = Math.max(10, categorySongs.length - 2)
  const ratingScale = Array.from({ length: maxRating + 1 }, (_, i) => i)

  // Everyone but the owner has to weigh in on the song currently playing
  // before the group can move on.
  const requiredResponders = players.filter((p) => p.id !== song.playerId)
  const answeredIds = new Set(guesses.filter((g) => g.songId === song.id).map((g) => g.guesserId))
  const answeredCount = requiredResponders.filter((p) => answeredIds.has(p.id)).length
  const allAnswered = answeredCount === requiredResponders.length

  const visiblePlayers = players.filter((p) => p.id !== localPlayerId)

  // Each player owns exactly one song per category, so a name already used
  // as this player's guess for a different song in this category is shown
  // (not hidden) with a hint of where - picking it here "steals" it from
  // that song instead of being blocked outright.
  const assignedElsewhere = new Map<string, string>()
  for (const g of guesses) {
    if (g.guesserId !== localPlayerId || g.songId === song.id) continue
    const assignedSong = categorySongs.find((s) => s.id === g.songId)
    if (assignedSong) assignedElsewhere.set(g.guessedPlayerId, assignedSong.title)
  }

  const existingGuess = guesses.find((g) => g.songId === song.id && g.guesserId === localPlayerId)
  const existingRating = ratings.find((r) => r.songId === song.id && r.raterId === localPlayerId)
  const initialAnswer = existingGuess
    ? { guessedPlayerId: existingGuess.guessedPlayerId, rating: existingRating?.value ?? null }
    : undefined

  // Ratings must be unique per person within a category (no two songs from
  // the same rater can share a score), forcing a full ranking rather than
  // ties - this song's own existing rating is excluded so re-picking it
  // while editing isn't blocked.
  const unavailableRatings = new Set(
    ratings
      .filter((r) => r.raterId === localPlayerId && r.songId !== song.id && categorySongs.some((s) => s.id === r.songId))
      .map((r) => r.value)
  )

  function handleSubmit(guessedPlayerId: string, rating: number | null) {
    const conflictSong = categorySongs.find(
      (s) =>
        s.id !== song.id &&
        guesses.some((g) => g.songId === s.id && g.guesserId === localPlayerId && g.guessedPlayerId === guessedPlayerId)
    )
    if (conflictSong) clearGuess(conflictSong.id)
    submitGuess(song.id, guessedPlayerId)
    if (rating !== null) submitRating(song.id, rating)
  }

  function handleDevAutofillRest() {
    const missing = requiredResponders.filter((p) => !answeredIds.has(p.id))
    missing.forEach((player, i) => {
      const usedGuesses = new Set(
        guesses
          .filter((g) => g.guesserId === player.id && categorySongs.some((s) => s.id === g.songId))
          .map((g) => g.guessedPlayerId)
      )
      const candidates = players.filter((p) => p.id !== player.id && !usedGuesses.has(p.id))
      const guessedPlayerId = (candidates[i % candidates.length] ?? players.find((p) => p.id !== player.id))?.id
      if (!guessedPlayerId) return
      devSubmitGuessAs(player.id, song.id, guessedPlayerId)

      const usedRatings = new Set(
        ratings
          .filter((r) => r.raterId === player.id && r.songId !== song.id && categorySongs.some((s) => s.id === r.songId))
          .map((r) => r.value)
      )
      const ratingValue = ratingScale.find((v) => !usedRatings.has(v))
      if (ratingValue !== undefined) devSubmitRatingAs(player.id, song.id, ratingValue)
    })
  }

  // Browsing backward/forward through already-covered songs is always a
  // purely local move - only advancing PAST the group's current song is a
  // real, shared action (handled below).
  function goPrev() {
    setViewIndex((i) => Math.max(i - 1, 0))
  }

  function goNext() {
    if (isViewingCurrent) {
      nextSong()
      setViewIndex((i) => i + 1)
    } else {
      setViewIndex((i) => Math.min(i + 1, currentSongIndex))
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 pb-12 pt-16">
      {isHost && currentSong && <NowPlayingPlayer videoId={currentSong.youtubeVideoId ?? null} />}

      {isFirstOfCategory && viewIndex > 0 && (
        <div className="mb-6 rounded-lg border border-info-border bg-info-bg px-4 py-2 text-center text-sm text-info-text">
          Next up: {categoryName}
        </div>
      )}

      <AnswerForm
        key={song.id}
        song={song}
        index={viewIndex}
        total={songs.length}
        isOwnSong={isOwnSong}
        visiblePlayers={visiblePlayers}
        assignedElsewhere={assignedElsewhere}
        ratingScale={ratingScale}
        unavailableRatings={unavailableRatings}
        initialAnswer={initialAnswer}
        onSubmit={handleSubmit}
      />

      {!isViewingCurrent && (
        <button
          type="button"
          onClick={() => setViewIndex(currentSongIndex)}
          className="mb-6 w-full rounded-lg border border-info-border bg-info-bg px-4 py-2 text-center text-sm text-info-text transition hover:border-info-border"
        >
          Reviewing an earlier song — tap to jump back to the current one
        </button>
      )}

      {/* Credits the owner as already "done" from the start, so the count
          reads out of every player rather than just required responders -
          otherwise it would visibly fail to move while the owner holds the
          device (they can never answer their own song), which is itself a
          tell for who owns it. */}
      <p className="mb-4 text-center text-sm text-text-secondary">
        {answeredCount + 1}/{players.length} have answered
      </p>

      {!allAnswered && import.meta.env.DEV && (
        <button
          type="button"
          onClick={handleDevAutofillRest}
          className="mb-4 w-full rounded-lg border border-border-strong px-4 py-2 text-sm text-text-secondary hover:border-border-strong"
        >
          Answer for everyone else on this song (dev only, to test the flow)
        </button>
      )}

      <div className="flex gap-3">
        {!isFirstOfCategory && (
          <button
            type="button"
            onClick={goPrev}
            className="flex-1 rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active"
          >
            ← Previous Song
          </button>
        )}
        {showConfirmFlow ? (
          <button
            type="button"
            disabled={!allAnswered || hasConfirmed}
            onClick={confirmFinalAnswers}
            className="flex-1 rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-bg disabled:text-disabled-text"
          >
            {hasConfirmed ? '✓ Confirmed — waiting for others' : 'Confirm final answers'}
          </button>
        ) : (
          <button
            type="button"
            disabled={!allAnswered || !isHost}
            onClick={goNext}
            className="flex-1 rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-bg disabled:text-disabled-text"
          >
            {allAnswered && !isHost
              ? `Waiting for ${hostPlayer?.name ?? 'the host'} to continue`
              : 'Next Song →'}
          </button>
        )}
      </div>

      {/* Nobody can be swept into Results by someone else's click - the
          shared phase only changes once every player has explicitly
          confirmed they're done, tracked live here so it's clear who
          everyone's still waiting on. */}
      {showConfirmFlow && allAnswered && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary">
                <th className="px-3 py-2 text-left font-medium">Player</th>
                <th className="px-3 py-2 text-center font-medium">Confirmed answers</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-border last:border-0 ${
                    p.id === localPlayerId ? 'bg-success/10' : ''
                  }`}
                >
                  <td
                    className={`max-w-[8rem] truncate px-3 py-2 ${
                      p.id === localPlayerId ? 'font-semibold text-success' : 'text-text'
                    }`}
                  >
                    {p.name}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {confirmedPlayerIds.includes(p.id) ? (
                      <span className="text-success">✓</span>
                    ) : (
                      <span className="text-text-muted">·</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showConfirmFlow && allConfirmed && (
        <button
          type="button"
          disabled={!isHost}
          onClick={finishRound}
          className="mt-4 w-full rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-bg disabled:text-disabled-text"
        >
          {isHost ? 'See Results →' : `Waiting for ${hostPlayer?.name ?? 'the host'} to see results`}
        </button>
      )}
    </div>
  )
}