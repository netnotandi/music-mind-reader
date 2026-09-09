import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { CategoryPicker } from '../components/CategoryPicker'
import { toggleCategorySelection, useGameStore } from '../state/gameStore'
import { useThemeStore } from '../state/themeStore'

export function Lobby() {
  // Light-only: the chosen category is its own "assigned identity" (primary/
  // violet), not a success/confirmation signal - dark keeps its original
  // green pill unchanged, matching the same distinction made in SubmitSong.
  const isLight = useThemeStore((s) => s.resolvedTheme === 'light')
  const roomCode = useGameStore((s) => s.roomCode)
  const maxPlayers = useGameStore((s) => s.maxPlayers)
  const players = useGameStore((s) => s.players)
  const hostId = useGameStore((s) => s.hostId)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const categories = useGameStore((s) => s.categories)
  const selectedCategoryIds = useGameStore((s) => s.selectedCategoryIds)
  const roundsCompleted = useGameStore((s) => s.roundsCompleted)
  const phase = useGameStore((s) => s.phase)
  const lobbyReadyPlayerIds = useGameStore((s) => s.lobbyReadyPlayerIds)
  const chooseCategories = useGameStore((s) => s.chooseCategories)
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
  const ranked = [...players].sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))
  // While a round has just ended, `phase` stays 'results' for anyone who
  // hasn't clicked "Go to Lobby" yet - reachable here at all only means
  // THIS device already has (see usePhaseNavigation). Reflect that same
  // per-player readiness for everyone else, rather than showing "connected"
  // for players who are still back on Results. Once the round is fully
  // wrapped up (phase moves on), lobbyReadyPlayerIds resets and this just
  // means "present in the room" again, like before.
  const isPlayerReady = (playerId: string) => phase !== 'results' || lobbyReadyPlayerIds.includes(playerId)
  // This device already sees the Lobby route (per-player readiness override
  // in usePhaseNavigation), but the shared room is still mid-transition
  // until finalizeRoundIfReady actually runs - starting a new round before
  // then would carry over stale round data and skip scoring this one.
  const roundStillWrappingUp = phase === 'results'

  function toggleCategory(categoryId: string) {
    chooseCategories(toggleCategorySelection(selectedCategoryIds, categoryId))
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 py-8">
      <h1 className="mb-8 text-center text-3xl font-extrabold uppercase tracking-wide bg-gradient-to-r from-brand-blue via-brand-violet to-brand-pink bg-clip-text text-transparent">
        Music Mind Reader
      </h1>

      <div className="mb-4 flex justify-center gap-4">
        <div className="grid h-28 w-28 flex-shrink-0 place-items-center overflow-hidden rounded-xl border border-border-strong bg-surface">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR code to join" className="h-full w-full" />
          ) : (
            <span className="text-xs text-text-muted">QR Code</span>
          )}
        </div>
        <div className="flex flex-col justify-center rounded-xl border border-border bg-surface-muted px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Game Code</p>
          <p className="text-2xl font-bold tracking-[0.2em] text-success">{roomCode}</p>
        </div>
      </div>

      <h2 className="mb-2 flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-text-secondary">
        <span>
          Players ({players.length}/{seatCount})
        </span>
        {roundsCompleted > 0 && <span>Score</span>}
      </h2>
      <ul className="mb-8 space-y-1">
        {roundsCompleted > 0
          ? ranked.map((player, i) => (
              <li
                key={player.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-surface-muted px-3 py-2 text-text"
              >
                <span className="flex min-w-0 items-center">
                  <span className="mr-2 flex-shrink-0 text-text-muted">#{i + 1}</span>
                  <span className="truncate">{player.name}</span>
                </span>
                <span className="flex flex-shrink-0 items-center gap-1">
                  {isPlayerReady(player.id) && <span className="text-xs text-success">connected</span>}
                  <span className="font-semibold text-success">{(player.totalScore ?? 0).toFixed(1)}</span>
                </span>
              </li>
            ))
          : Array.from({ length: seatCount }, (_, i) => players[i]).map((player, i) => (
              <li
                key={player?.id ?? `empty-${i}`}
                className="flex items-center justify-between gap-2 rounded-lg bg-surface-muted px-3 py-2 text-text"
              >
                {player ? (
                  <>
                    <span className="min-w-0 truncate">{player.name}</span>
                    {isPlayerReady(player.id) && (
                      <span className="flex-shrink-0 text-xs text-success">connected</span>
                    )}
                  </>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-brand-violet/70">
                    <span className="motion-safe:animate-pulse">〜</span>
                    Waiting for player…
                  </span>
                )}
              </li>
            ))}
        {roundsCompleted > 0 &&
          Array.from({ length: Math.max(seatCount - players.length, 0) }, (_, i) => (
            <li
              key={`empty-${i}`}
              className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2 text-text"
            >
              <span className="flex items-center gap-2 text-sm text-brand-violet/70">
                <span className="motion-safe:animate-pulse">〜</span>
                Waiting for player…
              </span>
            </li>
          ))}
      </ul>

      {selectedCategories.length > 0 ? (
        <div className="mb-6 flex flex-wrap justify-center gap-1.5">
          {selectedCategories.map((c) => (
            <span
              key={c.id}
              className={`rounded-full px-2.5 py-1 text-xs ${
                isLight ? 'bg-primary/15 text-primary' : 'bg-success/20 text-success'
              }`}
            >
              {c.name}
            </span>
          ))}
        </div>
      ) : (
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-text">
            {isHost ? 'Choose categories for this round' : 'Waiting for the host to choose categories...'}
          </h2>
          {isHost && (
            <CategoryPicker
              categories={categories}
              selectedCategoryIds={selectedCategoryIds}
              onToggle={toggleCategory}
            />
          )}
        </div>
      )}

      {roundStillWrappingUp ? (
        <div className="rounded-xl border border-border bg-surface-muted px-4 py-4 text-center text-text-secondary">
          Waiting for everyone to head back to the Lobby...
        </div>
      ) : isHost ? (
        <button
          type="button"
          disabled={selectedCategoryIds.length === 0}
          onClick={startSubmitting}
          className="w-full rounded-xl bg-primary px-5 py-3 font-semibold text-text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-disabled-bg disabled:text-disabled-text"
        >
          Start Submitting Songs
        </button>
      ) : (
        <div className="rounded-xl border border-border bg-surface-muted px-4 py-4 text-center text-text-secondary">
          Waiting for the host to start the game...
        </div>
      )}
    </div>
  )
}