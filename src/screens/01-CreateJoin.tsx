import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import { MAX_NAME_LENGTH, useGameStore } from '../state/gameStore'
import { useThemeStore } from '../state/themeStore'

const WAVE_REPLAY_INTERVAL_MS = 15000

export function CreateJoin() {
  const navigate = useNavigate()
  const location = useLocation()
  // Light keeps the brand gradient only for the logo/wordmark treatment
  // dark already had - ordinary interactive elements (inputs, buttons) get
  // the same solid violet/white-card look every other screen uses, per the
  // "gradient is rare brand emphasis only" rule. Dark is untouched below.
  const isLight = useThemeStore((s) => s.resolvedTheme === 'light')
  const createGame = useGameStore((s) => s.createGame)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  // The CSS animation runs once (forwards, not infinite) - remounting the
  // field via a changing key restarts it fresh, giving a periodic burst
  // instead of a continuous loop.
  const [waveKey, setWaveKey] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setWaveKey((k) => k + 1), WAVE_REPLAY_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  // Set when a QR code was scanned by the phone's own camera app, landing
  // here (via JoinRedirect) instead of straight on Join Game - carried
  // forward once a name is entered, so it's never asked for twice.
  const roomCodeFromQr = (location.state as { roomCode?: string } | null)?.roomCode ?? null

  async function handleCreateGame() {
    if (!name.trim() || creating) return
    setCreating(true)
    // No explicit navigate - createGame resolving attaches the room
    // listener, which syncs phase 'lobby' and lets the app-wide phase
    // watcher route this device (and every other) to the Lobby.
    await createGame(name.trim())
  }

  function handleJoinGame() {
    if (!name.trim()) return
    navigate('/join', { state: { name: name.trim(), roomCode: roomCodeFromQr } })
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col overflow-hidden px-6 pt-16">
      {/* Fixed (not absolute) so the rings reach the real browser viewport
          edges, not just this page's own max-w-md column - matters on a
          wide desktop window. `isolate` (isolation: isolate) on the content
          wrapper below is what makes this reliable: plain `relative z-10`
          alone left WebKit/Safari inconsistent about whether a position:
          fixed sibling elsewhere in the document painted above or below a
          local z-indexed stacking context, confirmed by testing Chromium/
          Firefox/WebKit head to head - isolate exists specifically to
          remove that kind of cross-engine ambiguity. */}
      <div className="sound-wave-field fixed inset-x-0 top-16 h-52" key={waveKey}>
        <div className="sound-wave-ring sound-wave-ring--a" />
        <div className="sound-wave-ring sound-wave-ring--b" />
        <div className="sound-wave-ring sound-wave-ring--c" />
      </div>

      <div className="relative isolate z-10 flex flex-col">
        <div className="relative flex h-52 items-center justify-center">
          {!isLight && <div className="absolute h-56 w-56 rounded-full bg-violet/30 blur-3xl" />}
          <img src={logo} alt="Music Mind Reader" className="relative w-64" />
        </div>
        <h1
          className={`-mt-2 text-center text-2xl font-extrabold uppercase tracking-wide ${
            isLight
              ? 'text-text'
              : 'bg-gradient-to-r from-cyan via-violet to-pink bg-clip-text text-transparent'
          }`}
        >
          Music Mind Reader
        </h1>

        <div className="mx-auto mt-8 flex w-72 flex-col gap-4">
          {roomCodeFromQr && (
            <p className="text-center text-sm text-text-secondary">
              Scanned game code: <span className="font-semibold text-success">{roomCodeFromQr}</span>
            </p>
          )}
          {isLight ? (
            <input
              className="w-full rounded-full border border-border-strong bg-surface px-5 py-3 text-center text-sm text-text placeholder:text-placeholder"
              placeholder="Enter your name"
              maxLength={MAX_NAME_LENGTH}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          ) : (
            <div className="rounded-full bg-gradient-to-r from-cyan via-violet to-pink p-[1.5px]">
              <input
                className="w-full rounded-full bg-surface px-5 py-3 text-center text-sm text-text placeholder:text-text-muted"
                placeholder="Enter your name"
                maxLength={MAX_NAME_LENGTH}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <button
            type="button"
            disabled={!name.trim() || creating}
            onClick={handleCreateGame}
            className={
              isLight
                ? 'rounded-full border border-primary bg-primary px-5 py-3 text-sm font-bold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-bg disabled:text-disabled-text'
                : 'rounded-full bg-gradient-to-r from-cyan via-violet to-pink px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40'
            }
          >
            {creating ? 'CREATING…' : 'CREATE GAME'}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-divider" />
            <span className="text-xs font-medium text-text-muted">OR</span>
            <div className="h-px flex-1 bg-divider" />
          </div>

          {isLight ? (
            <button
              type="button"
              disabled={!name.trim()}
              onClick={handleJoinGame}
              className="w-full rounded-full border-[1.5px] border-primary bg-surface px-5 py-3 text-sm font-bold text-primary transition disabled:cursor-not-allowed disabled:border-disabled-border disabled:text-disabled-text"
            >
              JOIN GAME
            </button>
          ) : (
            <div className="rounded-full bg-gradient-to-r from-cyan via-violet to-pink p-[1.5px] has-[:disabled]:opacity-40">
              <button
                type="button"
                disabled={!name.trim()}
                onClick={handleJoinGame}
                className="w-full rounded-full bg-bg px-5 py-3 disabled:cursor-not-allowed"
              >
                <span className="bg-gradient-to-r from-cyan via-violet to-pink bg-clip-text text-sm font-bold text-transparent">
                  JOIN GAME
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}