import { useEffect, useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { MenuOverlay } from './components/MenuOverlay'
import { CreateJoin } from './screens/01-CreateJoin'
import { JoinGame } from './screens/01b-JoinGame'
import { Lobby } from './screens/02-Lobby'
import { GameSetup } from './screens/02b-GameSetup'
import { SubmitSong } from './screens/03-SubmitSong'
import { GuessAndRate } from './screens/05-GuessAndRate'
import { Results } from './screens/06-Results'
import { useGameStore } from './state/gameStore'

const ROUTE_FOR_PHASE = {
  lobby: '/lobby',
  setup: '/setup',
  submit: '/submit',
  guess: '/guess',
  results: '/results',
} as const

// Every screen navigates purely by calling a store action (createGame,
// startSubmitting, shuffleSongOrder, finishRound, ...) and letting this
// watcher react to the synced `phase` changing - so every device in the
// room moves together, including whoever triggered the change, instead
// of only the one client that clicked a button.
//
// The one exception is leaving Results: once THIS player has called
// returnToLobby (tracked in lobbyReadyPlayerIds), this device heads to
// Lobby immediately even though `phase` is still 'results' for everyone
// still reviewing it - see finalizeRoundIfReady, which only actually
// flips the shared phase once every player has done the same.
function usePhaseNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const roomCode = useGameStore((s) => s.roomCode)
  const phase = useGameStore((s) => s.phase)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const lobbyReadyPlayerIds = useGameStore((s) => s.lobbyReadyPlayerIds)

  useEffect(() => {
    if (!roomCode) return
    const readyForLobby =
      phase === 'results' && localPlayerId !== null && lobbyReadyPlayerIds.includes(localPlayerId)
    const target = readyForLobby ? '/lobby' : ROUTE_FOR_PHASE[phase]
    if (location.pathname !== target) navigate(target)
  }, [roomCode, phase, localPlayerId, lobbyReadyPlayerIds, location.pathname, navigate])
}

// Always mounted (regardless of which screen is showing), since the player
// who completes the "everyone's ready" set is often not the one still on
// Results - they've likely already left for Lobby themselves.
function useFinalizeRoundWatcher() {
  const phase = useGameStore((s) => s.phase)
  const playerCount = useGameStore((s) => s.players.length)
  const readyCount = useGameStore((s) => s.lobbyReadyPlayerIds.length)
  const finalizeRoundIfReady = useGameStore((s) => s.finalizeRoundIfReady)

  useEffect(() => {
    if (phase === 'results' && playerCount > 0 && readyCount >= playerCount) {
      finalizeRoundIfReady()
    }
  }, [phase, playerCount, readyCount, finalizeRoundIfReady])
}

// A QR code scanned by the phone's own camera app (rather than the in-app
// scanner) lands here in a fresh session, with no name known yet - bounce
// through the front page first so name entry only ever happens in one
// place, carrying the scanned code along to prefill once they get there.
function JoinRedirect() {
  const { roomCode } = useParams<{ roomCode: string }>()
  return <Navigate to="/" state={{ roomCode }} replace />
}

function AppRoutes() {
  usePhaseNavigation()
  useFinalizeRoundWatcher()

  return (
    <Routes>
      <Route path="/" element={<CreateJoin />} />
      <Route path="/join" element={<JoinGame />} />
      <Route path="/join/:roomCode" element={<JoinRedirect />} />
      <Route path="/lobby" element={<Lobby />} />
      <Route path="/setup" element={<GameSetup />} />
      <Route path="/submit" element={<SubmitSong />} />
      <Route path="/guess" element={<GuessAndRate />} />
      <Route path="/results" element={<Results />} />
    </Routes>
  )
}

function App() {
  const resumeSession = useGameStore((s) => s.resumeSession)
  const [checkedSession, setCheckedSession] = useState(false)

  useEffect(() => {
    resumeSession().finally(() => setCheckedSession(true))
    // Only ever needs to run once, on first load - resumeSession reads
    // whatever's in localStorage at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-bg text-text">
      <HashRouter>
        <MenuOverlay />
        {checkedSession && <AppRoutes />}
      </HashRouter>
    </div>
  )
}

export default App