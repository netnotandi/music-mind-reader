import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { useGameStore } from '../state/gameStore'

export function Lobby() {
  const roomCode = useGameStore((s) => s.roomCode)
  const maxPlayers = useGameStore((s) => s.maxPlayers)
  const players = useGameStore((s) => s.players)
  const hostId = useGameStore((s) => s.hostId)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const categories = useGameStore((s) => s.categories)
  const selectedCategoryIds = useGameStore((s) => s.selectedCategoryIds)
  const startSubmitting = useGameStore((s) => s.startSubmitting)

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!roomCode) return
    QRCode.toDataURL(`https://musicmindreader.com/#/join/${roomCode}`, { margin: 1, width: 200 }).then(
      setQrDataUrl
    )
  }, [roomCode])

  const isHost = localPlayerId !== null && localPlayerId === hostId
  const selectedCategories = categories.filter((c) => selectedCategoryIds.includes(c.id))
  const seatCount = maxPlayers ?? players.length

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 py-8">
      <h1 className="mb-8 text-center text-3xl font-extrabold uppercase tracking-wide bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
        Music Mind Reader
      </h1>

      <div className="mb-4 flex justify-center gap-4">
        <div className="grid h-28 w-28 flex-shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-600 bg-slate-800">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR code to join" className="h-full w-full" />
          ) : (
            <span className="text-xs text-slate-500">QR Code</span>
          )}
        </div>
        <div className="flex flex-col justify-center rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Game Code</p>
          <p className="text-2xl font-bold tracking-[0.2em] text-emerald-300">{roomCode}</p>
        </div>
      </div>

      {selectedCategories.length > 0 && (
        <div className="mb-6 flex flex-wrap justify-center gap-1.5">
          {selectedCategories.map((c) => (
            <span
              key={c.id}
              className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs text-emerald-300"
            >
              {c.name}
            </span>
          ))}
        </div>
      )}

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Players ({players.length}/{seatCount})
      </h2>
      <ul className="mb-8 space-y-1">
        {Array.from({ length: seatCount }, (_, i) => players[i]).map((player, i) => (
          <li
            key={player?.id ?? `empty-${i}`}
            className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2 text-slate-200"
          >
            {player ? (
              <>
                {player.name}
                <span className="text-xs text-emerald-400">connected</span>
              </>
            ) : (
              <span className="flex items-center gap-2 text-sm text-violet-400/70">
                <span className="animate-pulse">〜</span>
                Waiting for player…
              </span>
            )}
          </li>
        ))}
      </ul>

      {isHost ? (
        <button
          type="button"
          onClick={startSubmitting}
          className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400"
        >
          Start Submitting Songs
        </button>
      ) : (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-4 text-center text-slate-300">
          Waiting for the host to start the game...
        </div>
      )}
    </div>
  )
}