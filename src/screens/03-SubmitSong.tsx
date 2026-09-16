import { useState } from 'react'
import { extractYouTubeVideoId, searchYouTubeVideos, type YouTubeSearchResult } from '../logic/youtube'
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

// How many search candidates are shown at a time - "Show next 3 results"
// reveals another batch of this size (see FETCH_BATCH_SIZE in youtube.ts,
// which fetches several of these pages' worth in one API call).
const RESULTS_PAGE_SIZE = 3

interface SongFormProps {
  category: Category
  existingSong: { title: string; artist: string } | undefined
  onSubmit: (
    title: string,
    artist: string,
    youtubeVideoId: string | null,
    youtubeTitle: string | null
  ) => void
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
  // 'form' -> 'searching' -> 'preview' (up to a few candidate matches -
  // player still has to confirm one with its + button, never submitted
  // silently) or 'manual-link' (nothing found, or the player rejected every
  // candidate) -> 'confirmed' (submitted - shows what was picked instead of
  // snapping back to a blank/prefilled form, with a way to redo the search
  // if wanted).
  const [stage, setStage] = useState<'form' | 'searching' | 'preview' | 'manual-link' | 'confirmed'>(
    existingSong ? 'confirmed' : 'form'
  )
  // The full batch fetched from the last API call (see FETCH_BATCH_SIZE in
  // youtube.ts - YouTube charges the same 100 units for it regardless of
  // size, so it's fetched once and a window of RESULTS_PAGE_SIZE is shown
  // at a time from here). `visibleStart` is that window's offset - "Show
  // next 3 results" always swaps in the next 3, never grows the on-screen
  // list past 3, and only triggers a real API call once this whole batch
  // is used up.
  const [allResults, setAllResults] = useState<YouTubeSearchResult[]>([])
  const [visibleStart, setVisibleStart] = useState(0)
  const results = allResults.slice(visibleStart, visibleStart + RESULTS_PAGE_SIZE)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  // Set when a search came back empty because it actually FAILED (quota
  // exhausted, or some other API/network error) rather than genuinely
  // matching nothing - the manual-link stage says something very different
  // in that case.
  const [searchIssue, setSearchIssue] = useState<'quota' | 'other' | null>(null)
  // Separate from `results` (the candidate list) - this is specifically
  // what the player actually picked, so the confirmed view keeps showing
  // it even after `results` is cleared by a later search.
  const [confirmedResult, setConfirmedResult] = useState<YouTubeSearchResult | null>(null)
  const [manualLink, setManualLink] = useState('')
  const [linkError, setLinkError] = useState<string | null>(null)

  const searchQuery = [title.trim(), artist.trim()].filter(Boolean).join(' ')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery) return
    setStage('searching')
    setSearchIssue(null)
    // A query built from just a title or just an artist is inherently
    // ambiguous, so a short list of candidates (rather than a single "best"
    // match) matters most here - the player picks the right one themselves.
    const page = await searchYouTubeVideos(searchQuery)
    if (page.results.length > 0) {
      setAllResults(page.results)
      setVisibleStart(0)
      setNextPageToken(page.nextPageToken)
      setStage('preview')
    } else {
      setSearchIssue(page.error ?? null)
      setStage('manual-link')
    }
  }

  function handleLoadMore() {
    if (loadingMore) return
    const nextStart = visibleStart + RESULTS_PAGE_SIZE
    // Slide the window forward within the batch we already have - free, no
    // API call, and the on-screen count never grows past RESULTS_PAGE_SIZE.
    if (nextStart < allResults.length) {
      setVisibleStart(nextStart)
      return
    }
    if (!nextPageToken) return
    setLoadingMore(true)
    searchYouTubeVideos(searchQuery, nextPageToken).then((page) => {
      // Appends the new page onto the batch (de-duped by videoId, in case a
      // page overlaps) so the window can keep sliding forward through it -
      // only the 3 actually shown ever change, the underlying list is just
      // bookkeeping. A failure here (e.g. quota ran out partway through)
      // just leaves the candidates already on screen as they are - not
      // worth derailing the picker they're already using.
      if (page.results.length > 0 || !page.error) {
        setAllResults((prev) => {
          const seen = new Set(prev.map((r) => r.videoId))
          return [...prev, ...page.results.filter((r) => !seen.has(r.videoId))]
        })
        setVisibleStart(nextStart)
        setNextPageToken(page.nextPageToken)
      }
      setLoadingMore(false)
    })
  }

  function finish(youtubeVideoId: string, picked: YouTubeSearchResult | null) {
    onSubmit(title.trim(), artist.trim(), youtubeVideoId, picked?.title ?? null)
    // Doesn't remount (same category, key unchanged) when this is the only
    // selected category left to edit - handled by hand so a successful
    // submit doesn't leave an earlier stage showing as if it were still
    // stuck. Keeps the picked result (if there is one) so the confirmed
    // view below can still show what was actually picked, rather than
    // reverting to a blank/prefilled form with no visible confirmation.
    setConfirmedResult(picked)
    setStage('confirmed')
    setAllResults([])
    setVisibleStart(0)
    setNextPageToken(null)
    setManualLink('')
    setLinkError(null)
  }

  function chooseNewSong() {
    setStage('form')
    setAllResults([])
    setVisibleStart(0)
    setNextPageToken(null)
    setSearchIssue(null)
  }

  function handleManualLinkSubmit(e: React.FormEvent) {
    e.preventDefault()
    const videoId = extractYouTubeVideoId(manualLink)
    if (!videoId) {
      setLinkError("That doesn't look like a valid YouTube link.")
      return
    }
    finish(videoId, null)
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
            {confirmedResult ? (
              <img src={confirmedResult.thumbnailUrl} alt="" className="h-14 w-14 flex-shrink-0 rounded object-cover" />
            ) : (
              <div className="grid h-14 w-14 flex-shrink-0 place-items-center rounded bg-surface-muted text-success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-6 w-6">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <p className="flex-1 text-sm text-text">
              {confirmedResult ? confirmedResult.title : describeSong(title, artist)}
            </p>
          </div>
          <button
            type="button"
            onClick={chooseNewSong}
            className="rounded-lg border border-primary bg-primary px-4 py-2 font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active"
          >
            Choose new song
          </button>
        </div>
      ) : stage === 'preview' && results.length > 0 ? (
        <div className="mb-6 flex flex-col gap-3">
          {results.map((candidate) => (
            <div
              key={candidate.videoId}
              className="flex items-center gap-3 rounded-lg border border-border-strong bg-surface p-3"
            >
              <img src={candidate.thumbnailUrl} alt="" className="h-14 w-14 flex-shrink-0 rounded object-cover" />
              <p className="flex-1 text-sm text-text">{candidate.title}</p>
              <button
                type="button"
                onClick={() => finish(candidate.videoId, candidate)}
                aria-label="Add this video"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-primary bg-primary text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-5 w-5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          ))}
          {(visibleStart + RESULTS_PAGE_SIZE < allResults.length || nextPageToken) && (
            <button
              type="button"
              disabled={loadingMore}
              onClick={handleLoadMore}
              className="rounded-lg border border-border-strong px-4 py-2 text-sm text-text-secondary transition hover:border-border-strong disabled:cursor-not-allowed disabled:text-disabled-text"
            >
              {loadingMore ? 'Loading…' : 'Show next 3 results'}
            </button>
          )}
          <button
            type="button"
            onClick={chooseNewSong}
            className="text-sm text-text-secondary hover:text-text"
          >
            None of these? Find another song
          </button>
        </div>
      ) : stage === 'manual-link' ? (
        <form className="mb-6 flex flex-col gap-3" onSubmit={handleManualLinkSubmit}>
          <p className="text-sm text-text-secondary">
            {searchIssue === 'quota'
              ? "Song search has hit its limit for today - paste a direct YouTube link instead (it works exactly the same)."
              : searchIssue === 'other'
                ? "Song search isn't working right now - paste a direct YouTube link instead."
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
            autoComplete="new-password"
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
            autoComplete="new-password"
          />
          <input
            className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-text placeholder:text-placeholder"
            placeholder="Artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            autoComplete="new-password"
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
  const hostId = useGameStore((s) => s.hostId)
  const songs = useGameStore((s) => s.songs)
  const submitSong = useGameStore((s) => s.submitSong)
  const devSubmitSongAs = useGameStore((s) => s.devSubmitSongAs)
  const shuffleSongOrder = useGameStore((s) => s.shuffleSongOrder)

  const isHost = localPlayerId !== null && localPlayerId === hostId
  const hostPlayer = players.find((p) => p.id === hostId)
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
        onSubmit={(title, artist, youtubeVideoId, youtubeTitle) =>
          submitSong(categoryToShow.id, title, artist, youtubeVideoId, youtubeTitle)
        }
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

      {/* Host-only, like every other "advance the whole group" action -
          the host runs the game. Everyone else sees the same button
          disabled with a waiting label once submissions are all in. */}
      <button
        type="button"
        disabled={!allSubmitted || !isHost}
        onClick={shuffleSongOrder}
        className="w-full rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-text-on-primary transition hover:bg-primary-hover active:bg-primary-active disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-bg disabled:text-disabled-text"
      >
        {allSubmitted && !isHost
          ? `Waiting for ${hostPlayer?.name ?? 'the host'} to start guessing`
          : 'Start Guessing'}
      </button>
    </div>
  )
}