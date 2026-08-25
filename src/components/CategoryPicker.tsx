import { MAX_SELECTED_CATEGORIES, useGameStore } from '../state/gameStore'
import type { CategoryGroup } from '../types'

const GROUP_LABELS: Record<CategoryGroup, string> = {
  tegund: 'Tegund',
  'um-mig': 'Um mig',
}

export function CategoryPicker() {
  const categories = useGameStore((s) => s.categories)
  const selectedCategoryIds = useGameStore((s) => s.selectedCategoryIds)
  const toggleCategory = useGameStore((s) => s.toggleCategory)

  const groups: CategoryGroup[] = ['tegund', 'um-mig']
  const atMax = selectedCategoryIds.length >= MAX_SELECTED_CATEGORIES

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400">
        Veldu allt að {MAX_SELECTED_CATEGORIES} flokka ({selectedCategoryIds.length}/{MAX_SELECTED_CATEGORIES}{' '}
        valdir)
      </p>
      {groups.map((group) => (
        <div key={group}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            {GROUP_LABELS[group]}
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories
              .filter((c) => c.group === group)
              .map((c) => {
                const selected = selectedCategoryIds.includes(c.id)
                const disabled = !selected && atMax
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleCategory(c.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      selected
                        ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300'
                        : disabled
                          ? 'cursor-not-allowed border-slate-700 text-slate-600'
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
