import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CreateJoin } from './screens/01-CreateJoin'
import { Lobby } from './screens/02-Lobby'
import { SubmitSong } from './screens/03-SubmitSong'
import { NowPlaying } from './screens/04-NowPlaying'
import { GuessAndRate } from './screens/05-GuessAndRate'
import { Results } from './screens/06-Results'

function App() {
  return (
    <div className="min-h-screen bg-[#010127] text-slate-100">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CreateJoin />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/submit" element={<SubmitSong />} />
          <Route path="/now-playing" element={<NowPlaying />} />
          <Route path="/guess" element={<GuessAndRate />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
