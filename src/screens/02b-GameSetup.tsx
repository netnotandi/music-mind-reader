import { CategoryPicker } from '../components/CategoryPicker'
import {
  type RoundMode,
  SHORT_MODE_CAP_OPTIONS,
  type ShortModeCapSeconds,
  toggleCategorySelection,
  useGameStore,
} from '../state/gameStore'
import { useThemeStore } from '../state/themeStore'

const ROUND_MODES: { mode: RoundMode; label: string }[] = [
  { mode: 'short', label: 'Short' },
  { mode: 'long', label: 'Long' },
]

const CAP_LABELS: Record<ShortModeCapSeconds, string> = {
  60: '1 min',
  90: '90 sec',
  120: '2 min',
}

function roundLengthBlurb(mode: RoundMode, cap: ShortModeCapSeconds): string {
  if (mode === 'long') return 'Each song plays out in full. The host can skip a song early.'
  if (cap === 60) return 'Each song plays a full minute, then moves on. The host can skip a song early.'
  return `Each song plays 60 seconds to ${CAP_LABELS[cap]}, moving on sooner once everyone has answered. The host can skip a song early.`
}

// Round configuration, on its own screen so the Lobby can stay focused on
// "is everyone here?".
export function GameSetup() {
  const isLight = useThemeStore((s) => s.resolvedTheme === 'light')
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const hostId = useGameStore((s) => s.hostId)
  const categories = useGameStore((s) => s.categories)
  const selectedCategoryIds = useGameStore((s) => s.selectedCategoryIds)
  const roundMode = useGameStore((s) => s.roundMode)
  const shortModeCapSeconds = useGameStore((s) => s.shortModeCapSeconds)
  const chooseCategories = useGameStore((s) => s.chooseCategories)
  const chooseRoundMode = useGameStore((s) => s.chooseRoundMode)
  const chooseShortModeCap = useGameStore((s) => s.chooseShortModeCap)
  const startSubmitting = useGameStore((s) => s.startSubmitting)
  const backToLobby = useGameStore((s) => s.backToLobby)

  const isHost = localPlayerId !== null && localPlayerId === hostId
  const selectedCategories = categories.filter((c) => selectedCategoryIds.includes(c.id))
  const activeMode = ROUND_MODES.find((m) => m.mode === roundMode) ?? ROUND_MODES[0]
  const blurb = roundLengthBlurb(roundMode, shortModeCapSeconds)

  function toggleCategory(categoryId: string) {
    chooseCategories(toggleCategorySelection(selectedCategoryIds, categoryId))
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 pb-12 pt-16">
      <h1 className="mb-8 text-2xl font-bold text-text">Game Setup</h1>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Round length
        </h2>
        {isHost ? (
          <>
            <div className="flex gap-2">
              {ROUND_MODES.map((m) => {
                const active = m.mode === roundMode
                return (
                  <button
                    key={m.mode}
                    type="button"
                    onClick={() => chooseRoundMode(m.mode)}
                    className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? 'border-primary bg-primary-soft text-primary'
                        : `border-border text-text-secondary hover:border-border-strong ${isLight ? 'bg-surface' : ''}`
                    }`}
                  >
                    {m.label}
                  </button>
                )
              })}
            </div>

            {roundMode === 'short' && (
              <div className="mt-2 flex gap-1.5">
                {SHORT_MODE_CAP_OPTIONS.map((seconds) => {
                  const active = seconds === shortModeCapSeconds
                  return (
                    <button
                      key={seconds}
                      type="button"
                      onClick={() => chooseShortModeCap(seconds)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                        active
                          ? 'border-primary bg-primary-soft text-primary'
                          : `border-border text-text-secondary hover:border-border-strong ${isLight ? 'bg-surface' : ''}`
                      }`}
                    >
                      {CAP_LABELS[seconds]}
                    </button>
                  )
                })}
              </div>
            )}

            <p className="mt-2 text-xs text-text-muted">{blurb}</p>
          </>
        ) : (
          <p className="mt-1 text-sm text-text-secondary">
            {activeMode.label} — {blurb}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Category for this round
        </h2>

        {isHost ? (
          <CategoryPicker
            categories={categories}
            selectedCategoryIds={selectedCategoryIds}
            onToggle={toggleCategory}
          />
        ) : selectedCategories.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {selectedCategories.map((c) => (
              <span
                key={c.id}
                className={`rounded-full px-2.5 py-1 text-xs ${
                  isLight ? 'bg-primary/15 text-primary' : 'bg-success/20 text-success'
                }`}
              >
                {c.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-text-secondary">The host is choosing a category…</p>
        )}
      </section>

      <div className="mt-10">
        {isHost ? (
          <>
            <button
              type="button"
              disabled={selectedCategoryIds.length === 0}
              onClick={startSubmitting}
              className="w-full rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-bg disabled:text-disabled-text"
            >
              Start Submitting Songs
            </button>
            <button
              type="button"
              onClick={backToLobby}
              className="mt-3 w-full rounded-xl border border-border-strong px-4 py-2 text-sm text-text-secondary hover:border-border-strong"
            >
              ← Back to lobby
            </button>
          </>
        ) : (
          <div className="rounded-xl border border-border bg-surface-muted px-4 py-4 text-center text-text-secondary">
            The host is setting up the round…
          </div>
        )}
      </div>
    </div>
  )
}
