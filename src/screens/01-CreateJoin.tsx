import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import { MAX_NAME_LENGTH } from '../state/gameStore'

const WAVE_REPLAY_INTERVAL_MS = 15000

export function CreateJoin() {
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState('')
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

  function handleCreateGame() {
    if (!name.trim()) return
    navigate('/setup', { state: { hostName: name.trim() } })
  }

  function handleJoinGame() {
    if (!name.trim()) return
    navigate('/join', { state: { name: name.trim(), roomCode: roomCodeFromQr } })
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col overflow-hidden px-6 pt-16">
      {/* position:absolute (not fixed) so this is a normal descendant of
          the `relative` box right below it, making "behind the content"
          a plain, well-defined local containment relationship rather than
          a position:fixed-vs-ancestor-stacking-context comparison - that
          version worked in Chromium and Firefox but WebKit/Safari doesn't
          consistently scope a fixed descendant's stacking to a local
          `relative z-*` ancestor the way it's supposed to, so the rings
          rendered in front of the buttons there specifically (confirmed by
          testing all three engines head to head). Trade-off: the rings no
          longer reach past this column's width on a wide desktop browser
          window like they briefly did - acceptable, since real users only
          ever see this on a phone, where the column already is the
          screen. */}
      <div className="relative z-10 flex flex-col">
        <div className="sound-wave-field absolute inset-x-0 top-0 -z-10 h-52" key={waveKey}>
          <div className="sound-wave-ring sound-wave-ring--a" />
          <div className="sound-wave-ring sound-wave-ring--b" />
          <div className="sound-wave-ring sound-wave-ring--c" />
        </div>

        <div className="relative flex h-52 items-center justify-center">
          <div className="absolute h-56 w-56 rounded-full bg-violet-600/30 blur-3xl" />
          <img src={logo} alt="Music Mind Reader" className="relative w-64" />
        </div>
        <h1 className="-mt-2 text-center text-2xl font-extrabold uppercase tracking-wide bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 bg-clip-text text-transparent">
          Music Mind Reader
        </h1>

        <div className="mx-auto mt-8 flex w-72 flex-col gap-4">
          {roomCodeFromQr && (
            <p className="text-center text-sm text-slate-400">
              Scanned game code: <span className="font-semibold text-emerald-300">{roomCodeFromQr}</span>
            </p>
          )}
          <div className="rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 p-[1.5px]">
            <input
              className="w-full rounded-full bg-[#0a0a2e] px-5 py-3 text-center text-sm text-slate-100 placeholder:text-slate-500"
              placeholder="Enter your name"
              maxLength={MAX_NAME_LENGTH}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={handleCreateGame}
            className="rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            CREATE GAME
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-700" />
            <span className="text-xs font-medium text-slate-500">OR</span>
            <div className="h-px flex-1 bg-slate-700" />
          </div>

          <div className="rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 p-[1.5px] has-[:disabled]:opacity-40">
            <button
              type="button"
              disabled={!name.trim()}
              onClick={handleJoinGame}
              className="w-full rounded-full bg-[#010127] px-5 py-3 disabled:cursor-not-allowed"
            >
              <span className="bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 bg-clip-text text-sm font-bold text-transparent">
                JOIN GAME
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}