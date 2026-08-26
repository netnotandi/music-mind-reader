import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { SongCard } from '../components/SongCard'
import { getCurrentRoundSongs, useGameStore } from '../state/gameStore'

const RATING_OPTIONS = [0, 1, 2, 3, 4, 5]

export function GuessAndRate() {
  const navigate = useNavigate()
  const songs = useGameStore(useShallow(getCurrentRoundSongs))
  const currentSongIndex = useGameStore((s) => s.currentSongIndex)
  const currentPlayerId = useGameStore((s) => s.currentPlayerId)
  const players = useGameStore((s) => s.players)
  const guesses = useGameStore((s) => s.guesses)
  const ratings = useGameStore((s) => s.ratings)
  const submitGuess = useGameStore((s) => s.submitGuess)
  const submitRating = useGameStore((s) => s.submitRating)
  const nextSong = useGameStore((s) => s.nextSong)

  const [guessedPlayerId, setGuessedPlayerId] = useState<string | null>(null)
  const [rating, setRating] = useState<number | null>(null)

  const song = songs[currentSongIndex]

  // Re-derive the draft from the store whenever the song or the "logged in"
  // player changes, instead of leaving stale local state - otherwise
  // switching players mid-guess via PlayerSwitcher leaks one player's
  // half-finished answer into whoever you switch to next.
  useEffect(() => {
    if (!song) return
    const existingGuess = guesses.find((g) => g.songId === song.id && g.guesserId === currentPlayerId)
    const existingRating = ratings.find((r) => r.songId === song.id && r.raterId === currentPlayerId)
    setGuessedPlayerId(existingGuess?.guessedPlayerId ?? null)
    setRating(existingRating?.value ?? null)
  }, [song, currentPlayerId, guesses, ratings])

  if (!song) {
    return (
      <div className="mx-auto max-w-md px-6 py-8 text-slate-300">
        No song playing — go back to the Lobby.
      </div>
    )
  }

  const isOwnSong = song.playerId === currentPlayerId
  const isLastSong = currentSongIndex >= songs.length - 1

  function goToNext() {
    if (!isLastSong) {
      nextSong()
    } else {
      navigate('/results')
    }
  }

  function handleSubmit() {
    if (!isOwnSong) {
      if (guessedPlayerId) submitGuess(song.id, currentPlayerId, guessedPlayerId)
      if (rating !== null) submitRating(song.id, currentPlayerId, rating)
    }
    goToNext()
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 py-12">
      <div className="mb-6">
        <SongCard title={song.title} artist={song.artist} index={currentSongIndex} total={songs.length} />
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
            {players
              .filter((p) => p.id !== currentPlayerId)
              .map((p) => (
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

      <button
        type="button"
        disabled={!isOwnSong && (!guessedPlayerId || rating === null)}
        onClick={handleSubmit}
        className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
      >
        {isLastSong ? 'See Results →' : 'Next Song →'}
      </button>
    </div>
  )
}
