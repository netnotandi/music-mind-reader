import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const totalRounds = useGameStore((s) => s.totalRounds)
  const phase = useGameStore((s) => s.phase)
  const lobbyReadyPlayerIds = useGameStore((s) => s.lobbyReadyPlayerIds)
  const startRoundSetup = useGameStore((s) => s.startRoundSetup)
  const leaveGame = useGameStore((s) => s.leaveGame)
  const navigate = useNavigate()

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
  // The pre-committed round count (chosen once at the first Game Setup) has
  // been fully played - this is the post-game Lobby visit, reached via the
  // Final Scoretable flow on the last round's Results screen. "Leave Game"
  // only lives here once that's true; earlier Lobby visits (mid-game) don't
  // show it at all, matching the host's spec.
  const gameFinished = roundsCompleted >= totalRounds

  function handleLeave() {
    leaveGame(false)
    navigate('/')
  }

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
                // Fixed-width columns (not flex+gap) for "connected" and the
                // score, so both always line up in exactly the same spot
                // across every row - independent of how long each player's
                // name is and how many digits their score has (a 1-digit
                // score no longer lets "connected" drift rightward compared
                // to a row with a 2-digit score).
                className="grid grid-cols-[1fr_auto_auto] items-center gap-6 rounded-lg bg-surface-muted px-3 py-2 text-text"
              >
                <span className="flex min-w-0 items-center">
                  <span className="mr-2 flex-shrink-0 text-text-muted">#{i + 1}</span>
                  <span className="truncate">{player.name}</span>
                </span>
                {/* Always rendered at the same width, connected or not - so
                    it never shifts the score column even if this badge is
                    momentarily absent (e.g. a player not yet marked ready
                    by everyone else's client). */}
                <span
                  className={`flex w-28 items-center justify-end gap-1 rounded-md bg-surface px-2 py-1 text-[11px] text-text-muted ${
                    isPlayerReady(player.id) ? '' : 'invisible'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  connected
                </span>
                <span className="w-20 rounded-md bg-success/15 px-2.5 py-1 text-right text-lg font-bold text-success">
                  {(player.totalScore ?? 0).toFixed(1)}
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

      {gameFinished && (
        <button
          type="button"
          onClick={handleLeave}
          className={
            isLight
              ? 'mt-3 w-full rounded-xl border-[1.5px] border-primary bg-surface px-5 py-3 font-semibold text-primary transition'
              : 'mt-3 w-full rounded-xl border border-border-strong px-5 py-3 font-semibold text-text transition hover:border-border-strong'
          }
        >
          Leave Game
        </button>
      )}
    </div>
  )
}
