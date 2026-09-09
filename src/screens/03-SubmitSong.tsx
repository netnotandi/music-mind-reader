import { useState } from 'react'
import { extractYouTubeVideoId, searchYouTubeVideo, type YouTubeSearchResult } from '../logic/youtube'
import { useGameStore } from '../state/gameStore'
import { MOCK_SONG_POOL } from '../state/mockData'
import { useThemeStore } from '../state/themeStore'
import type { Category } from '../types'

// Title and artist are both optional individually (only one is required to
// search), so anywhere they're shown back to the player has to degrade
// gracefully instead of assuming both are present.
function describeSong(title: string, artist: string) {
  return [title, artist].filter(Boolean).join(' — ')
}

interface SongFormProps {
  category: Category
  existingSong: { title: string; artist: string } | undefined
  onSubmit: (title: string, artist: string, youtubeVideoId: string | null) => void
}

// Keyed by `${category.id}` from the parent, so React remounts this (and
// resets/refills title+artist, plus the search/link flow below, from
// existingSong) whenever the category being filled in changes.
function SongForm({ category, existingSong, onSubmit }: SongFormProps) {
  // Light-only: the category name reads as the "current assigned identity"
  // (primary/violet) rather than a success/confirmation signal, and the
  // confirmed-song card reads as "the selected item" (the same info/cyan
  // border used for the reviewing-an-earlier-song banner elsewhere) rather
  // than a completed/success state - dark keeps its original green look.
  const isLight = useThemeStore((s) => s.resolvedTheme === 'light')
  const [title, setTitle] = useState(existingSong?.title ?? '')
  const [artist, setArtist] = useState(existingSong?.artist ?? '')
  // 'form' -> 'searching' -> 'preview' (a match was found - player still has
  // to confirm it with the + button, never submitted silently) or
  // 'manual-link' (nothing found, or the player rejected the preview) ->
  // 'confirmed' (submitted - shows what was picked instead of snapping back
  // to a blank/prefilled form, with a way to redo the search if wanted).
  const [stage, setStage] = useState<'form' | 'searching' | 'preview' | 'manual-link' | 'confirmed'>(
    existingSong ? 'confirmed' : 'form'
  )
  const [result, setResult] = useState<YouTubeSearchResult | null>(null)
  const [manualLink, setManualLink] = useState('')
  const [linkError, setLinkError] = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() && !artist.trim()) return
    setStage('searching')
    const found = await searchYouTubeVideo([title.trim(), artist.trim()].filter(Boolean).join(' '))
    if (found) {
      setResult(found)
      setStage('preview')
    } else {
      setStage('manual-link')
    }
  }

  function finish(youtubeVideoId: string) {
    onSubmit(title.trim(), artist.trim(), youtubeVideoId)
    // Doesn't remount (same category, key unchanged) when this is the only
    // selected category left to edit - handled by hand so a successful
    // submit doesn't leave an earlier stage showing as if it were still
    // stuck. Keeps `result` (if there is one) so the confirmed view below
    // can still show what was actually picked, rather than reverting to a
    // blank/prefilled form with no visible confirmation.
    setStage('confirmed')
    setManualLink('')
    setLinkError(null)
  }

  function chooseNewSong() {
    setStage('form')
    setResult(null)
  }

  function handleManualLinkSubmit(e: React.FormEvent) {
    e.preventDefault()
    const videoId = extractYouTubeVideoId(manualLink)
    if (!videoId) {
      setLinkError("That doesn't look like a valid YouTube link.")
      return
    }
    finish(videoId)
  }

  return (
    <>
      <div className="mb-6 rounded-xl border border-border bg-surface-muted px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-text-secondary">Category</p>
        <p className={`text-lg font-semibold ${isLight ? 'text-primary' : 'text-success'}`}>{category.name}</p>
      </div>

      {stage === 'confirmed' ? (
        <div className="mb-6 flex flex-col gap-3">
          <div
            className={`flex items-center gap-3 rounded-lg border bg-surface p-3 ${
              isLight ? 'border-cyan' : 'border-success/40'
            }`}
          >
            {result ? (
              <img src={result.thumbnailUrl} alt="" className="h-14 w-14 flex-shrink-0 rounded object-cover" />
            ) : (
              <div className="grid h-14 w-14 flex-shrink-0 place-items-center rounded bg-surface-muted text-success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-6 w-6">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <p className="flex-1 text-sm text-text">{result ? result.title : describeSong(title, artist)}</p>
          </div>
          <button
            type="button"
            onClick={chooseNewSong}
            className="rounded-lg border border-primary bg-primary px-4 py-2 font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active"
          >
            Choose new song
          </button>
        </div>
      ) : stage === 'preview' && result ? (
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-lg border border-border-strong bg-surface p-3">
            <img src={result.thumbnailUrl} alt="" className="h-14 w-14 flex-shrink-0 rounded object-cover" />
            <p className="flex-1 text-sm text-text">{result.title}</p>
            <button
              type="button"
              onClick={() => finish(result.videoId)}
              aria-label="Add this video"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-primary bg-primary text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-5 w-5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            onClick={() => setStage('manual-link')}
            className="text-sm text-text-secondary hover:text-text"
          >
            Not the right video? Paste a link instead
          </button>
        </div>
      ) : stage === 'manual-link' ? (
        <form className="mb-6 flex flex-col gap-3" onSubmit={handleManualLinkSubmit}>
          <p className="text-sm text-text-secondary">
            {result
              ? 'Paste a direct YouTube link instead.'
              : `Couldn't find a YouTube video for "${describeSong(title, artist)}". Paste a direct YouTube link instead.`}
          </p>
          <input
            className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-text placeholder:text-placeholder"
            placeholder="https://youtube.com/watch?v=..."
            value={manualLink}
            onChange={(e) => {
              setManualLink(e.target.value)
              setLinkError(null)
            }}
          />
          {linkError && <p className="text-sm text-danger">{linkError}</p>}
          <button
            type="submit"
            className="rounded-lg border border-primary bg-primary px-4 py-2 font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active"
          >
            {existingSong ? 'Edit Song' : 'Submit Song'}
          </button>
          <button
            type="button"
            onClick={() => setStage('form')}
            className="text-sm text-text-secondary hover:text-text"
          >
            ← Back to title/artist
          </button>
        </form>
      ) : (
        <form className="mb-6 flex flex-col gap-3" onSubmit={handleSearch}>
          <p className="text-xs text-text-muted">Enter the title, the artist, or both.</p>
          <input
            className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-text placeholder:text-placeholder"
            placeholder="Song title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-text placeholder:text-placeholder"
            placeholder="Artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />
          <button
            type="submit"
            disabled={stage === 'searching' || (!title.trim() && !artist.trim())}
            className="rounded-lg border border-primary bg-primary px-4 py-2 font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-bg disabled:text-disabled-text"
          >
            {stage === 'searching' ? 'Searching YouTube...' : existingSong ? 'Find New Video' : 'Find Song'}
          </button>
        </form>
      )}
    </>
  )
}

interface ProgressTableProps {
  players: { id: string; name: string }[]
  selectedCategories: Category[]
  localPlayerId: string
  hasSong: (playerId: string, categoryId: string) => boolean
}

function ProgressTable({ players, selectedCategories, localPlayerId, hasSong }: ProgressTableProps) {
  return (
    <div className="mb-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="px-3 py-2 text-left font-medium">Player</th>
            {selectedCategories.map((c) => (
              <th key={c.id} className="px-2 py-2 text-center font-medium">
                {c.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr
              key={p.id}
              className={`border-b border-border last:border-0 ${
                p.id === localPlayerId ? 'bg-success/10' : ''
              }`}
            >
              <td
                className={`max-w-[8rem] truncate px-3 py-2 ${
                  p.id === localPlayerId ? 'font-semibold text-success' : 'text-text'
                }`}
              >
                {p.name}
              </td>
              {selectedCategories.map((c) => (
                <td key={c.id} className="px-2 py-2 text-center">
                  {hasSong(p.id, c.id) ? (
                    <span className="text-success">✓</span>
                  ) : (
                    <span className="text-text-muted">·</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SubmitSong() {
  const players = useGameStore((s) => s.players)
  const categories = useGameStore((s) => s.categories)
  const selectedCategoryIds = useGameStore((s) => s.selectedCategoryIds)
  const localPlayerId = useGameStore((s) => s.localPlayerId)
  const songs = useGameStore((s) => s.songs)
  const submitSong = useGameStore((s) => s.submitSong)
  const devSubmitSongAs = useGameStore((s) => s.devSubmitSongAs)
  const shuffleSongOrder = useGameStore((s) => s.shuffleSongOrder)

  const selectedCategories = categories.filter((c) => selectedCategoryIds.includes(c.id))
  const hasSong = (playerId: string, categoryId: string) =>
    songs.some((s) => s.playerId === playerId && s.categoryId === categoryId)

  if (!localPlayerId) {
    return (
      <div className="mx-auto max-w-md px-6 py-8 text-text-secondary">
        Not connected to a game — go back to the start.
      </div>
    )
  }

  // Focus on my first not-yet-submitted category, or fall back to my first
  // selected category (in edit mode) once I've done them all.
  const categoryToShow =
    selectedCategories.find((c) => !hasSong(localPlayerId, c.id)) ?? selectedCategories[0]
  const existingSong = categoryToShow
    ? songs.find((s) => s.playerId === localPlayerId && s.categoryId === categoryToShow.id)
    : undefined

  const totalRequired = players.length * selectedCategories.length
  const totalSubmitted = songs.filter((s) => selectedCategoryIds.includes(s.categoryId)).length
  const allSubmitted = selectedCategories.length > 0 && totalSubmitted === totalRequired

  if (selectedCategories.length === 0 || !categoryToShow) {
    return (
      <div className="mx-auto max-w-md px-6 py-8 text-text-secondary">
        No category selected yet — go back to the Lobby.
      </div>
    )
  }

  function handleDevAutofill() {
    let pickIndex = 0
    for (const category of selectedCategories) {
      for (const player of players) {
        if (hasSong(player.id, category.id)) continue
        const pick = MOCK_SONG_POOL[pickIndex % MOCK_SONG_POOL.length]
        pickIndex++
        devSubmitSongAs(player.id, category.id, pick.title, pick.artist)
      }
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 pb-12 pt-16">
      <SongForm
        key={categoryToShow.id}
        category={categoryToShow}
        existingSong={existingSong}
        onSubmit={(title, artist, youtubeVideoId) => submitSong(categoryToShow.id, title, artist, youtubeVideoId)}
      />

      <ProgressTable
        players={players}
        selectedCategories={selectedCategories}
        localPlayerId={localPlayerId}
        hasSong={hasSong}
      />

      {!allSubmitted && import.meta.env.DEV && (
        <button
          type="button"
          onClick={handleDevAutofill}
          className="mb-4 w-full rounded-lg border border-border-strong px-4 py-2 text-sm text-text-secondary hover:border-border-strong"
        >
          Fill in mock songs for everyone else (dev only, to test the flow)
        </button>
      )}

      <button
        type="button"
        disabled={!allSubmitted}
        onClick={shuffleSongOrder}
        className="w-full rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-bg disabled:text-disabled-text"
      >
        Start Guessing
      </button>
    </div>
  )
}