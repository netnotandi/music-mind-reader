import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CategoryPicker } from '../components/CategoryPicker'
import { toggleCategorySelection, useGameStore } from '../state/gameStore'

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
      <div className="mx-auto max-w-md px-6 py-8 text-text-secondary">
        Missing your name — go back and create a game again.
      </div>
    )
  }

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((prev) => toggleCategorySelection(prev, categoryId))
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
      <h1 className="mb-6 text-xl font-bold text-text">Game Setup</h1>

      <div className="mb-8">
        <label className="mb-2 block text-sm font-semibold uppercase tracking-wide text-text-secondary">
          How many players?
        </label>
        <select
          className="w-full rounded-xl border border-border-strong bg-surface px-4 py-3 text-text"
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

      <h2 className="mb-4 text-xl font-bold text-text">Choose your categories</h2>
      <CategoryPicker categories={categories} selectedCategoryIds={selectedCategoryIds} onToggle={toggleCategory} />

      <button
        type="button"
        disabled={!canConfirm || creating}
        onClick={handleNext}
        className="mt-8 w-full rounded-xl bg-primary px-5 py-3 font-semibold text-text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-disabled-bg disabled:text-disabled-text"
      >
        {creating ? 'Creating game…' : 'NEXT'}
      </button>

      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-3 w-full rounded-xl border border-border-strong px-4 py-2 text-sm text-text-secondary hover:border-border-strong"
      >
        ← Back
      </button>
    </div>
  )
}