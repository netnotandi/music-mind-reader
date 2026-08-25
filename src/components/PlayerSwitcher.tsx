import { useGameStore } from '../state/gameStore'

export function PlayerSwitcher() {
  const players = useGameStore((s) => s.players)
  const currentPlayerId = useGameStore((s) => s.currentPlayerId)
  const setCurrentPlayer = useGameStore((s) => s.setCurrentPlayer)

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-slate-400">YOU ARE:</span>
      <select
        className="rounded-md border border-slate-600 bg-slate-800 px-1.5 py-0.5 text-xs text-slate-100"
        value={currentPlayerId}
        onChange={(e) => setCurrentPlayer(e.target.value)}
      >
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  )
}
