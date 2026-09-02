import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../state/gameStore'
import { GAME_CODE } from '../state/mockData'

export function JoinGame() {
  const navigate = useNavigate()
  const setIsHost = useGameStore((s) => s.setIsHost)

  const [digits, setDigits] = useState<string[]>(Array(GAME_CODE.length).fill(''))
  const [error, setError] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  function setDigit(index: number, value: string) {
    const char = value.slice(-1).toUpperCase()
    setDigits((prev) => {
      const next = [...prev]
      next[index] = char
      return next
    })
    setError(false)
    if (char && index < GAME_CODE.length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handleSubmit() {
    if (digits.join('') === GAME_CODE) {
      setIsHost(false)
      navigate('/lobby')
    } else {
      setError(true)
      setDigits(Array(GAME_CODE.length).fill(''))
      inputRefs.current[0]?.focus()
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-20">
      <div className="mb-6 flex justify-center gap-3.5">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el
            }}
            className="h-20 w-20 rounded-xl border border-slate-600 bg-slate-800 text-center text-2xl font-bold text-slate-100 focus:border-emerald-400 focus:outline-none"
            maxLength={1}
            value={digit}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
          />
        ))}
      </div>

      {error && <p className="mb-4 text-center text-sm text-rose-400">Wrong code — try again.</p>}

      <button
        type="button"
        className="mb-3 rounded-xl border border-slate-600 bg-slate-800/50 px-5 py-3 text-sm font-semibold text-slate-400 transition hover:border-slate-500"
      >
        Scan QR Code
      </button>

      <button
        type="button"
        onClick={handleSubmit}
        className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
      >
        Join Game
      </button>
    </div>
  )
}
