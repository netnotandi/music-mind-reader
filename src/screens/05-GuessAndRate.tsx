import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { SongCard } from '../components/SongCard'
import { getCurrentRoundSongs, useGameStore } from '../state/gameStore'
import type { Player, Song } from '../types'

const RATING_OPTIONS = [0, 1, 2, 3, 4, 5]

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
  initialAnswer: Answer | undefined
  onSubmit: (guessedPlayerId: string, rating: number) => void
}

// Keyed by `${song.id}:${currentPlayerId}` from the parent, so React remounts
// this component (and resets guessedPlayerId/rating from initialAnswer)
// whenever the song OR the "logged in" player changes - passing the device
// to someone else always starts from a clean (or their own prior) answer.
function AnswerForm({
  song,
  index,
  total,
  isOwnSong,
  visiblePlayers,
  assignedElsewhere,
  initialAnswer,
  onSubmit,
}: AnswerFormProps) {
  const [guessedPlayerId, setGuessedPlayerId] = useState(initialAnswer?.guessedPlayerId ?? null)
  const [rating, setRating] = useState(initialAnswer?.rating ?? null)

  return (
    <>
      <div className="mb-6">
        <SongCard title={song.title} artist={song.artist} index={index} total={total} />
      </div>

      {isOwnSong ? (
        <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-4 text-center text-slate-300">
          This is your own song — you don't guess or rate it.
        </div>
      ) : (
        <>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
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
                      ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300'
                      : 'border-slate-600 text-slate-300 hover:border-slate-400'
                  }`}
                >
                  {p.name}
                  {assignedTo && <span className="ml-1 text-xs text-slate-500">· {assignedTo}</span>}
                </button>
              )
            })}
          </div>

          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Rating (0-5)
          </h2>
          <div className="mb-6 flex gap-2">
            {RATING_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={`h-10 w-10 rounded-full border text-sm font-semibold transition ${
                  rating === value
                    ? 'border-fuchsia-400 bg-fuchsia-400/20 text-fuchsia-300'
                    : 'border-slate-600 text-slate-300 hover:border-slate-400'
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={!guessedPlayerId || rating === null}
            onClick={() => guessedPlayerId !== null && rating !== null && onSubmit(guessedPlayerId, rating)}
            className="mb-6 w-full rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
          >
            {initialAnswer ? 'Update Answer' : 'Submit'}
          </button>
        </>
      )}
    </>
  )
}

export function GuessAndRate() {
  const navigate = useNavigate()
  const songs = useGameStore(useShallow(getCurrentRoundSongs))
  const currentSongIndex = useGameStore((s) => s.currentSongIndex)
  const currentPlayerId = useGameStore((s) => s.currentPlayerId)
  const players = useGameStore((s) => s.players)
  const categories = useGameStore((s) => s.categories)
  const guesses = useGameStore((s) => s.guesses)
  const ratings = useGameStore((s) => s.ratings)
  const submitGuess = useGameStore((s) => s.submitGuess)
  const clearGuess = useGameStore((s) => s.clearGuess)
  const submitRating = useGameStore((s) => s.submitRating)
  const nextSong = useGameStore((s) => s.nextSong)
  const prevSong = useGameStore((s) => s.prevSong)
  const setCurrentPlayer = useGameStore((s) => s.setCurrentPlayer)

  const song = songs[currentSongIndex]

  if (!song) {
    return (
      <div className="mx-auto max-w-md px-6 py-8 text-slate-300">
        No song playing — go back to the Lobby.
      </div>
    )
  }

  const isOwnSong = song.playerId === currentPlayerId
  const isLastSongOverall = currentSongIndex >= songs.length - 1
  const isFirstOfCategory = currentSongIndex === 0 || songs[currentSongIndex - 1]?.categoryId !== song.categoryId
  const categoryName = categories.find((c) => c.id === song.categoryId)?.name
  const categorySongs = songs.filter((s) => s.categoryId === song.categoryId)

  // The whole group has to weigh in on the song currently playing - pass the
  // device around until everyone but the owner has answered, then move on
  // together.
  const requiredResponders = players.filter((p) => p.id !== song.playerId)
  const answeredIds = new Set(guesses.filter((g) => g.songId === song.id).map((g) => g.guesserId))
  const answeredCount = requiredResponders.filter((p) => answeredIds.has(p.id)).length
  const allAnswered = answeredCount === requiredResponders.length
  const stillNeeded = requiredResponders.filter((p) => !answeredIds.has(p.id))

  // Each player owns exactly one song per category, so a name already used
  // as this player's guess for a different song in this category is shown
  // (not hidden) with a hint of where - picking it here "steals" it from
  // that song instead of being blocked outright.
  const visiblePlayers = players.filter((p) => p.id !== currentPlayerId)
  const assignedElsewhere = new Map<string, string>()
  for (const g of guesses) {
    if (g.guesserId !== currentPlayerId || g.songId === song.id) continue
    const assignedSong = categorySongs.find((s) => s.id === g.songId)
    if (assignedSong) assignedElsewhere.set(g.guessedPlayerId, assignedSong.title)
  }

  const existingGuess = guesses.find((g) => g.songId === song.id && g.guesserId === currentPlayerId)
  const existingRating = ratings.find((r) => r.songId === song.id && r.raterId === currentPlayerId)
  const initialAnswer = existingGuess
    ? { guessedPlayerId: existingGuess.guessedPlayerId, rating: existingRating?.value ?? null }
    : undefined

  function handleSubmit(guessedPlayerId: string, rating: number) {
    const conflictSong = categorySongs.find(
      (s) =>
        s.id !== song.id &&
        guesses.some((g) => g.songId === s.id && g.guesserId === currentPlayerId && g.guessedPlayerId === guessedPlayerId)
    )
    if (conflictSong) clearGuess(conflictSong.id, currentPlayerId)
    submitGuess(song.id, currentPlayerId, guessedPlayerId)
    submitRating(song.id, currentPlayerId, rating)
  }

  function handleAutofillRest() {
    const missing = requiredResponders.filter((p) => !answeredIds.has(p.id))
    missing.forEach((player, i) => {
      const usedByPlayer = new Set(
        guesses
          .filter((g) => g.guesserId === player.id && categorySongs.some((s) => s.id === g.songId))
          .map((g) => g.guessedPlayerId)
      )
      const candidates = players.filter((p) => p.id !== player.id && !usedByPlayer.has(p.id))
      const guessedPlayerId = (candidates[i % candidates.length] ?? players.find((p) => p.id !== player.id))?.id
      if (!guessedPlayerId) return
      submitGuess(song.id, player.id, guessedPlayerId)
      submitRating(song.id, player.id, (i * 2) % 6)
    })
  }

  function goNext() {
    if (isLastSongOverall) {
      navigate('/results')
    } else {
      nextSong()
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 pb-12 pt-16">
      {isFirstOfCategory && currentSongIndex > 0 && (
        <div className="mb-6 rounded-lg border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-center text-sm text-violet-300">
          Next up: {categoryName}
        </div>
      )}

      <AnswerForm
        key={`${song.id}:${currentPlayerId}`}
        song={song}
        index={currentSongIndex}
        total={songs.length}
        isOwnSong={isOwnSong}
        visiblePlayers={visiblePlayers}
        assignedElsewhere={assignedElsewhere}
        initialAnswer={initialAnswer}
        onSubmit={handleSubmit}
      />

      <p className="mb-4 text-center text-sm text-slate-400">
        {answeredCount}/{requiredResponders.length} have answered
      </p>

      {!allAnswered && (
        <button
          type="button"
          onClick={handleAutofillRest}
          className="mb-4 w-full rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-400"
        >
          Answer for everyone else on this song (to test the flow)
        </button>
      )}

      <div className="flex gap-3">
        {!isFirstOfCategory && (
          <button
            type="button"
            onClick={prevSong}
            className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400"
          >
            ← Previous Song
          </button>
        )}
        <button
          type="button"
          disabled={!allAnswered}
          onClick={goNext}
          className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
        >
          {isLastSongOverall ? 'See Results →' : 'Next Song →'}
        </button>
      </div>

      {stillNeeded.length > 0 && !stillNeeded.some((p) => p.id === currentPlayerId) && (
        <div className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-400/10 px-4 py-3">
          <p className="mb-3 text-emerald-300">Who's holding the device? Pick your name:</p>
          <div className="flex flex-wrap gap-2">
            {stillNeeded.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setCurrentPlayer(p.id)}
                className="rounded-full border border-emerald-400/60 bg-emerald-400/10 px-3 py-1.5 text-sm text-emerald-200 transition hover:border-emerald-400"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {allAnswered && (
        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
          <p className="mb-3 text-slate-300">Want to change an answer? Pick a name:</p>
          <div className="flex flex-wrap gap-2">
            {requiredResponders.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setCurrentPlayer(p.id)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  p.id === currentPlayerId
                    ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300'
                    : 'border-slate-600 text-slate-300 hover:border-slate-400'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
