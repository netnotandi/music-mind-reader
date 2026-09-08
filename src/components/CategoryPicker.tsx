import { useState } from 'react'
import { accentColorFor } from '../logic/accentColors'
import { MAX_SELECTED_CATEGORIES } from '../state/gameStore'
import type { Category } from '../types'

interface CategoryPickerProps {
  categories: Category[]
  selectedCategoryIds: string[]
  onToggle: (categoryId: string) => void
}

const PAGE_SIZE = 6

export function CategoryPicker({ categories, selectedCategoryIds, onToggle }: CategoryPickerProps) {
  // Local to this component instance - paged browsing is a pure UI concern,
  // and resets naturally to page 0 each time the picker (re)mounts (e.g. the
  // next round's fresh category choice).
  const [page, setPage] = useState(0)
  const totalPages = Math.max(Math.ceil(categories.length / PAGE_SIZE), 1)
  const pageCategories = categories.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  // At MAX_SELECTED_CATEGORIES === 1, other buttons stay enabled - clicking
  // one swaps the selection (see toggleCategorySelection) instead of
  // requiring the current pick to be deselected first.
  const atMax = MAX_SELECTED_CATEGORIES > 1 && selectedCategoryIds.length >= MAX_SELECTED_CATEGORIES

  function goToPage(next: number) {
    setPage(Math.min(Math.max(next, 0), totalPages - 1))
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-400">
        {MAX_SELECTED_CATEGORIES === 1
          ? 'Pick a category'
          : `Pick up to ${MAX_SELECTED_CATEGORIES} categories (${selectedCategoryIds.length}/${MAX_SELECTED_CATEGORIES} selected)`}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {pageCategories.map((c, i) => {
          // Global index (not the page-relative one) so a category's accent
          // color stays the same regardless of which page it's shown on.
          const globalIndex = page * PAGE_SIZE + i
          const selected = selectedCategoryIds.includes(c.id)
          const disabled = !selected && atMax
          const accent = accentColorFor(globalIndex)
          return (
            <button
              key={c.id}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(c.id)}
              className={`relative rounded-xl border-2 px-3 py-3 text-center text-sm font-medium leading-snug transition ${
                selected
                  ? `${accent.border} ${accent.bg} ${accent.text}`
                  : disabled
                    ? 'cursor-not-allowed border-slate-800 text-slate-600'
                    : 'border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              {selected && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-900">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              {c.name}
            </button>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => goToPage(page - 1)}
            aria-label="Previous categories"
            className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-slate-600 text-slate-300 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-slate-400">
              {page + 1} / {totalPages}
            </span>
            <div className="flex gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToPage(i)}
                  aria-label={`Go to page ${i + 1}`}
                  className={`h-1.5 w-1.5 rounded-full transition ${i === page ? 'bg-cyan-400' : 'bg-slate-600'}`}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={page === totalPages - 1}
            onClick={() => goToPage(page + 1)}
            aria-label="Next categories"
            className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-slate-600 text-slate-300 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
