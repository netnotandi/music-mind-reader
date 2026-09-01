import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../state/gameStore'
import type { Category } from '../types'

interface SongFormProps {
  category: Category
  existingSong: { title: string; artist: string } | undefined
  onSubmit: (title: string, artist: string) => void
}

// Keyed by `${currentPlayerId}:${category.id}` from the parent, so React
// remounts this component (and resets/refills title+artist from
// existingSong) whenever the selected player or their category changes.
function SongForm({ category, existingSong, onSubmit }: SongFormProps) {
  const [title, setTitle] = useState(existingSong?.title ?? '')
  const [artist, setArtist] = useState(existingSong?.artist ?? '')

  return (
    <>
      <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-slate-400">Category</p>
        <p className="text-lg font-semibold text-emerald-300">{category.name}</p>
      </div>

      <form
        className="mb-6 flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim() || !artist.trim()) return
          onSubmit(title.trim(), artist.trim())
        }}
      >
        <input
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500"
          placeholder="Song title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500"
          placeholder="Artist"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-900 hover:bg-emerald-400"
        >
          {existingSong ? 'Edit Song' : 'Submit Song'}
        </button>
      </form>
    </>
  )
}

interface ProgressTableProps {
  players: { id: string; name: string }[]
  selectedCategories: Category[]
  currentPlayerId: string | null
  hasSong: (playerId: string, categoryId: string) => boolean
}

// Shown both on the initial "who's holding the device?" gate (so the group
// can see submission progress before anyone's even picked their name) and
// below the form once someone's answering.
function ProgressTable({ players, selectedCategories, currentPlayerId, hasSong }: ProgressTableProps) {
  return (
    <div className="mb-6 overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400">
            <th className="px-3 py-2 text-left font-medium">Player</th>
            {selectedCategories.map((c) => (
              <th key={c.id} className="px-2 py-2 text-center font-medium">
                {c.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr
              key={p.id}
              className={`border-b border-slate-800 last:border-0 ${
                p.id === currentPlayerId ? 'bg-emerald-400/10' : ''
              }`}
            >
              <td
                className={`px-3 py-2 ${
                  p.id === currentPlayerId ? 'font-semibold text-emerald-300' : 'text-slate-200'
                }`}
              >
                {p.name}
              </td>
              {selectedCategories.map((c) => (
                <td key={c.id} className="px-2 py-2 text-center">
                  {hasSong(p.id, c.id) ? (
                    <span className="text-emerald-400">✓</span>
                  ) : (
                    <span className="text-slate-600">·</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SubmitSong() {
  const navigate = useNavigate()
  const players = useGameStore((s) => s.players)
  const categories = useGameStore((s) => s.categories)
  const selectedCategoryIds = useGameStore((s) => s.selectedCategoryIds)
  const currentPlayerId = useGameStore((s) => s.currentPlayerId)
  const songs = useGameStore((s) => s.songs)
  const submitSong = useGameStore((s) => s.submitSong)
  const autofillRemainingSongs = useGameStore((s) => s.autofillRemainingSongs)
  const shuffleSongOrder = useGameStore((s) => s.shuffleSongOrder)
  const setCurrentPlayer = useGameStore((s) => s.setCurrentPlayer)

  // Nobody has submitted anything for this round yet, so there's no natural
  // "current player" to assume - ask who's holding the device first, same
  // prompt style as the handoff box shown to later players.
  const [identityConfirmed, setIdentityConfirmed] = useState(songs.length > 0)

  const selectedCategories = categories.filter((c) => selectedCategoryIds.includes(c.id))
  const hasSong = (playerId: string, categoryId: string) =>
    songs.some((s) => s.playerId === playerId && s.categoryId === categoryId)

  // Focus on the current player's first not-yet-submitted category, or fall
  // back to their first selected category (in edit mode) once they've done
  // them all.
  const categoryToShow =
    selectedCategories.find((c) => !hasSong(currentPlayerId, c.id)) ?? selectedCategories[0]
  const existingSong = categoryToShow
    ? songs.find((s) => s.playerId === currentPlayerId && s.categoryId === categoryToShow.id)
    : undefined

  const totalRequired = players.length * selectedCategories.length
  const totalSubmitted = songs.filter((s) => selectedCategoryIds.includes(s.categoryId)).length
  const allSubmitted = selectedCategories.length > 0 && totalSubmitted === totalRequired
  const playersStillNeeded = players.filter((p) => selectedCategories.some((c) => !hasSong(p.id, c.id)))

  if (selectedCategories.length === 0 || !categoryToShow) {
    return (
      <div className="mx-auto max-w-md px-6 py-8 text-slate-300">
        No category selected yet — go back to the Lobby.
      </div>
    )
  }

  if (!identityConfirmed) {
    return (
      <div className="mx-auto min-h-screen max-w-md px-6 pb-12 pt-16">
        <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-400/10 px-4 py-3">
          <p className="mb-3 text-emerald-300">Who's holding the device? Pick your name:</p>
          <div className="flex flex-wrap gap-2">
            {players.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setCurrentPlayer(p.id)
                  setIdentityConfirmed(true)
                }}
                className="rounded-full border border-emerald-400/60 bg-emerald-400/10 px-3 py-1.5 text-sm text-emerald-200 transition hover:border-emerald-400"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <ProgressTable
          players={players}
          selectedCategories={selectedCategories}
          currentPlayerId={null}
          hasSong={hasSong}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 pb-12 pt-16">
      <SongForm
        key={`${currentPlayerId}:${categoryToShow.id}`}
        category={categoryToShow}
        existingSong={existingSong}
        onSubmit={(title, artist) => submitSong(currentPlayerId, categoryToShow.id, title, artist)}
      />

      {playersStillNeeded.length > 0 && !playersStillNeeded.some((p) => p.id === currentPlayerId) && (
        <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-400/10 px-4 py-3">
          <p className="mb-3 text-emerald-300">Thanks! Pass the device to the next player:</p>
          <div className="flex flex-wrap gap-2">
            {playersStillNeeded.map((p) => (
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

      <ProgressTable
        players={players}
        selectedCategories={selectedCategories}
        currentPlayerId={currentPlayerId}
        hasSong={hasSong}
      />

      {!allSubmitted && (
        <button
          type="button"
          onClick={autofillRemainingSongs}
          className="mb-4 w-full rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-400"
        >
          Fill in mock songs for everyone else (to test the flow)
        </button>
      )}

      <button
        type="button"
        disabled={!allSubmitted}
        onClick={() => {
          shuffleSongOrder()
          navigate('/guess')
        }}
        className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
      >
        Start Guessing
      </button>
    </div>
  )
}
