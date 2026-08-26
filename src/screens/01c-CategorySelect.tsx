import { useNavigate } from 'react-router-dom'
import { CategoryPicker } from '../components/CategoryPicker'
import { PlayerSwitcher } from '../components/PlayerSwitcher'
import { useGameStore } from '../state/gameStore'

export function CategorySelect() {
  const navigate = useNavigate()
  const selectedCategoryIds = useGameStore((s) => s.selectedCategoryIds)
  const confirmCategories = useGameStore((s) => s.confirmCategories)

  function handleNext() {
    confirmCategories()
    navigate('/lobby')
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 pb-8 pt-16">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">Choose your categories</h1>
        <PlayerSwitcher />
      </div>

      <CategoryPicker />

      <button
        type="button"
        disabled={selectedCategoryIds.length === 0}
        onClick={handleNext}
        className="mt-8 w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
      >
        NEXT
      </button>
    </div>
  )
}
