import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlayerSwitcher } from '../components/PlayerSwitcher'
import { useGameStore } from '../state/gameStore'

export function SubmitSong() {
  const navigate = useNavigate()
  const players = useGameStore((s) => s.players)
  const categories = useGameStore((s) => s.categories)
  const selectedCategoryId = useGameStore((s) => s.selectedCategoryId)
  const currentPlayerId = useGameStore((s) => s.currentPlayerId)
  const songs = useGameStore((s) => s.songs)
  const submitSong = useGameStore((s) => s.submitSong)
  const autofillRemainingSongs = useGameStore((s) => s.autofillRemainingSongs)

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')

  const category = categories.find((c) => c.id === selectedCategoryId)
  const mySong = songs.find(
    (s) => s.playerId === currentPlayerId && s.categoryId === selectedCategoryId
  )
  const submittedCount = players.filter((p) =>
    songs.some((s) => s.playerId === p.id && s.categoryId === selectedCategoryId)
  ).length
  const allSubmitted = submittedCount === players.length

  if (!category) {
    return (
      <div className="mx-auto max-w-md px-6 py-8 text-slate-300">
        Enginn flokkur valinn ennþá — farðu aftur í Lobby.
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">Skila lagi</h1>
        <PlayerSwitcher />
      </div>

      <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-slate-400">Flokkur</p>
        <p className="text-lg font-semibold text-emerald-300">{category.name}</p>
      </div>

      {mySong ? (
        <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-400/10 px-4 py-3 text-emerald-300">
          Þú hefur skilað lagi fyrir þennan flokk. ✓
        </div>
      ) : (
        <form
          className="mb-6 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!title.trim() || !artist.trim()) return
            submitSong(currentPlayerId, selectedCategoryId!, title.trim(), artist.trim())
            setTitle('')
            setArtist('')
          }}
        >
          <input
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500"
            placeholder="Titill lags"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500"
            placeholder="Flytjandi"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-900 hover:bg-emerald-400"
          >
            Skila lagi (nafnlaust)
          </button>
        </form>
      )}

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Staða innsendinga ({submittedCount}/{players.length})
      </h2>
      <ul className="mb-6 space-y-1">
        {players.map((p) => {
          const submitted = songs.some((s) => s.playerId === p.id && s.categoryId === selectedCategoryId)
          return (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2 text-slate-200"
            >
              {p.name}
              <span className={submitted ? 'text-emerald-400' : 'text-slate-500'}>
                {submitted ? 'skilað ✓' : 'bíður...'}
              </span>
            </li>
          )
        })}
      </ul>

      {!allSubmitted && (
        <button
          type="button"
          onClick={autofillRemainingSongs}
          className="mb-4 w-full rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-400"
        >
          Fylla út gervilög fyrir hina (til að prófa flæðið)
        </button>
      )}

      <button
        type="button"
        disabled={!allSubmitted}
        onClick={() => navigate('/now-playing')}
        className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
      >
        Áfram í spilun
      </button>
    </div>
  )
}
