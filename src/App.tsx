import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MenuOverlay } from './components/MenuOverlay'
import { CreateJoin } from './screens/01-CreateJoin'
import { JoinGame } from './screens/01b-JoinGame'
import { CategorySelect } from './screens/01c-CategorySelect'
import { Lobby } from './screens/02-Lobby'
import { SubmitSong } from './screens/03-SubmitSong'
import { GuessAndRate } from './screens/05-GuessAndRate'
import { Results } from './screens/06-Results'

function App() {
  return (
    <div className="min-h-screen bg-[#010127] text-slate-100">
      <BrowserRouter>
        <MenuOverlay />
        <Routes>
          <Route path="/" element={<CreateJoin />} />
          <Route path="/join" element={<JoinGame />} />
          <Route path="/categories" element={<CategorySelect />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/submit" element={<SubmitSong />} />
          <Route path="/guess" element={<GuessAndRate />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
