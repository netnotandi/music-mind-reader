import { type ReactElement, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AccountPanel } from './AccountPanel'
import { useGameStore } from '../state/gameStore'
import { type ThemeMode, useThemeStore } from '../state/themeStore'
import { useUiStore } from '../state/uiStore'

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

// Visible to every player in the room, not just the host - so everyone can
// see who's in the game (and, once friends exist, add one from here). Only
// the host sees "Kick" buttons at all: kickPlayer itself already refuses
// non-host callers (gameStore.ts), but showing a clickable-looking button
// that quietly does nothing for everyone else would be confusing, so the
// button is hidden rather than just relying on the action's own guard.
function PlayersPanel() {
  const players = useGameStore((s) => s.players)
  const hostId = useGameStore((s) => s.hostId)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const kickPlayer = useGameStore((s) => s.kickPlayer)
  const isHost = localPlayerId !== null && localPlayerId === hostId

  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-success">Players</h3>
      {isHost && (
        <p className="mb-3 text-xs text-text-muted">
          Remove a duplicate or a player who's left for good. This can't be undone.
        </p>
      )}
      <ul className="space-y-2">
        {players.map((player) => (
          <li
            key={player.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
          >
            <span className="truncate text-sm text-text">
              {player.name}
              {player.id === hostId && <span className="ml-1 text-xs text-text-muted">(host)</span>}
            </span>
            {isHost && player.id !== hostId && (
              <button
                type="button"
                onClick={() => kickPlayer(player.id)}
                className="flex-shrink-0 rounded-md border border-danger/40 px-2 py-1 text-xs font-semibold text-danger transition hover:border-danger"
              >
                Kick
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

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
              active ? 'bg-primary text-text-on-primary' : 'text-text-secondary hover:text-text'
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
  const roomCode = useGameStore((s) => s.roomCode)
  const [isOpen, setIsOpen] = useState(false)
  const [panel, setPanel] = useState<'rules' | 'players' | 'account'>('rules')
  const [confirmingLeave, setConfirmingLeave] = useState(false)
  const pendingMenuPanel = useUiStore((s) => s.pendingMenuPanel)
  const clearPendingMenuPanel = useUiStore((s) => s.clearPendingMenuPanel)

  // Lets external buttons (the CreateJoin "Sign in" link, the account promo
  // card) open this menu straight to the Account panel, without lifting
  // isOpen/panel out of this component.
  useEffect(() => {
    if (!pendingMenuPanel) return
    setIsOpen(true)
    setPanel(pendingMenuPanel)
    clearPendingMenuPanel()
  }, [pendingMenuPanel, clearPendingMenuPanel])

  function close() {
    setIsOpen(false)
    setPanel('rules')
    setConfirmingLeave(false)
  }

  function handleConfirmedLeave() {
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

            <div className="flex flex-shrink-0 flex-col gap-3 pr-8 pt-1 sm:w-40 sm:pr-0">
              <button
                type="button"
                onClick={() => setPanel((p) => (p === 'account' ? 'rules' : 'account'))}
                aria-pressed={panel === 'account'}
                className={`w-full rounded-xl border px-4 py-3 text-left font-medium transition ${
                  panel === 'account'
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-border bg-surface text-text hover:border-border-strong'
                }`}
              >
                Account
              </button>
              <button
                type="button"
                onClick={() => setPanel('rules')}
                aria-pressed={panel === 'rules'}
                className={`w-full rounded-xl border px-4 py-3 text-left font-medium transition ${
                  panel === 'rules'
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-border bg-surface text-text hover:border-border-strong'
                }`}
              >
                How to Play
              </button>
              <ThemeModeControl />

              {roomCode !== null && <div className="h-px bg-divider" />}

              {roomCode !== null && (
                <button
                  type="button"
                  onClick={() => setPanel((p) => (p === 'players' ? 'rules' : 'players'))}
                  aria-pressed={panel === 'players'}
                  className={`w-full rounded-xl border px-4 py-3 text-left font-medium transition ${
                    panel === 'players'
                      ? 'border-primary bg-primary-soft text-primary'
                      : 'border-border bg-surface text-text hover:border-border-strong'
                  }`}
                >
                  Players
                </button>
              )}

              {roomCode !== null &&
                (confirmingLeave ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmedLeave}
                      className="flex-1 rounded-xl border border-danger bg-danger px-3 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                    >
                      Yes, leave
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingLeave(false)}
                      className="flex-1 rounded-xl border border-border px-3 py-3 text-sm text-text-secondary transition hover:border-border-strong"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingLeave(true)}
                    className="w-full rounded-xl border border-danger bg-danger/10 px-4 py-3 text-left font-medium text-danger transition hover:bg-danger/20"
                  >
                    Leave Game
                  </button>
                ))}

              <div className="mt-2 sm:mt-auto">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-success">
                  Contact
                </p>
                <a
                  href="mailto:hello@musicmindreader.com"
                  className="text-[11px] text-text-secondary underline decoration-dotted underline-offset-2 transition hover:text-text"
                >
                  hello@musicmindreader.com
                </a>
                <a
                  href="/about.html"
                  className="mt-1 block text-[11px] text-text-secondary underline decoration-dotted underline-offset-2 transition hover:text-text"
                >
                  Our Story
                </a>
                <a
                  href="/privacy.html"
                  className="mt-1 block text-[11px] text-text-secondary underline decoration-dotted underline-offset-2 transition hover:text-text"
                >
                  Privacy Policy
                </a>
                <a
                  href="/terms.html"
                  className="mt-1 block text-[11px] text-text-secondary underline decoration-dotted underline-offset-2 transition hover:text-text"
                >
                  Terms of Service
                </a>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-5 pt-1">
              {panel === 'players' ? (
                <PlayersPanel />
              ) : panel === 'account' ? (
                <AccountPanel />
              ) : (
                RULES_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-success">
                      {section.title}
                    </h3>
                    <p className="text-sm text-text-secondary">{section.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
