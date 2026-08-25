import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import { PlayerSwitcher } from '../components/PlayerSwitcher'
import { useGameStore } from '../state/gameStore'

export function CreateJoin() {
  const navigate = useNavigate()
  const setIsHost = useGameStore((s) => s.setIsHost)

  function handleCreateGame() {
    setIsHost(true)
    navigate('/lobby')
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-20">
      <div className="flex justify-center">
        <img src={logo} alt="Music Mind Reader" className="w-80" />
      </div>

      <div className="mx-auto mt-20 flex w-72 flex-col gap-3">
        <button
          type="button"
          onClick={handleCreateGame}
          className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
        >
          CREATE GAME
        </button>
        <button
          type="button"
          onClick={() => navigate('/join')}
          className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-400"
        >
          JOIN GAME
        </button>
      </div>

      <div className="mt-6 flex justify-center">
        <PlayerSwitcher />
      </div>
    </div>
  )
}
