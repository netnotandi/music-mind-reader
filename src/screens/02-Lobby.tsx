import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { MIN_PLAYERS_TO_START, useGameStore } from '../state/gameStore'
import { useThemeStore } from '../state/themeStore'

// Just "is everyone here?" - QR / game code / player list, and (from the
// second round on) the running leaderboard. Round config lives on the
// separate Game Setup screen the host advances to from here.
export function Lobby() {
  const isLight = useThemeStore((s) => s.resolvedTheme === 'light')
  const roomCode = useGameStore((s) => s.roomCode)
  const players = useGameStore((s) => s.players)
  const hostId = useGameStore((s) => s.hostId)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const roundsCompleted = useGameStore((s) => s.roundsCompleted)
  const phase = useGameStore((s) => s.phase)
  const lobbyReadyPlayerIds = useGameStore((s) => s.lobbyReadyPlayerIds)
  const startRoundSetup = useGameStore((s) => s.startRoundSetup)

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!roomCode) return
    QRCode.toDataURL(`https://musicmindreader.com/#/join/${roomCode}`, { margin: 1, width: 200 }).then(
      setQrDataUrl
    )
  }, [roomCode])

  const isHost = localPlayerId !== null && localPlayerId === hostId
  const ranked = [...players].sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))
  // While a round has just ended, `phase` stays 'results' for anyone who
  // hasn't clicked "Go to Lobby" yet - reachable here at all only means
  // THIS device already has (see usePhaseNavigation). Reflect that same
  // per-player readiness for everyone else, rather than showing "connected"
  // for players who are still back on Results.
  const isPlayerReady = (playerId: string) => phase !== 'results' || lobbyReadyPlayerIds.includes(playerId)
  // This device already sees the Lobby route (per-player readiness override
  // in usePhaseNavigation), but the shared room is still mid-transition
  // until finalizeRoundIfReady actually runs.
  const roundStillWrappingUp = phase === 'results'

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 pb-8 pt-16">
      <h1
        className={`mb-8 text-center text-3xl font-extrabold uppercase tracking-wide ${
          isLight ? 'text-text' : 'bg-gradient-to-r from-blue via-violet to-pink bg-clip-text text-transparent'
        }`}
      >
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
        <span>Players ({players.length})</span>
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
          : players.map((player) => (
              <li
                key={player.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-surface-muted px-3 py-2 text-text"
              >
                <span className="min-w-0 truncate">{player.name}</span>
                {isPlayerReady(player.id) && (
                  <span className="flex-shrink-0 text-xs text-success">connected</span>
                )}
              </li>
            ))}
        {/* No fixed "seats" anymore - one perpetual hint row while the room
            is open, so it still reads as "more people can join". */}
        {!roundStillWrappingUp && (
          <li className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 text-sm text-violet/70">
            <span className="motion-safe:animate-pulse">〜</span>
            Waiting for more players…
          </li>
        )}
      </ul>

      {roundStillWrappingUp ? (
        <div className="rounded-xl border border-border bg-surface-muted px-4 py-4 text-center text-text-secondary">
          Waiting for everyone to head back to the Lobby...
        </div>
      ) : isHost ? (
        <button
          type="button"
          disabled={players.length < MIN_PLAYERS_TO_START}
          onClick={startRoundSetup}
          className="w-full rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-bg disabled:text-disabled-text"
        >
          Set up round
        </button>
      ) : (
        <div className="rounded-xl border border-border bg-surface-muted px-4 py-4 text-center text-text-secondary">
          Waiting for the host to start the game...
        </div>
      )}
    </div>
  )
}
