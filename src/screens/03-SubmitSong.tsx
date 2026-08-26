import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../state/gameStore'

export function SubmitSong() {
  const navigate = useNavigate()
  const players = useGameStore((s) => s.players)
  const categories = useGameStore((s) => s.categories)
  const selectedCategoryIds = useGameStore((s) => s.selectedCategoryIds)
  const currentPlayerId = useGameStore((s) => s.currentPlayerId)
  const songs = useGameStore((s) => s.songs)
  const submitSong = useGameStore((s) => s.submitSong)
  const autofillRemainingSongs = useGameStore((s) => s.autofillRemainingSongs)

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')

  const selectedCategories = categories.filter((c) => selectedCategoryIds.includes(c.id))
  const hasSong = (playerId: string, categoryId: string) =>
    songs.some((s) => s.playerId === playerId && s.categoryId === categoryId)

  const nextCategoryForMe = selectedCategories.find((c) => !hasSong(currentPlayerId, c.id))

  const totalRequired = players.length * selectedCategories.length
  const totalSubmitted = songs.filter((s) => selectedCategoryIds.includes(s.categoryId)).length
  const allSubmitted = selectedCategories.length > 0 && totalSubmitted === totalRequired

  if (selectedCategories.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 py-8 text-slate-300">
        No category selected yet — go back to the Lobby.
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 py-12">
      {nextCategoryForMe ? (
        <>
          <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Category</p>
            <p className="text-lg font-semibold text-emerald-300">{nextCategoryForMe.name}</p>
          </div>

          <form
            className="mb-6 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!title.trim() || !artist.trim()) return
              submitSong(currentPlayerId, nextCategoryForMe.id, title.trim(), artist.trim())
              setTitle('')
              setArtist('')
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
              Submit Song
            </button>
          </form>
        </>
      ) : (
        <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-400/10 px-4 py-3 text-emerald-300">
          You've submitted a song for every category. ✓
        </div>
      )}

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
              <tr key={p.id} className="border-b border-slate-800 last:border-0">
                <td className="px-3 py-2 text-slate-200">{p.name}</td>
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
        onClick={() => navigate('/guess')}
        className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
      >
        Start Guessing
      </button>
    </div>
  )
}
