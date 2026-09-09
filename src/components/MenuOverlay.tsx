import { type ReactElement, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../state/gameStore'
import { type ThemeMode, useThemeStore } from '../state/themeStore'

const RULES_SECTIONS: { title: string; body: string }[] = [
  {
    title: 'How to Play',
    body:
      'The host creates a game and everyone else joins with the game code or QR. The host picks one category each round, and every player submits one song for it, anonymously. Once everyone is in, the group listens to each song (played right from the host\'s phone) and guesses who submitted it, then rates it 0-10.',
  },
  {
    title: 'Scoring',
    body:
      'Correct guess: +2 points. Your song’s average rating (0-10) is added as points. Nobody guessed your song: +5 bonus. Highest-rated song of the game: +2 bonus. Two or more players independently pick the same song ("Great Minds"): +1 point each. Each rating value can only be used once per person per category, so you can\'t give two songs the same score.',
  },
]

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 1020.354 15.354z" />
    </svg>
  )
}

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: () => ReactElement }[] = [
  { mode: 'light', label: 'Light', icon: SunIcon },
  { mode: 'dark', label: 'Dark', icon: MoonIcon },
]

function ThemeModeControl() {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)

  return (
    <div className="flex w-full gap-1 rounded-xl border border-border bg-surface p-1" role="group" aria-label="Theme">
      {THEME_OPTIONS.map(({ mode: optionMode, label, icon: Icon }) => {
        const active = mode === optionMode
        return (
          <button
            key={optionMode}
            type="button"
            onClick={() => setMode(optionMode)}
            aria-pressed={active}
            title={label}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium transition ${
              active ? 'bg-primary text-text-on-accent' : 'text-text-secondary hover:text-text'
            }`}
          >
            <Icon />
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function MenuOverlay() {
  const navigate = useNavigate()
  const leaveGame = useGameStore((s) => s.leaveGame)
  const [isOpen, setIsOpen] = useState(false)

  function close() {
    setIsOpen(false)
  }

  function goHome() {
    leaveGame()
    close()
    navigate('/')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Menu"
        className="fixed left-4 top-4 z-40 grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface/80 text-xl text-text backdrop-blur transition hover:border-border-strong"
      >
        ☰
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 py-10">
          {/* Stacked on narrow (phone) screens - the side-by-side layout
              only fits once there's room for a real sidebar alongside
              readable paragraph text (confirmed by testing at 390px wide,
              where the two-column version overflowed off both edges). */}
          <div className="relative flex max-h-full w-full max-w-2xl flex-col gap-6 overflow-y-auto rounded-2xl border border-border bg-bg p-6 sm:flex-row sm:gap-8">
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-xl text-text-muted transition hover:text-text"
            >
              ✕
            </button>

            <div className="flex flex-shrink-0 flex-col gap-3 pr-8 pt-1 sm:w-36 sm:pr-0">
              <button
                type="button"
                onClick={goHome}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-left font-medium text-text transition hover:border-border-strong"
              >
                Home
              </button>
              <ThemeModeControl />
            </div>

            <div className="min-w-0 flex-1 space-y-5 pt-1">
              {RULES_SECTIONS.map((section) => (
                <div key={section.title}>
                  <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-success">
                    {section.title}
                  </h3>
                  <p className="text-sm text-text-secondary">{section.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
