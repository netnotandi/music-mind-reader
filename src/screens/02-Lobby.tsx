import { useNavigate } from 'react-router-dom'
import { PlayerSwitcher } from '../components/PlayerSwitcher'
import { useGameStore } from '../state/gameStore'
import { GAME_CODE } from '../state/mockData'

export function Lobby() {
  const navigate = useNavigate()
  const players = useGameStore((s) => s.players)
  const isHost = useGameStore((s) => s.isHost)
  const categories = useGameStore((s) => s.categories)
  const selectedCategoryIds = useGameStore((s) => s.selectedCategoryIds)

  const selectedCategories = categories.filter((c) => selectedCategoryIds.includes(c.id))

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 py-8">
      <h1 className="mb-4 text-center text-3xl font-extrabold uppercase tracking-wide bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
        Music Mind Reader
      </h1>
      <div className="mb-6 flex justify-center">
        <PlayerSwitcher />
      </div>

      <div className="mb-4 flex justify-center gap-4">
        <div className="grid h-28 w-28 flex-shrink-0 place-items-center rounded-xl border border-dashed border-slate-600 bg-slate-800 text-xs text-slate-500">
          QR kóði
        </div>
        <div className="flex flex-col justify-center rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Leikjakóði</p>
          <p className="text-2xl font-bold tracking-[0.2em] text-emerald-300">{GAME_CODE}</p>
        </div>
      </div>

      {selectedCategories.length > 0 && (
        <div className="mb-6 flex flex-wrap justify-center gap-1.5">
          {selectedCategories.map((c) => (
            <span
              key={c.id}
              className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs text-emerald-300"
            >
              {c.name}
            </span>
          ))}
        </div>
      )}

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
        <button
          type="button"
          disabled={selectedCategoryIds.length === 0}
          onClick={() => navigate('/submit')}
          className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
        >
          Áfram í lagaskil
        </button>
      ) : (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-4 text-center text-slate-300">
          Beðið eftir að leikstjóri hefji leikinn...
        </div>
      )}
    </div>
  )
}
