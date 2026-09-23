import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import { AccountPromoCard } from '../components/AccountPromoCard'
import { primeBackgroundMusic } from '../logic/backgroundMusic'
import { MAX_NAME_LENGTH, useGameStore } from '../state/gameStore'
import { useThemeStore } from '../state/themeStore'
import { useUiStore } from '../state/uiStore'
import { useUserStore } from '../state/userStore'

const WAVE_REPLAY_INTERVAL_MS = 15000

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  )
}

export function CreateJoin() {
  const navigate = useNavigate()
  const location = useLocation()
  // Light keeps the brand gradient only for the logo/wordmark treatment
  // dark already had - ordinary interactive elements (inputs, buttons) get
  // the same solid violet/white-card look every other screen uses, per the
  // "gradient is rare brand emphasis only" rule. Dark is untouched below.
  const isLight = useThemeStore((s) => s.resolvedTheme === 'light')
  const createGame = useGameStore((s) => s.createGame)
  const profileName = useUserStore((s) => s.profile?.name ?? null)
  const authStatus = useUserStore((s) => s.status)
  const requestMenuPanel = useUiStore((s) => s.requestMenuPanel)
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

  // Convenience default only, never a requirement: fills the name box once
  // a signed-in profile becomes known (auth resolves after first paint, so
  // this can't be a useState initializer), but only if the player hasn't
  // typed anything themselves - stays fully editable after (someone signed
  // in as "Jón Þór" can still join a room as "Dad" if that's what the group
  // calls him).
  const prefilledRef = useRef(false)
  useEffect(() => {
    if (prefilledRef.current || !profileName) return
    prefilledRef.current = true
    setName((current) => (current.trim() ? current : profileName.slice(0, MAX_NAME_LENGTH)))
  }, [profileName])

  // Set when a QR code was scanned by the phone's own camera app, landing
  // here (via JoinRedirect) instead of straight on Join Game - carried
  // forward once a name is entered, so it's never asked for twice.
  const roomCodeFromQr = (location.state as { roomCode?: string } | null)?.roomCode ?? null

  async function handleCreateGame() {
    if (!name.trim() || creating) return
    setCreating(true)
    // Synchronous, inside this real click - primes the shared background-
    // music <audio> element so it counts as user-gesture-authorized once
    // the Lobby phase actually starts it playing a moment later.
    primeBackgroundMusic()
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
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col overflow-hidden px-6 pb-12 pt-16">
      {/* Fixed (not absolute) so the rings reach the real browser viewport
          edges, not just this page's own column - matters on a wide desktop
          window. `isolate` (isolation: isolate) on the content wrapper below
          is what makes this reliable: plain `relative z-10` alone left
          WebKit/Safari inconsistent about whether a position: fixed sibling
          elsewhere in the document painted above or below a local
          z-indexed stacking context, confirmed by testing Chromium/Firefox/
          WebKit head to head - isolate exists specifically to remove that
          kind of cross-engine ambiguity. */}
      <div className="sound-wave-field fixed inset-x-0 top-16 h-52" key={waveKey}>
        <div className="sound-wave-ring sound-wave-ring--a" />
        <div className="sound-wave-ring sound-wave-ring--b" />
        <div className="sound-wave-ring sound-wave-ring--c" />
      </div>

      {/* Opposite the hamburger - RoomCodeBadge claims this same corner once
          a room exists, but this is the one screen where there never is
          one yet, so there's no collision. Only shown signed-out: once
          signed in, the profile lives in the menu's Account panel instead. */}
      {authStatus === 'signed-out' && (
        <button
          type="button"
          onClick={() => requestMenuPanel('account')}
          className={`fixed right-4 top-4 z-40 text-sm font-semibold transition ${
            isLight ? 'text-primary hover:text-primary-hover' : 'text-cyan hover:brightness-125'
          }`}
        >
          Sign in
        </button>
      )}

      <div className="relative isolate z-10 flex flex-col items-center gap-10 md:flex-row md:items-end md:justify-center">
        <div className="flex w-full max-w-md flex-col">
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
              <div className="relative">
                <PersonIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="search"
                  className="w-full rounded-full border border-border-strong bg-surface py-3 pl-10 pr-5 text-left text-sm text-text placeholder:text-placeholder"
                  placeholder="Enter your name"
                  maxLength={MAX_NAME_LENGTH}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                />
              </div>
            ) : (
              <div className="relative rounded-full bg-gradient-to-r from-cyan via-violet to-pink p-[1.5px]">
                <PersonIcon className="pointer-events-none absolute left-[18px] top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="search"
                  className="w-full rounded-full bg-surface py-3 pl-10 pr-5 text-left text-sm text-text placeholder:text-text-muted"
                  placeholder="Enter your name"
                  maxLength={MAX_NAME_LENGTH}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
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

            {authStatus === 'signed-out' && <div className="mt-2 h-px bg-divider md:hidden" />}
          </div>
        </div>

        {authStatus === 'signed-out' && (
          <div className="flex w-full max-w-md justify-center md:max-w-sm md:justify-start">
            <AccountPromoCard />
          </div>
        )}
      </div>

      <div className="mt-auto flex justify-center gap-4 pt-10">
        <a
          href="/privacy.html"
          className="text-[11px] text-text-secondary underline decoration-dotted underline-offset-2 transition hover:text-text"
        >
          Privacy Policy
        </a>
        <a
          href="/terms.html"
          className="text-[11px] text-text-secondary underline decoration-dotted underline-offset-2 transition hover:text-text"
        >
          Terms of Service
        </a>
      </div>
    </div>
  )
}