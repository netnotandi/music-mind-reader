import { useState } from 'react'
import { useGameStore } from '../state/gameStore'
import { MOCK_SONG_POOL } from '../state/mockData'
import type { Category } from '../types'

interface SongFormProps {
  category: Category
  existingSong: { title: string; artist: string } | undefined
  onSubmit: (title: string, artist: string) => void
}

// Keyed by `${category.id}` from the parent, so React remounts this (and
// resets/refills title+artist from existingSong) whenever the category
// being filled in changes.
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
  localPlayerId: string
  hasSong: (playerId: string, categoryId: string) => boolean
}

function ProgressTable({ players, selectedCategories, localPlayerId, hasSong }: ProgressTableProps) {
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
                p.id === localPlayerId ? 'bg-emerald-400/10' : ''
              }`}
            >
              <td
                className={`px-3 py-2 ${
                  p.id === localPlayerId ? 'font-semibold text-emerald-300' : 'text-slate-200'
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
  const players = useGameStore((s) => s.players)
  const categories = useGameStore((s) => s.categories)
  const selectedCategoryIds = useGameStore((s) => s.selectedCategoryIds)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const songs = useGameStore((s) => s.songs)
  const submitSong = useGameStore((s) => s.submitSong)
  const devSubmitSongAs = useGameStore((s) => s.devSubmitSongAs)
  const shuffleSongOrder = useGameStore((s) => s.shuffleSongOrder)

  const selectedCategories = categories.filter((c) => selectedCategoryIds.includes(c.id))
  const hasSong = (playerId: string, categoryId: string) =>
    songs.some((s) => s.playerId === playerId && s.categoryId === categoryId)

  if (!localPlayerId) {
    return (
      <div className="mx-auto max-w-md px-6 py-8 text-slate-300">
        Not connected to a game — go back to the start.
      </div>
    )
  }

  // Focus on my first not-yet-submitted category, or fall back to my first
  // selected category (in edit mode) once I've done them all.
  const categoryToShow =
    selectedCategories.find((c) => !hasSong(localPlayerId, c.id)) ?? selectedCategories[0]
  const existingSong = categoryToShow
    ? songs.find((s) => s.playerId === localPlayerId && s.categoryId === categoryToShow.id)
    : undefined

  const totalRequired = players.length * selectedCategories.length
  const totalSubmitted = songs.filter((s) => selectedCategoryIds.includes(s.categoryId)).length
  const allSubmitted = selectedCategories.length > 0 && totalSubmitted === totalRequired

  if (selectedCategories.length === 0 || !categoryToShow) {
    return (
      <div className="mx-auto max-w-md px-6 py-8 text-slate-300">
        No category selected yet — go back to the Lobby.
      </div>
    )
  }

  function handleDevAutofill() {
    let pickIndex = 0
    for (const category of selectedCategories) {
      for (const player of players) {
        if (hasSong(player.id, category.id)) continue
        const pick = MOCK_SONG_POOL[pickIndex % MOCK_SONG_POOL.length]
        pickIndex++
        devSubmitSongAs(player.id, category.id, pick.title, pick.artist)
      }
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 pb-12 pt-16">
      <SongForm
        key={categoryToShow.id}
        category={categoryToShow}
        existingSong={existingSong}
        onSubmit={(title, artist) => submitSong(categoryToShow.id, title, artist)}
      />

      <ProgressTable
        players={players}
        selectedCategories={selectedCategories}
        localPlayerId={localPlayerId}
        hasSong={hasSong}
      />

      {!allSubmitted && import.meta.env.DEV && (
        <button
          type="button"
          onClick={handleDevAutofill}
          className="mb-4 w-full rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-400"
        >
          Fill in mock songs for everyone else (dev only, to test the flow)
        </button>
      )}

      <button
        type="button"
        disabled={!allSubmitted}
        onClick={shuffleSongOrder}
        className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
      >
        Start Guessing
      </button>
    </div>
  )
}