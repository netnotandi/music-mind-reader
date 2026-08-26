import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { SongCard } from '../components/SongCard'
import { getCurrentRoundSongs, useGameStore } from '../state/gameStore'
import type { Player, Song } from '../types'

const RATING_OPTIONS = [0, 1, 2, 3, 4, 5]

interface DraftAnswer {
  guessedPlayerId: string | null
  rating: number | null
}

interface AnswerFormProps {
  song: Song
  index: number
  total: number
  isOwnSong: boolean
  isFirstOfCategory: boolean
  isLastOfCategory: boolean
  availablePlayers: Player[]
  initialAnswer: DraftAnswer | undefined
  onPrevious: () => void
  onNext: (answer: DraftAnswer) => void
}

// Keyed by song.id from the parent, so React remounts this component (and
// resets guessedPlayerId/rating from initialAnswer) whenever the song
// changes, instead of syncing local state from a prop via an effect.
function AnswerForm({
  song,
  index,
  total,
  isOwnSong,
  isFirstOfCategory,
  isLastOfCategory,
  availablePlayers,
  initialAnswer,
  onPrevious,
  onNext,
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
            {availablePlayers.map((p) => (
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
              </button>
            ))}
          </div>

          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Rating (0-5)
          </h2>
          <div className="mb-8 flex gap-2">
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
        </>
      )}

      <div className="flex gap-3">
        {!isFirstOfCategory && (
          <button
            type="button"
            onClick={onPrevious}
            className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400"
          >
            ← Previous Song
          </button>
        )}
        <button
          type="button"
          disabled={!isOwnSong && (!guessedPlayerId || rating === null)}
          onClick={() => onNext({ guessedPlayerId, rating })}
          className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
        >
          {isLastOfCategory ? 'Review Answers →' : 'Next Song →'}
        </button>
      </div>
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
  const submitGuess = useGameStore((s) => s.submitGuess)
  const submitRating = useGameStore((s) => s.submitRating)
  const nextSong = useGameStore((s) => s.nextSong)
  const prevSong = useGameStore((s) => s.prevSong)

  // Answers for the category currently being played are kept as a local
  // draft - nothing is written to the store until the category is reviewed
  // and submitted, so you can freely go back and change your mind on any
  // song in this category before it's locked in.
  const [draftAnswers, setDraftAnswers] = useState<Record<string, DraftAnswer>>({})
  const [phase, setPhase] = useState<'answering' | 'reviewing'>('answering')

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
  const isLastOfCategory =
    currentSongIndex === songs.length - 1 || songs[currentSongIndex + 1]?.categoryId !== song.categoryId
  const categoryName = categories.find((c) => c.id === song.categoryId)?.name
  const categorySongs = songs.filter((s) => s.categoryId === song.categoryId)

  // Each player owns exactly one song per category, so once you've used a
  // name as your guess for a different song in this same category, picking
  // them again would be a contradiction - hide them instead of letting
  // players second-guess themselves into a duplicate. Draft answers only
  // ever hold the current category, so no categoryId filtering is needed.
  const usedGuessesInCategory = new Set(
    Object.entries(draftAnswers)
      .filter(([songId]) => songId !== song.id)
      .map(([, answer]) => answer.guessedPlayerId)
      .filter((id): id is string => id !== null)
  )
  const availablePlayers = players.filter(
    (p) => p.id !== currentPlayerId && !usedGuessesInCategory.has(p.id)
  )

  function handleNext(answer: DraftAnswer) {
    if (!isOwnSong) {
      setDraftAnswers((prev) => ({ ...prev, [song.id]: answer }))
    }
    if (isLastOfCategory) {
      setPhase('reviewing')
    } else {
      nextSong()
    }
  }

  function handlePrevious() {
    if (phase === 'reviewing') {
      setPhase('answering')
    } else if (!isFirstOfCategory) {
      prevSong()
    }
  }

  function handleSubmitCategory() {
    for (const [songId, answer] of Object.entries(draftAnswers)) {
      if (answer.guessedPlayerId) submitGuess(songId, currentPlayerId, answer.guessedPlayerId)
      if (answer.rating !== null) submitRating(songId, currentPlayerId, answer.rating)
    }
    setDraftAnswers({})
    if (isLastSongOverall) {
      navigate('/results')
    } else {
      nextSong()
      setPhase('answering')
    }
  }

  if (phase === 'reviewing') {
    return (
      <div className="mx-auto min-h-screen max-w-md px-6 py-12">
        <h1 className="mb-1 text-center text-xl font-bold text-slate-100">Review your answers</h1>
        <p className="mb-6 text-center text-sm text-slate-400">{categoryName}</p>

        <ul className="mb-8 space-y-2">
          {categorySongs.map((s) => {
            const isOwn = s.playerId === currentPlayerId
            const answer = draftAnswers[s.id]
            const guessedPlayer = players.find((p) => p.id === answer?.guessedPlayerId)
            return (
              <li key={s.id} className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3">
                <p className="font-medium text-slate-100">
                  {s.title} <span className="font-normal text-slate-400">{s.artist}</span>
                </p>
                {isOwn ? (
                  <p className="mt-1 text-sm text-slate-500">Your song</p>
                ) : (
                  <p className="mt-1 text-sm text-slate-400">
                    Guess: <span className="text-emerald-300">{guessedPlayer?.name ?? '—'}</span> · Rating:{' '}
                    <span className="text-fuchsia-300">{answer?.rating ?? '—'}</span>
                  </p>
                )}
              </li>
            )
          })}
        </ul>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handlePrevious}
            className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400"
          >
            Edit Answers
          </button>
          <button
            type="button"
            onClick={handleSubmitCategory}
            className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400"
          >
            {isLastSongOverall ? 'Submit & See Results' : 'Submit & Continue'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 py-12">
      {isFirstOfCategory && currentSongIndex > 0 && (
        <div className="mb-6 rounded-lg border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-center text-sm text-violet-300">
          Next up: {categoryName}
        </div>
      )}

      <AnswerForm
        key={song.id}
        song={song}
        index={currentSongIndex}
        total={songs.length}
        isOwnSong={isOwnSong}
        isFirstOfCategory={isFirstOfCategory}
        isLastOfCategory={isLastOfCategory}
        availablePlayers={availablePlayers}
        initialAnswer={draftAnswers[song.id]}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </div>
  )
}
