import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../state/gameStore'

type View = 'menu' | 'rules' | 'settings'

const RULES_SECTIONS: { title: string; body: string }[] = [
  {
    title: 'How to Play',
    body:
      'The host creates a game and everyone else joins with the game code or QR. The host picks 1-3 categories for the round, and every player submits one song per category, anonymously. Once everyone is in, the group listens to each song (played outside the app, e.g. Spotify) and guesses who submitted it, then rates it 0-5.',
  },
  {
    title: 'Scoring',
    body:
      'Correct guess: +2 points. Your song’s average rating (0-10) is added as points. Nobody guessed your song: +5 bonus. Highest-rated song of the game: +2 bonus. Two or more players independently pick the same song ("Great Minds"): +1 point each. Each rating value can only be used once per person per category, so you can\'t give two songs the same score.',
  },
]

function MenuButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-left font-medium text-slate-100 transition hover:border-slate-500"
    >
      {label}
    </button>
  )
}

export function MenuOverlay() {
  const navigate = useNavigate()
  const startNewRound = useGameStore((s) => s.startNewRound)
  const setIsHost = useGameStore((s) => s.setIsHost)
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<View>('menu')

  function close() {
    setIsOpen(false)
    setView('menu')
  }

  function goHome() {
    startNewRound()
    setIsHost(false)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-[#0a0a2e] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-100">
                {view === 'menu' ? 'Menu' : view === 'rules' ? 'Rules' : 'Settings'}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg text-xl text-slate-400 transition hover:text-slate-100"
              >
                ✕
              </button>
            </div>

            {view === 'menu' && (
              <div className="flex flex-col gap-3">
                <MenuButton label="Home" onClick={goHome} />
                <MenuButton label="Settings" onClick={() => setView('settings')} />
                <MenuButton label="Rules" onClick={() => setView('rules')} />
              </div>
            )}

            {view === 'rules' && (
              <>
                <div className="mb-6 space-y-4">
                  {RULES_SECTIONS.map((section) => (
                    <div key={section.title}>
                      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-emerald-300">
                        {section.title}
                      </h3>
                      <p className="text-sm text-slate-300">{section.body}</p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setView('menu')}
                  className="w-full rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-400"
                >
                  ← Back
                </button>
              </>
            )}

            {view === 'settings' && (
              <>
                <p className="mb-6 text-sm text-slate-400">No settings yet — check back soon!</p>
                <button
                  type="button"
                  onClick={() => setView('menu')}
                  className="w-full rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-400"
                >
                  ← Back
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
