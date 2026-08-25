import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import { PlayerSwitcher } from '../components/PlayerSwitcher'

export function CreateJoin() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6">
      <div className="flex justify-center">
        <img src={logo} alt="Music Mind Reader" className="w-72" />
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => navigate('/lobby')}
          className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400"
        >
          CREATE GAME
        </button>
        <button
          type="button"
          onClick={() => navigate('/lobby')}
          className="rounded-xl border border-slate-600 px-5 py-3 font-semibold text-slate-100 transition hover:border-slate-400"
        >
          JOIN GAME
        </button>
      </div>

      <div className="flex justify-center">
        <PlayerSwitcher />
      </div>
    </div>
  )
}
