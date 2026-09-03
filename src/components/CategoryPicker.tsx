import { accentColorFor } from '../logic/accentColors'
import { MAX_SELECTED_CATEGORIES } from '../state/gameStore'
import type { Category } from '../types'

interface CategoryPickerProps {
  categories: Category[]
  selectedCategoryIds: string[]
  onToggle: (categoryId: string) => void
}

export function CategoryPicker({ categories, selectedCategoryIds, onToggle }: CategoryPickerProps) {
  const atMax = selectedCategoryIds.length >= MAX_SELECTED_CATEGORIES

  return (
    <div>
      <p className="mb-4 text-sm text-slate-400">
        Pick up to {MAX_SELECTED_CATEGORIES} categories ({selectedCategoryIds.length}/
        {MAX_SELECTED_CATEGORIES} selected)
      </p>
      <div className="grid grid-cols-2 gap-3">
        {categories.map((c, i) => {
          const selected = selectedCategoryIds.includes(c.id)
          const disabled = !selected && atMax
          const accent = accentColorFor(i)
          return (
            <button
              key={c.id}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(c.id)}
              className={`rounded-xl border-2 px-3 py-3 text-center text-sm font-medium leading-snug transition ${
                selected
                  ? `${accent.border} ${accent.bg} ${accent.text}`
                  : disabled
                    ? 'cursor-not-allowed border-slate-800 text-slate-600'
                    : 'border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              {c.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}