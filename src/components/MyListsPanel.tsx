import { get as dbGet, ref, remove as dbRemove } from 'firebase/database'
import { useEffect, useState } from 'react'
import { db } from '../firebase'
import { songLabel } from '../logic/songLabel'
import { CATEGORIES } from '../state/mockData'
import { useUserStore } from '../state/userStore'

interface SavedSongEntry {
  title: string
  artist: string
  youtubeVideoId?: string
  youtubeTitle?: string
}

type FetchStatus = 'loading' | 'ready' | 'error'

// One-off fetch, not a live subscription - this is a single-viewer browsing
// context (nobody else changes your own saved lists while you're looking at
// them), unlike the multiplayer game state the rest of the app syncs live.
export function MyListsPanel() {
  const uid = useUserStore((s) => s.uid)
  const [status, setStatus] = useState<FetchStatus>('loading')
  const [lists, setLists] = useState<Record<string, Record<string, SavedSongEntry>>>({})
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)

  useEffect(() => {
    if (!uid) return
    let cancelled = false
    setStatus('loading')
    dbGet(ref(db, `users/${uid}/lists`))
      .then((snap) => {
        if (cancelled) return
        setLists(snap.val() ?? {})
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

  // Deletes locally too rather than re-fetching - this is the only writer of
  // this data (single-viewer browsing context, see the module comment
  // above), so the optimistic update can't drift from what's in Firebase.
  function removeSong(categoryId: string, songKey: string) {
    if (!uid) return
    dbRemove(ref(db, `users/${uid}/lists/${categoryId}/${songKey}`))
    setLists((prev) => {
      const remaining = { ...(prev[categoryId] ?? {}) }
      delete remaining[songKey]
      const next = { ...prev }
      if (Object.keys(remaining).length === 0) {
        delete next[categoryId]
      } else {
        next[categoryId] = remaining
      }
      return next
    })
  }

  if (status === 'loading') {
    return <p className="text-sm text-text-muted">Loading your lists…</p>
  }
  if (status === 'error') {
    return <p className="text-sm text-danger">Couldn't load your lists — check your connection.</p>
  }

  // Only categories that actually have a saved song, in CATEGORIES' own
  // order - not all 41, which would just be a wall of empty rows.
  const nonEmptyCategories = CATEGORIES.filter((c) => lists[c.id] && Object.keys(lists[c.id]).length > 0)

  if (nonEmptyCategories.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        You haven't saved any songs yet — look for the + button next to a song during a game.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {nonEmptyCategories.map((category) => {
        const songs = Object.entries(lists[category.id])
        const isExpanded = expandedCategoryId === category.id
        return (
          <div key={category.id} className="rounded-xl border border-border bg-surface-muted">
            <button
              type="button"
              onClick={() => setExpandedCategoryId(isExpanded ? null : category.id)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
            >
              <span className="truncate text-sm font-medium text-text">{category.name}</span>
              <span className="flex flex-shrink-0 items-center gap-2">
                <span className="text-xs text-text-muted">{songs.length}</span>
                <span className={`text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
              </span>
            </button>

            {isExpanded && (
              <ul className="space-y-2 border-t border-border px-4 py-3">
                {songs.map(([songKey, entry]) => {
                  const { primary, secondary } = songLabel(entry)
                  return (
                    <li key={songKey} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-text">{primary}</p>
                        {secondary && <p className="truncate text-xs text-text-secondary">{secondary}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSong(category.id, songKey)}
                        className="flex-shrink-0 rounded-md border border-danger/40 px-2 py-1 text-xs font-semibold text-danger transition hover:border-danger"
                      >
                        Remove
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
