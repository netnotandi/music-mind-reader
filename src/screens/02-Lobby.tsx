import { useNavigate } from 'react-router-dom'
import { CategoryPicker } from '../components/CategoryPicker'
import { PlayerSwitcher } from '../components/PlayerSwitcher'
import { useGameStore } from '../state/gameStore'
import { GAME_CODE } from '../state/mockData'

export function Lobby() {
  const navigate = useNavigate()
  const players = useGameStore((s) => s.players)
  const isHost = useGameStore((s) => s.isHost)
  const selectedCategoryId = useGameStore((s) => s.selectedCategoryId)

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">Lobby</h1>
        <PlayerSwitcher />
      </div>

      <div className="mb-6 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-600 py-6">
        <div className="grid h-28 w-28 place-items-center rounded-lg bg-slate-800 text-xs text-slate-500">
          QR kóði
        </div>
        <p className="text-sm text-slate-400">Leikjakóði: {GAME_CODE}</p>
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Leikmenn ({players.length})
      </h2>
      <ul className="mb-8 space-y-1">
        {players.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2 text-slate-200"
          >
            {p.name}
            <span className="text-xs text-emerald-400">tengdur</span>
          </li>
        ))}
      </ul>

      {isHost ? (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Leikstjóri velur flokk
          </h2>
          <CategoryPicker />

          <button
            type="button"
            disabled={!selectedCategoryId}
            onClick={() => navigate('/submit')}
            className="mt-8 w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
          >
            Áfram í lagaskil
          </button>
        </>
      ) : (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-4 text-center text-slate-300">
          Beðið eftir að leikstjóri velji flokk...
        </div>
      )}
    </div>
  )
}
