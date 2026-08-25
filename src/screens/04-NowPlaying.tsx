import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { SongCard } from '../components/SongCard'
import { getCurrentRoundSongs, useGameStore } from '../state/gameStore'

export function NowPlaying() {
  const navigate = useNavigate()
  const songs = useGameStore(useShallow(getCurrentRoundSongs))
  const currentSongIndex = useGameStore((s) => s.currentSongIndex)

  const song = songs[currentSongIndex]

  if (!song) {
    return (
      <div className="mx-auto max-w-md px-6 py-8 text-slate-300">
        Engin lög í þessari umferð — farðu aftur í Lobby.
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <p className="text-center text-sm text-slate-400">
        Leikstjóri spilar lagið í Spotify / YouTube Music / Apple Music
      </p>

      <SongCard title={song.title} artist={song.artist} index={currentSongIndex} total={songs.length} />

      <button
        type="button"
        onClick={() => navigate('/guess')}
        className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400"
      >
        Byrja að giska →
      </button>
    </div>
  )
}
