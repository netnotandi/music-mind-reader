import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../state/gameStore'

// Persistent reminder of the game code on every screen once you're in a
// room - not just the Lobby's big QR card. Someone who accidentally hits
// Home (or just wants to invite a latecomer) shouldn't have to hunt for it;
// it lives opposite the hamburger menu, in the same always-clear top strip
// every screen already reserves space for (`pt-16`), so it never collides
// with page content or a bottom action button.
export function RoomCodeBadge() {
  const roomCode = useGameStore((s) => s.roomCode)
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  if (!roomCode) return null

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(roomCode ?? '')
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 1200)
    } catch {
      // Clipboard API unavailable - the code is still right there to read.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy game code"
      className="fixed right-4 top-4 z-40 flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface/80 px-3 text-xs font-semibold text-text-muted backdrop-blur transition hover:border-border-strong"
    >
      {copied ? (
        <span className="text-success">Copied!</span>
      ) : (
        <>
          CODE <span className="tracking-[0.15em] text-success">{roomCode}</span>
        </>
      )}
    </button>
  )
}
