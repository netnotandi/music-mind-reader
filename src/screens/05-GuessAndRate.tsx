import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { NowPlayingPlayer } from '../components/NowPlayingPlayer'
import { SongCard } from '../components/SongCard'
import { songLabel } from '../logic/songLabel'
import { getCurrentRoundSongs, SHORT_MODE_CAP_SECONDS, useGameStore } from '../state/gameStore'
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
  // This player still owes a guess/rating for this song - the song card
  // switches to the "you're not done here" colour.
  needsAnswer: boolean
  visiblePlayers: Player[]
  assignedElsewhere: Map<string, string>
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
  needsAnswer,
  visiblePlayers,
  assignedElsewhere,
  ratingScale,
  unavailableRatings,
  initialAnswer,
  onSubmit,
}: AnswerFormProps) {
  const isLight = useThemeStore((s) => s.resolvedTheme === 'light')
  const [guessedPlayerId, setGuessedPlayerId] = useState(initialAnswer?.guessedPlayerId ?? null)
  const [rating, setRating] = useState(initialAnswer?.rating ?? null)

  const maxRating = ratingScale.length > 0 ? ratingScale[ratingScale.length - 1] : 0
  const ratingAvailable = ratingScale.some((v) => !unavailableRatings.has(v))

  return (
    <>
      <div className="mb-6">
        <SongCard
          title={song.title}
          artist={song.artist}
          youtubeTitle={song.youtubeTitle}
          index={index}
          total={total}
          needsAnswer={needsAnswer}
        />
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
  const roundMode = useGameStore((s) => s.roundMode)
  const roundPlaythroughDone = useGameStore((s) => s.roundPlaythroughDone)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const hostId = useGameStore((s) => s.hostId)
  const players = useGameStore((s) => s.players)
  const guesses = useGameStore((s) => s.guesses)
  const ratings = useGameStore((s) => s.ratings)
  const confirmedPlayerIds = useGameStore((s) => s.confirmedPlayerIds)
  const submitGuess = useGameStore((s) => s.submitGuess)
  const clearGuess = useGameStore((s) => s.clearGuess)
  const submitRating = useGameStore((s) => s.submitRating)
  const devSubmitGuessAs = useGameStore((s) => s.devSubmitGuessAs)
  const devSubmitRatingAs = useGameStore((s) => s.devSubmitRatingAs)
  const advanceGroup = useGameStore((s) => s.advanceGroup)
  const confirmFinalAnswers = useGameStore((s) => s.confirmFinalAnswers)
  const finishRound = useGameStore((s) => s.finishRound)

  const isHost = localPlayerId !== null && localPlayerId === hostId
  const hostPlayer = players.find((p) => p.id === hostId)
  const currentSong: Song | undefined = songs[currentSongIndex]

  // A song is "done for me" the moment I have a guess for it - the rating is
  // submitted together with the guess (or wasn't required), so a guess
  // always means a complete answer. Own songs never need answering.
  function isDoneForMe(s: Song): boolean {
    if (s.playerId === localPlayerId) return true
    return guesses.some((g) => g.songId === s.id && g.guesserId === localPlayerId)
  }
  function answeredComplete(s: Song): boolean {
    const required = players.filter((p) => p.id !== s.playerId)
    const answered = new Set(guesses.filter((g) => g.songId === s.id).map((g) => g.guesserId))
    return required.every((p) => answered.has(p.id))
  }

  // Which song this device is looking at. Follows the group's position only
  // while the player is caught up AND finished with the song they were on;
  // otherwise it sticks so they can keep working while the music moves on.
  const [viewIndex, setViewIndex] = useState(currentSongIndex)
  const wasTrackingRef = useRef(currentSongIndex)
  useEffect(() => {
    const previouslyTracked = wasTrackingRef.current
    wasTrackingRef.current = currentSongIndex
    setViewIndex((v) => {
      if (v !== previouslyTracked) return v
      const songThere = songs[v]
      if (songThere && !isDoneForMe(songThere)) return v
      return currentSongIndex
    })
    // isDoneForMe/songs are read fresh each run; only the index change matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSongIndex])

  // When the round finishes playing through, drop the player onto their
  // first unanswered song so the "finish up" task is right in front of them.
  const wrappedRef = useRef(false)
  useEffect(() => {
    if (roundPlaythroughDone && !wrappedRef.current) {
      wrappedRef.current = true
      const firstUnanswered = songs.findIndex((s) => !isDoneForMe(s))
      if (firstUnanswered >= 0) setViewIndex(firstUnanswered)
    }
    if (!roundPlaythroughDone) wrappedRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundPlaythroughDone])

  // ---- Host-only: the single driver of group song progression ----
  const advancedForRef = useRef(-1)
  function doAdvance() {
    if (advancedForRef.current === currentSongIndex || roundPlaythroughDone) return
    advancedForRef.current = currentSongIndex
    advanceGroup()
  }
  // short mode also advances once everyone has answered the current song
  const currentAllAnswered = currentSong ? answeredComplete(currentSong) : false
  useEffect(() => {
    if (!isHost || roundPlaythroughDone || roundMode !== 'short') return
    if (currentAllAnswered) doAdvance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, roundMode, roundPlaythroughDone, currentAllAnswered, currentSongIndex])
  // a current song with no video can't be timed by the player - fall back
  // to a wall clock in short mode
  useEffect(() => {
    if (!isHost || roundPlaythroughDone || roundMode !== 'short') return
    if (currentSong?.youtubeVideoId) return
    const t = setTimeout(() => doAdvance(), SHORT_MODE_CAP_SECONDS * 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, roundMode, roundPlaythroughDone, currentSongIndex, currentSong?.youtubeVideoId])

  if (!localPlayerId || songs.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 py-8 text-text-secondary">
        No songs — go back to the Lobby.
      </div>
    )
  }

  const song = songs[viewIndex] ?? songs[0]
  const isOwnSong = song.playerId === localPlayerId
  const isViewingCurrent = viewIndex === currentSongIndex
  const categorySongs = songs.filter((s) => s.categoryId === song.categoryId)
  const maxRating = Math.max(10, categorySongs.length - 2)
  const ratingScale = Array.from({ length: maxRating + 1 }, (_, i) => i)

  // How many players have weighed in on the song currently being viewed.
  const requiredResponders = players.filter((p) => p.id !== song.playerId)
  const answeredIds = new Set(guesses.filter((g) => g.songId === song.id).map((g) => g.guesserId))
  const answeredCount = requiredResponders.filter((p) => answeredIds.has(p.id)).length

  const visiblePlayers = players.filter((p) => p.id !== localPlayerId)

  const assignedElsewhere = new Map<string, string>()
  for (const g of guesses) {
    if (g.guesserId !== localPlayerId || g.songId === song.id) continue
    const assignedSong = categorySongs.find((s) => s.id === g.songId)
    if (assignedSong) assignedElsewhere.set(g.guessedPlayerId, songLabel(assignedSong).primary)
  }

  const existingGuess = guesses.find((g) => g.songId === song.id && g.guesserId === localPlayerId)
  const existingRating = ratings.find((r) => r.songId === song.id && r.raterId === localPlayerId)
  const initialAnswer = existingGuess
    ? { guessedPlayerId: existingGuess.guessedPlayerId, rating: existingRating?.value ?? null }
    : undefined

  const unavailableRatings = new Set(
    ratings
      .filter((r) => r.raterId === localPlayerId && r.songId !== song.id && categorySongs.some((s) => s.id === r.songId))
      .map((r) => r.value)
  )

  const hasConfirmed = confirmedPlayerIds.includes(localPlayerId)
  const allConfirmed = players.length > 0 && confirmedPlayerIds.length >= players.length
  const myUnanswered = songs.filter((s) => s.playerId !== localPlayerId && !isDoneForMe(s)).length
  const needsAnswer = !isOwnSong && !isDoneForMe(song)

  // Browse the round's songs with a simple prev/next stepper. Neither button
  // moves the group - during play you can only step back as far as the song
  // that's currently playing; once the round has played through you can
  // range over every song to finish up.
  const maxReachableIndex = roundPlaythroughDone ? songs.length - 1 : currentSongIndex
  function goPrev() {
    setViewIndex((i) => Math.max(i - 1, 0))
  }
  function goNext() {
    setViewIndex((i) => Math.min(i + 1, maxReachableIndex))
  }

  function handleSubmit(guessedPlayerId: string, rating: number | null) {
    const conflictSong = categorySongs.find(
      (s) =>
        s.id !== song.id &&
        guesses.some((g) => g.songId === s.id && g.guesserId === localPlayerId && g.guessedPlayerId === guessedPlayerId)
    )
    if (conflictSong) clearGuess(conflictSong.id)
    submitGuess(song.id, guessedPlayerId)
    if (rating !== null) submitRating(song.id, rating)
    // Finished this one - hop to whatever's playing now.
    if (!roundPlaythroughDone) setViewIndex(currentSongIndex)
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

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 pb-12 pt-16">
      {isHost && (
        <NowPlayingPlayer
          videoId={roundPlaythroughDone ? null : (currentSong?.youtubeVideoId ?? null)}
          capSeconds={roundMode === 'short' && !roundPlaythroughDone ? SHORT_MODE_CAP_SECONDS : null}
          onCap={() => {
            if (roundMode === 'short') doAdvance()
          }}
          onEnded={() => doAdvance()}
          wrapUp={roundPlaythroughDone}
        />
      )}

      {roundPlaythroughDone ? (
        <div className="mb-6 rounded-lg border border-info-border bg-info-bg px-4 py-2 text-center text-sm text-info-text">
          All songs played — finish your answers below.
        </div>
      ) : (
        <div className="mb-6 text-center text-sm text-text-secondary">
          Now playing: <span className="font-semibold text-text">Song {currentSongIndex + 1}</span>
        </div>
      )}

      <AnswerForm
        key={song.id}
        song={song}
        index={viewIndex}
        total={songs.length}
        isOwnSong={isOwnSong}
        needsAnswer={needsAnswer}
        visiblePlayers={visiblePlayers}
        assignedElsewhere={assignedElsewhere}
        ratingScale={ratingScale}
        unavailableRatings={unavailableRatings}
        initialAnswer={initialAnswer}
        onSubmit={handleSubmit}
      />

      {!isViewingCurrent && !roundPlaythroughDone && (
        <button
          type="button"
          onClick={() => setViewIndex(currentSongIndex)}
          className="mb-6 w-full rounded-lg border border-cyan/40 bg-cyan/10 px-4 py-2 text-sm text-cyan transition hover:border-cyan"
        >
          Reviewing an earlier song — jump back to the one playing now →
        </button>
      )}

      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={viewIndex === 0}
          onClick={goPrev}
          className="rounded-lg border border-border-strong px-4 py-2 text-sm text-text-secondary transition hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-30"
        >
          ← Previous song
        </button>
        <span className="flex-shrink-0 text-xs text-text-muted">
          {viewIndex + 1} / {songs.length}
        </span>
        <button
          type="button"
          disabled={viewIndex >= maxReachableIndex}
          onClick={goNext}
          className="rounded-lg border border-border-strong px-4 py-2 text-sm text-text-secondary transition hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-30"
        >
          Next song →
        </button>
      </div>

      {!isOwnSong && (
        <p className="mb-4 text-center text-sm text-text-secondary">
          {answeredCount}/{requiredResponders.length} have answered this song
        </p>
      )}

      {!answeredComplete(song) && import.meta.env.DEV && (
        <button
          type="button"
          onClick={handleDevAutofillRest}
          className="mb-4 w-full rounded-lg border border-border-strong px-4 py-2 text-sm text-text-secondary hover:border-border-strong"
        >
          Answer for everyone else on this song (dev only, to test the flow)
        </button>
      )}

      {isHost && !roundPlaythroughDone && (
        <button
          type="button"
          onClick={doAdvance}
          className="w-full rounded-xl border border-border-strong px-5 py-3 text-sm font-semibold text-text-secondary transition hover:border-border-strong"
        >
          Skip song →
        </button>
      )}

      {roundPlaythroughDone && (
        <div className="mt-8">
          {myUnanswered > 0 && (
            <p className="mb-2 text-center text-sm text-primary">
              You still have {myUnanswered} song{myUnanswered === 1 ? '' : 's'} to answer.
            </p>
          )}
          <button
            type="button"
            disabled={hasConfirmed}
            onClick={confirmFinalAnswers}
            className="w-full rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-bg disabled:text-disabled-text"
          >
            {hasConfirmed ? '✓ Confirmed — waiting for others' : 'Confirm final answers'}
          </button>

          <div className="mt-6 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="px-3 py-2 text-left font-medium">Player</th>
                  <th className="px-3 py-2 text-center font-medium">Confirmed</th>
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

          {allConfirmed && (
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
      )}
    </div>
  )
}
