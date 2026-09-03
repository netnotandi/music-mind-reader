import { useEffect, useState } from 'react'
import { HashRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { MenuOverlay } from './components/MenuOverlay'
import { CreateJoin } from './screens/01-CreateJoin'
import { JoinGame } from './screens/01b-JoinGame'
import { GameSetup } from './screens/01c-GameSetup'
import { Lobby } from './screens/02-Lobby'
import { SubmitSong } from './screens/03-SubmitSong'
import { GuessAndRate } from './screens/05-GuessAndRate'
import { Results } from './screens/06-Results'
import { useGameStore } from './state/gameStore'

const ROUTE_FOR_PHASE = {
  lobby: '/lobby',
  submit: '/submit',
  guess: '/guess',
  results: '/results',
} as const

// Every screen navigates purely by calling a store action (createGame,
// startSubmitting, shuffleSongOrder, nextSong, startNewRound, ...) and
// letting this watcher react to the synced `phase` changing - so every
// device in the room moves together, including whoever triggered the
// change, instead of only the one client that clicked a button.
function usePhaseNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const roomCode = useGameStore((s) => s.roomCode)
  const phase = useGameStore((s) => s.phase)

  useEffect(() => {
    if (!roomCode) return
    const target = ROUTE_FOR_PHASE[phase]
    if (location.pathname !== target) navigate(target)
  }, [roomCode, phase, location.pathname, navigate])
}

function AppRoutes() {
  usePhaseNavigation()

  return (
    <Routes>
      <Route path="/" element={<CreateJoin />} />
      <Route path="/join" element={<JoinGame />} />
      <Route path="/join/:roomCode" element={<JoinGame />} />
      <Route path="/setup" element={<GameSetup />} />
      <Route path="/lobby" element={<Lobby />} />
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
    <div className="min-h-screen bg-[#010127] text-slate-100">
      <HashRouter>
        <MenuOverlay />
        {checkedSession && <AppRoutes />}
      </HashRouter>
    </div>
  )
}

export default App