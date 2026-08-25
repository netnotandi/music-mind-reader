import { useGameStore } from '../state/gameStore'
import type { CategoryGroup } from '../types'

const GROUP_LABELS: Record<CategoryGroup, string> = {
  tegund: 'Tegund',
  'um-mig': 'Um mig',
}

export function CategoryPicker() {
  const categories = useGameStore((s) => s.categories)
  const selectedCategoryId = useGameStore((s) => s.selectedCategoryId)
  const selectCategory = useGameStore((s) => s.selectCategory)

  const groups: CategoryGroup[] = ['tegund', 'um-mig']

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            {GROUP_LABELS[group]}
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories
              .filter((c) => c.group === group)
              .map((c) => {
                const selected = c.id === selectedCategoryId
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCategory(c.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      selected
                        ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300'
                        : 'border-slate-600 text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {c.name}
                  </button>
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}
