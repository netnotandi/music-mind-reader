import { MAX_SELECTED_CATEGORIES, useGameStore } from '../state/gameStore'

// Cycled per category so a full grid of selections reads like the logo's
// own cyan -> blue -> violet -> pink gradient instead of one flat accent.
const ACCENT_COLORS = [
  { border: 'border-cyan-400', bg: 'bg-cyan-400/15', text: 'text-cyan-300' },
  { border: 'border-sky-400', bg: 'bg-sky-400/15', text: 'text-sky-300' },
  { border: 'border-blue-400', bg: 'bg-blue-400/15', text: 'text-blue-300' },
  { border: 'border-violet-400', bg: 'bg-violet-400/15', text: 'text-violet-300' },
  { border: 'border-fuchsia-400', bg: 'bg-fuchsia-400/15', text: 'text-fuchsia-300' },
  { border: 'border-pink-400', bg: 'bg-pink-400/15', text: 'text-pink-300' },
]

export function CategoryPicker() {
  const categories = useGameStore((s) => s.categories)
  const selectedCategoryIds = useGameStore((s) => s.selectedCategoryIds)
  const toggleCategory = useGameStore((s) => s.toggleCategory)

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
          const accent = ACCENT_COLORS[i % ACCENT_COLORS.length]
          return (
            <button
              key={c.id}
              type="button"
              disabled={disabled}
              onClick={() => toggleCategory(c.id)}
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
