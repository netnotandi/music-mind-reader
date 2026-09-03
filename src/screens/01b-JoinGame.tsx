import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ROOM_CODE_LENGTH, useGameStore } from '../state/gameStore'

export function JoinGame() {
  const joinGame = useGameStore((s) => s.joinGame)
  const { roomCode: roomCodeFromUrl } = useParams<{ roomCode?: string }>()

  const [name, setName] = useState('')
  const [digits, setDigits] = useState<string[]>(() => {
    const prefill = (roomCodeFromUrl ?? '').toUpperCase().split('')
    return Array.from({ length: ROOM_CODE_LENGTH }, (_, i) => prefill[i] ?? '')
  })
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  function setDigit(index: number, value: string) {
    const char = value.slice(-1).toUpperCase()
    setDigits((prev) => {
      const next = [...prev]
      next[index] = char
      return next
    })
    setError(null)
    if (char && index < ROOM_CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  async function handleSubmit() {
    const code = digits.join('')
    if (!name.trim() || code.length < ROOM_CODE_LENGTH || joining) return
    setJoining(true)
    setError(null)
    // No explicit navigate on success - the app-wide phase watcher picks up
    // the newly-synced room state and moves this device to the Lobby.
    const result = await joinGame(code, name.trim())
    setJoining(false)
    if (result === 'not-found') {
      setError('Game not found — check the code and try again.')
    } else if (result === 'full') {
      setError('That game is already full.')
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-20">
      <input
        className="mb-6 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-center text-sm text-slate-100 placeholder:text-slate-500"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="mb-6 flex justify-center gap-3">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el
            }}
            className="h-16 w-14 rounded-xl border border-slate-600 bg-slate-800 text-center text-2xl font-bold uppercase text-slate-100 focus:border-emerald-400 focus:outline-none"
            maxLength={1}
            value={digit}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
          />
        ))}
      </div>

      {error && <p className="mb-4 text-center text-sm text-rose-400">{error}</p>}

      <button
        type="button"
        disabled={joining}
        onClick={handleSubmit}
        className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
      >
        {joining ? 'Joining…' : 'Join Game'}
      </button>
    </div>
  )
}