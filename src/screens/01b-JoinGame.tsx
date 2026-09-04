import jsQR from 'jsqr'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { extractRoomCode } from '../logic/qrCode'
import { ROOM_CODE_LENGTH, useGameStore } from '../state/gameStore'

interface QrScannerProps {
  onDetect: (roomCode: string) => void
  onClose: () => void
}

// Owns the camera stream for as long as it's mounted - acquired on mount,
// always released on unmount (closing the scanner, a successful scan, or
// navigating away), so the camera never stays on in the background.
function QrScanner({ onDetect, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    let rafId = 0
    let cancelled = false
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    function scanFrame() {
      const video = videoRef.current
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafId = requestAnimationFrame(scanFrame)
        return
      }
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
      const result = imageData && jsQR(imageData.data, imageData.width, imageData.height)
      if (result?.data) {
        onDetect(extractRoomCode(result.data))
        return
      }
      rafId = requestAnimationFrame(scanFrame)
    }

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        scanFrame()
      } catch {
        setError('Could not access the camera — check your browser permissions.')
      }
    }

    start()

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      stream?.getTracks().forEach((t) => t.stop())
    }
    // onDetect is a fresh closure each render, but it's only ever called
    // from inside this same effect's frame loop, not depended on for
    // restart logic - re-running the whole camera setup on every parent
    // render would just be disruptive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted />

      <div className="relative h-64 w-64">
        <span className="absolute left-0 top-0 h-10 w-10 border-l-4 border-t-4 border-blue-400" />
        <span className="absolute right-0 top-0 h-10 w-10 border-r-4 border-t-4 border-blue-400" />
        <span className="absolute bottom-0 left-0 h-10 w-10 border-b-4 border-l-4 border-blue-400" />
        <span className="absolute bottom-0 right-0 h-10 w-10 border-b-4 border-r-4 border-blue-400" />
      </div>

      {error && <p className="relative mt-6 max-w-xs text-center text-sm text-rose-400">{error}</p>}

      <button
        type="button"
        onClick={onClose}
        className="relative mt-8 rounded-xl border border-slate-500 bg-black/40 px-5 py-2 text-sm text-slate-100"
      >
        Cancel
      </button>
    </div>
  )
}

export function JoinGame() {
  const joinGame = useGameStore((s) => s.joinGame)
  const location = useLocation()

  // Name is only ever collected on Create/Join and carried here via router
  // state - if it's missing (e.g. someone bookmarked/refreshed this exact
  // URL), there's nowhere valid to pick up from except starting over there.
  const state = location.state as { name?: string; roomCode?: string } | null
  const name = state?.name ?? ''

  const [digits, setDigits] = useState<string[]>(() => {
    const prefill = (state?.roomCode ?? '').toUpperCase().split('')
    return Array.from({ length: ROOM_CODE_LENGTH }, (_, i) => prefill[i] ?? '')
  })
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [scanning, setScanning] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  if (!name) {
    return <Navigate to="/" replace />
  }

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

  function handleScanned(roomCode: string) {
    setScanning(false)
    setDigits(Array.from({ length: ROOM_CODE_LENGTH }, (_, i) => roomCode[i] ?? ''))
    setError(null)
  }

  async function handleSubmit() {
    const code = digits.join('')
    if (code.length < ROOM_CODE_LENGTH || joining) return
    setJoining(true)
    setError(null)
    // No explicit navigate on success - the app-wide phase watcher picks up
    // the newly-synced room state and moves this device to the Lobby.
    const result = await joinGame(code, name)
    setJoining(false)
    if (result === 'not-found') {
      setError('Game not found — check the code and try again.')
    } else if (result === 'full') {
      setError('That game is already full.')
    }
  }

  if (scanning) {
    return <QrScanner onDetect={handleScanned} onClose={() => setScanning(false)} />
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-20">
      <p className="mb-6 text-center text-sm text-slate-400">
        Joining as <span className="font-semibold text-slate-100">{name}</span>
      </p>

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
        onClick={() => setScanning(true)}
        className="mb-3 rounded-xl border border-slate-600 bg-slate-800/50 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500"
      >
        Scan QR Code
      </button>

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