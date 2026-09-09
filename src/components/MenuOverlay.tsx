import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../state/gameStore'

const RULES_SECTIONS: { title: string; body: string }[] = [
  {
    title: 'How to Play',
    body:
      'The host creates a game and everyone else joins with the game code or QR. The host picks 1-3 categories for the round, and every player submits one song per category, anonymously. Once everyone is in, the group listens to each song (played right from the host\'s phone) and guesses who submitted it, then rates it 0-10.',
  },
  {
    title: 'Scoring',
    body:
      'Correct guess: +2 points. Your song’s average rating (0-10) is added as points. Nobody guessed your song: +5 bonus. Highest-rated song of the game: +2 bonus. Two or more players independently pick the same song ("Great Minds"): +1 point each. Each rating value can only be used once per person per category, so you can\'t give two songs the same score.',
  },
]

// Purely a visual placeholder for now - the app only has a dark theme, so
// this doesn't switch anything yet. Shown as a disabled toggle (moon side
// "on") rather than a working control, so it doesn't look broken.
function ThemeToggleIcon() {
  return (
    <span className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full bg-slate-600">
      <span className="ml-auto mr-0.5 grid h-5 w-5 place-items-center rounded-full bg-slate-200 text-slate-800">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
          <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 1020.354 15.354z" />
        </svg>
      </span>
    </span>
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
        className="fixed left-4 top-4 z-40 grid h-10 w-10 place-items-center rounded-lg border border-slate-700 bg-slate-800/80 text-xl text-slate-200 backdrop-blur transition hover:border-slate-500"
      >
        ☰
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 py-10">
          {/* Stacked on narrow (phone) screens - the side-by-side layout
              only fits once there's room for a real sidebar alongside
              readable paragraph text (confirmed by testing at 390px wide,
              where the two-column version overflowed off both edges). */}
          <div className="relative flex max-h-full w-full max-w-2xl flex-col gap-6 overflow-y-auto rounded-2xl border border-slate-700 bg-[#0a0a2e] p-6 sm:flex-row sm:gap-8">
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-xl text-slate-400 transition hover:text-slate-100"
            >
              ✕
            </button>

            <div className="flex flex-shrink-0 flex-col gap-3 pr-8 pt-1 sm:w-36 sm:pr-0">
              <button
                type="button"
                onClick={goHome}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-left font-medium text-slate-100 transition hover:border-slate-500"
              >
                Home
              </button>
              <button
                type="button"
                disabled
                title="Coming soon"
                className="flex w-full cursor-not-allowed items-center justify-between rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-left font-medium text-slate-100 opacity-60"
              >
                Light/Dark
                <ThemeToggleIcon />
              </button>
            </div>

            <div className="min-w-0 flex-1 space-y-5 pt-1">
              {RULES_SECTIONS.map((section) => (
                <div key={section.title}>
                  <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-emerald-300">
                    {section.title}
                  </h3>
                  <p className="text-sm text-slate-300">{section.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
