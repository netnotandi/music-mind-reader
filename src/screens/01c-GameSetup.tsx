import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CategoryPicker } from '../components/CategoryPicker'
import { MAX_SELECTED_CATEGORIES, useGameStore } from '../state/gameStore'

const PLAYER_COUNT_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10]

// Purely local state until the host confirms - no room exists yet, so
// there's nothing in Firebase to write to until the very end. Player count
// and categories live on one combined card for now; splitting them into
// separate steps later is just moving this markup around, not new logic.
export function GameSetup() {
  const navigate = useNavigate()
  const location = useLocation()
  const categories = useGameStore((s) => s.categories)
  const createGame = useGameStore((s) => s.createGame)

  const hostName = (location.state as { hostName?: string } | null)?.hostName ?? ''
  const [maxPlayers, setMaxPlayers] = useState<number | ''>('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  if (!hostName) {
    return (
      <div className="mx-auto max-w-md px-6 py-8 text-slate-300">
        Missing your name — go back and create a game again.
      </div>
    )
  }

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((prev) => {
      const alreadySelected = prev.includes(categoryId)
      if (!alreadySelected && prev.length >= MAX_SELECTED_CATEGORIES) return prev
      return alreadySelected ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    })
  }

  async function handleNext() {
    if (!maxPlayers || selectedCategoryIds.length === 0 || creating) return
    setCreating(true)
    // No explicit navigate here - the room becoming available flips this
    // device's synced `phase` to 'lobby', and the app-wide phase watcher
    // takes it from there for every device, including this one.
    await createGame(hostName, maxPlayers, selectedCategoryIds)
  }

  const canConfirm = maxPlayers !== '' && selectedCategoryIds.length > 0

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 pb-8 pt-16">
      <h1 className="mb-6 text-xl font-bold text-slate-100">Game Setup</h1>

      <div className="mb-8">
        <label className="mb-2 block text-sm font-semibold uppercase tracking-wide text-slate-400">
          How many players?
        </label>
        <select
          className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-slate-100"
          value={maxPlayers}
          onChange={(e) => setMaxPlayers(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">Select…</option>
          {PLAYER_COUNT_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <h2 className="mb-4 text-xl font-bold text-slate-100">Choose your categories</h2>
      <CategoryPicker categories={categories} selectedCategoryIds={selectedCategoryIds} onToggle={toggleCategory} />

      <button
        type="button"
        disabled={!canConfirm || creating}
        onClick={handleNext}
        className="mt-8 w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
      >
        {creating ? 'Creating game…' : 'NEXT'}
      </button>

      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-3 w-full rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-400"
      >
        ← Back
      </button>
    </div>
  )
}