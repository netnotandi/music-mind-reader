import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

export function CreateJoin() {
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState('')

  // Set when a QR code was scanned by the phone's own camera app, landing
  // here (via JoinRedirect) instead of straight on Join Game - carried
  // forward once a name is entered, so it's never asked for twice.
  const roomCodeFromQr = (location.state as { roomCode?: string } | null)?.roomCode ?? null

  function handleCreateGame() {
    if (!name.trim()) return
    navigate('/setup', { state: { hostName: name.trim() } })
  }

  function handleJoinGame() {
    if (!name.trim()) return
    navigate('/join', { state: { name: name.trim(), roomCode: roomCodeFromQr } })
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-20">
      <div className="flex justify-center">
        <img src={logo} alt="Music Mind Reader" className="w-80" />
      </div>

      <div className="mx-auto mt-20 flex w-72 flex-col gap-3">
        {roomCodeFromQr && (
          <p className="text-center text-sm text-slate-400">
            Scanned game code: <span className="font-semibold text-emerald-300">{roomCodeFromQr}</span>
          </p>
        )}
        <input
          className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-center text-sm text-slate-100 placeholder:text-slate-500"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="button"
          disabled={!name.trim()}
          onClick={handleCreateGame}
          className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
        >
          CREATE GAME
        </button>
        <button
          type="button"
          disabled={!name.trim()}
          onClick={handleJoinGame}
          className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
        >
          JOIN GAME
        </button>
      </div>
    </div>
  )
}