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

// Categories shown per page - keeps a heavy saver's list from turning into
// one endless scroll (see the pagination below), rather than a hard limit
// on how many categories can actually be saved.
const CATEGORIES_PER_PAGE = 6

// One-off fetch, not a live subscription - this is a single-viewer browsing
// context (nobody else changes your own saved lists while you're looking at
// them), unlike the multiplayer game state the rest of the app syncs live.
export function MyListsPanel() {
  const uid = useUserStore((s) => s.uid)
  const [status, setStatus] = useState<FetchStatus>('loading')
  const [lists, setLists] = useState<Record<string, Record<string, SavedSongEntry>>>({})
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)
  const [page, setPage] = useState(0)

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

  // Clamped rather than trusted as-is - removing the last song on the last
  // page (or the list simply shrinking) can leave a stale page index past
  // the end, which would otherwise render nothing instead of falling back
  // to the last real page.
  const totalPages = Math.ceil(nonEmptyCategories.length / CATEGORIES_PER_PAGE)
  const currentPage = Math.min(page, totalPages - 1)
  const pageCategories = nonEmptyCategories.slice(
    currentPage * CATEGORIES_PER_PAGE,
    currentPage * CATEGORIES_PER_PAGE + CATEGORIES_PER_PAGE
  )

  return (
    <div>
      <div className="space-y-2">
        {pageCategories.map((category) => {
          const songs = Object.entries(lists[category.id])
          const isExpanded = expandedCategoryId === category.id
          return (
            <div key={category.id} className="overflow-hidden rounded-xl border border-border-strong bg-surface-muted">
              <button
                type="button"
                onClick={() => setExpandedCategoryId(isExpanded ? null : category.id)}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
              >
                <span className="truncate text-sm font-semibold text-text">{category.name}</span>
                <span className="flex flex-shrink-0 items-center gap-2">
                  <span className="text-xs text-text-muted">{songs.length}</span>
                  <span className={`text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                </span>
              </button>

              {isExpanded && (
                // Sunk into the page's own background (bg-bg, darker than
                // this card's bg-surface-muted) rather than matching the
                // category row above it - the header and its saved songs
                // otherwise read as one indistinguishable shade (per host
                // feedback: they looked "so similar to the list itself").
                <ul className="space-y-2 bg-bg px-4 py-3">
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

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
            aria-label="Previous categories"
            className="rounded-full border border-border-strong px-3 py-1.5 text-success transition hover:border-success disabled:cursor-not-allowed disabled:opacity-30"
          >
            ←
          </button>
          <span className="text-xs text-text-muted">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages - 1}
            onClick={() => setPage(currentPage + 1)}
            aria-label="Next categories"
            className="rounded-full border border-border-strong px-3 py-1.5 text-success transition hover:border-success disabled:cursor-not-allowed disabled:opacity-30"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}
