import { get as dbGet, ref } from 'firebase/database'
import { useEffect, useState } from 'react'
import { db } from '../firebase'
import { type CareerStats, useUserStore } from '../state/userStore'

type FetchStatus = 'loading' | 'ready' | 'error'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-semibold text-text">{value}</span>
    </div>
  )
}

function pct(numerator: number, denominator: number): string {
  return denominator === 0 ? '—' : `${Math.round((numerator / denominator) * 100)}%`
}

function avg(sum: number, count: number): string {
  return count === 0 ? '—' : (sum / count).toFixed(1)
}

// One-off fetch, not a live subscription - same reasoning as MyListsPanel:
// this is a single-viewer browsing context, nobody else changes your own
// career stats while you're looking at them.
export function StatsPanel() {
  const uid = useUserStore((s) => s.uid)
  const [status, setStatus] = useState<FetchStatus>('loading')
  const [stats, setStats] = useState<CareerStats>({})

  useEffect(() => {
    if (!uid) return
    let cancelled = false
    setStatus('loading')
    dbGet(ref(db, `users/${uid}/careerStats`))
      .then((snap) => {
        if (cancelled) return
        setStats(snap.val() ?? {})
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [uid])

  if (status === 'loading') {
    return <p className="text-sm text-text-muted">Loading your stats…</p>
  }
  if (status === 'error') {
    return <p className="text-sm text-danger">Couldn't load your stats — check your connection.</p>
  }

  const gamesPlayed = stats.gamesPlayed ?? 0
  if (gamesPlayed === 0) {
    return (
      <p className="text-sm text-text-muted">
        Play a full game while signed in to start building your stats.
      </p>
    )
  }

  const titleEntries = Object.entries(stats.titleCounts ?? {}).filter(([, count]) => (count ?? 0) > 0)

  return (
    <div>
      <div className="rounded-xl border border-border bg-surface-muted px-4">
        <Stat label="Games played" value={String(gamesPlayed)} />
        <Stat label="Rounds played" value={String(stats.roundsPlayed ?? 0)} />
        <Stat label="Correct guesses" value={String(stats.totalCorrectGuesses ?? 0)} />
        <Stat label="Guess accuracy" value={pct(stats.totalCorrectGuesses ?? 0, stats.totalGuessAttempts ?? 0)} />
        <Stat label="Longest guess streak" value={String(stats.longestGuessStreak ?? 0)} />
        <Stat
          label="Average rating given"
          value={avg(stats.ratingGivenSum ?? 0, stats.ratingGivenCount ?? 0)}
        />
        <Stat
          label="Average rating received"
          value={avg(stats.ratingReceivedSum ?? 0, stats.ratingReceivedCount ?? 0)}
        />
        <Stat
          label="How often people read you"
          value={pct(stats.totalGuessedByOthersCount ?? 0, stats.totalOwnedSongCount ?? 0)}
        />
      </div>

      {titleEntries.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Titles won</h4>
          <ul className="space-y-1">
            {titleEntries.map(([name, count]) => (
              <li key={name} className="flex items-center justify-between text-sm">
                <span className="text-text">{name}</span>
                <span className="font-semibold text-text-secondary">×{count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
