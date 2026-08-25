import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlayerSwitcher } from '../components/PlayerSwitcher'
import { GAME_CODE } from '../state/mockData'
import { useGameStore } from '../state/gameStore'

export function JoinGame() {
  const navigate = useNavigate()
  const setIsHost = useGameStore((s) => s.setIsHost)

  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.trim().toUpperCase() === GAME_CODE) {
      setIsHost(false)
      navigate('/lobby')
    } else {
      setError(true)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-20">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">Ganga í leik</h1>
        <PlayerSwitcher />
      </div>

      <div className="mb-8 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-600 py-6">
        <div className="grid h-28 w-28 place-items-center rounded-lg bg-slate-800 text-xs text-slate-500">
          Skanna QR
        </div>
        <p className="text-sm text-slate-400">eða sláðu inn leikjakóða</p>
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={handleSubmit}
      >
        <input
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-center text-lg tracking-[0.3em] text-slate-100 placeholder:tracking-normal placeholder:text-slate-500"
          placeholder="Leikjakóði"
          maxLength={4}
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError(false)
          }}
        />
        {error && <p className="text-center text-sm text-rose-400">Rangur kóði — reyndu aftur.</p>}
        <button
          type="submit"
          className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
        >
          Ganga í leik
        </button>
      </form>
    </div>
  )
}
