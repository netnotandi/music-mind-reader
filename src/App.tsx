import { useEffect, useRef, useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChatOverlay } from './components/ChatOverlay'
import { InAppBrowserBanner } from './components/InAppBrowserBanner'
import { MenuOverlay } from './components/MenuOverlay'
import { RoomCodeBadge } from './components/RoomCodeBadge'
import * as backgroundMusic from './logic/backgroundMusic'
import { CreateJoin } from './screens/01-CreateJoin'
import { JoinGame } from './screens/01b-JoinGame'
import { Lobby } from './screens/02-Lobby'
import { GameSetup } from './screens/02b-GameSetup'
import { SubmitSong } from './screens/03-SubmitSong'
import { GuessAndRate } from './screens/05-GuessAndRate'
import { Results } from './screens/06-Results'
import { useFriendsStore } from './state/friendsStore'
import { useGameStore } from './state/gameStore'
import { useUserStore } from './state/userStore'

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

// Notices when this device's own player row has disappeared from the room
// (kicked by the host via the menu's Players panel, most likely) and sends
// it back to Home instead of leaving it stuck showing a room it's no
// longer part of. `players.length > 0` guards against the brief window
// right after creating/joining a room, before the first real snapshot -
// carrying this device's own just-written row - has arrived.
function useKickedWatcher() {
  const navigate = useNavigate()
  const roomCode = useGameStore((s) => s.roomCode)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const players = useGameStore((s) => s.players)
  const handleRemovedFromRoom = useGameStore((s) => s.handleRemovedFromRoom)

  useEffect(() => {
    if (!roomCode || !localPlayerId || players.length === 0) return
    if (players.some((p) => p.id === localPlayerId)) return
    handleRemovedFromRoom()
    navigate('/')
  }, [roomCode, localPlayerId, players, handleRemovedFromRoom, navigate])
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

// Always mounted, drives backgroundMusic.ts purely off phase (plus the
// host/remote-play gate below) - see that module and CLAUDE.md's
// "Bakgrunnshljóð eftir fösum leiksins" for the full reasoning. lobby/setup/
// results play (lobby specifically reshuffles the track), submit/guess stay
// silent, and leaving the room entirely stops it. The Winner-reveal
// exception (paused during that one card, regardless of phase still being
// 'results') is handled separately, by WinnerRevealCard itself calling
// pauseForWinnerReveal/resumeAfterWinnerReveal.
function useBackgroundMusic() {
  const roomCode = useGameStore((s) => s.roomCode)
  const phase = useGameStore((s) => s.phase)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const hostId = useGameStore((s) => s.hostId)
  const remotePlayEnabled = useGameStore((s) => s.remotePlayEnabled)
  const previousRoomCode = useRef<string | null>(null)
  const previousEligible = useRef(false)

  // Everyone physically together only needs ONE phone's speaker running the
  // ambient loop - the host's - or every phone in the room would each play
  // its own out-of-sync track over each other. Once remote play is on,
  // everyone gets their own (a remote player's device is their only
  // speaker), with the existing mute button as their way to opt back out.
  const isHost = localPlayerId !== null && localPlayerId === hostId
  const eligible = isHost || remotePlayEnabled

  useEffect(() => {
    if (!roomCode || !eligible) {
      if (previousEligible.current) backgroundMusic.stopAndReset()
      previousRoomCode.current = roomCode
      previousEligible.current = eligible
      return
    }
    // A brand new room (or rejoining one), or just now becoming eligible
    // (remote play switched on for a non-host device) both start fresh,
    // same as any other entry into 'lobby' below.
    const freshStart = previousRoomCode.current !== roomCode || !previousEligible.current
    previousRoomCode.current = roomCode
    previousEligible.current = eligible

    if (phase === 'lobby') {
      void backgroundMusic.enterLobby()
    } else if (phase === 'setup' || phase === 'results') {
      if (freshStart) void backgroundMusic.enterLobby()
      else backgroundMusic.resumePlaying()
    } else {
      backgroundMusic.pausePlaying()
    }
    // freshStart is derived from refs, not state, on purpose - it shouldn't
    // itself retrigger this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, phase, eligible])
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
  useKickedWatcher()
  useBackgroundMusic()

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
  const initAuth = useUserStore((s) => s.initAuth)
  const initFriends = useFriendsStore((s) => s.initFriends)
  const [checkedSession, setCheckedSession] = useState(false)

  useEffect(() => {
    // Auth/friends are orthogonal to game routing/session - fire-and-forget,
    // never gates rendering the way checkedSession below does.
    initAuth()
    initFriends()
    resumeSession().finally(() => setCheckedSession(true))
    // Only ever needs to run once, on first load - resumeSession reads
    // whatever's in localStorage at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-bg text-text">
      <HashRouter>
        <InAppBrowserBanner />
        <MenuOverlay />
        <RoomCodeBadge />
        <ChatOverlay />
        {checkedSession && <AppRoutes />}
      </HashRouter>
    </div>
  )
}

export default App