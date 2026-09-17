import { useEffect, useRef, useState } from 'react'
import { CATEGORIES } from '../state/mockData'
import { useUserStore } from '../state/userStore'
import type { Song } from '../types'

const SAVED_FLASH_MS = 1400
const ERROR_FLASH_MS = 3000

// Rendered inside SongCard's `action` slot (top-right corner). Self-contained
// - the caller only needs to worry about the "not your own song" gate (a
// game-domain concern); this component owns the "signed in?" gate itself,
// since that's an account-domain concern the caller shouldn't need to know
// about.
export function SaveSongButton({ song }: { song: Song }) {
  const status = useUserStore((s) => s.status)
  const saveSongToList = useUserStore((s) => s.saveSongToList)

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [savedCategoryId, setSavedCategoryId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
    }
  }, [])

  if (status !== 'ready') return null

  // The round's own category first (most likely destination), then every
  // other category in their normal order.
  const thisRoundCategory = CATEGORIES.find((c) => c.id === song.categoryId)
  const otherCategories = CATEGORIES.filter((c) => c.id !== song.categoryId)

  async function handleSave(categoryId: string) {
    setSaving(categoryId)
    setError(null)
    try {
      await saveSongToList(categoryId, {
        title: song.title,
        artist: song.artist,
        youtubeVideoId: song.youtubeVideoId,
        youtubeTitle: song.youtubeTitle,
      })
      setSavedCategoryId(categoryId)
      setOpen(false)
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
      savedTimeoutRef.current = setTimeout(() => setSavedCategoryId(null), SAVED_FLASH_MS)
    } catch {
      setError("Couldn't save — try again.")
      setOpen(false)
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
      errorTimeoutRef.current = setTimeout(() => setError(null), ERROR_FLASH_MS)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={savedCategoryId ? 'Saved to your list' : 'Save this song to your list'}
        className={`grid h-7 w-7 place-items-center rounded-full border text-sm backdrop-blur transition ${
          savedCategoryId
            ? 'border-success bg-success/20 text-success'
            : 'border-border bg-surface/80 text-text hover:border-border-strong'
        }`}
      >
        {savedCategoryId ? '✓' : '+'}
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-20 w-56 max-h-64 overflow-y-auto rounded-xl border border-border bg-bg text-left shadow-xl">
          {thisRoundCategory && (
            <div className="border-b border-border">
              <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                This round
              </p>
              <button
                type="button"
                disabled={saving !== null}
                onClick={() => handleSave(thisRoundCategory.id)}
                className="w-full px-3 py-2 text-left text-sm text-text transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving === thisRoundCategory.id ? 'Saving…' : thisRoundCategory.name}
              </button>
            </div>
          )}
          <ul>
            {otherCategories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={saving !== null}
                  onClick={() => handleSave(c.id)}
                  className="w-full px-3 py-2 text-left text-sm text-text transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving === c.id ? 'Saving…' : c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-border bg-bg p-2 text-xs text-danger shadow-xl">
          {error}
        </p>
      )}
    </div>
  )
}
