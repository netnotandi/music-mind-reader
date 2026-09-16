import { get as dbGet, ref, set as dbSet } from 'firebase/database'
import { db } from '../firebase'

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined

export interface YouTubeSearchResult {
  videoId: string
  title: string
  thumbnailUrl: string
}

export interface YouTubeSearchPage {
  results: YouTubeSearchResult[]
  // Passed back into a follow-up call to fetch the next batch - null once
  // YouTube has no more pages left for this query.
  nextPageToken: string | null
  // Set when the call failed outright, as opposed to a genuine zero-result
  // search - the two otherwise look identical (both end up with an empty
  // `results` array), but the player needs to hear a very different
  // message ("search is broken right now" vs. "nothing matched that").
  // 'quota' specifically: search.list costs 100 units against a 10,000/day
  // default quota, so a handful of people searching a few times each can
  // burn through it in one party.
  error?: 'quota' | 'other'
}

// YouTube charges the same 100 units for this call no matter how many
// results are requested (up to 50) - so fetching a bigger batch up front is
// free, and "Show next 3 results" can reveal more of it client-side with NO
// extra API call, only actually re-querying once the whole batch is used up.
const FETCH_BATCH_SIZE = 9
const EMPTY_PAGE: YouTubeSearchPage = { results: [], nextPageToken: null }

// Every room shares the same 10,000-unit daily quota (100 search.list calls
// - see CLAUDE.md), so the more the game gets played, the sooner a popular
// night runs out - UNLESS the same handful of well-known songs (which is
// most of what gets searched for) get served from a cache instead of
// costing quota again every time someone, in any room, types them in. Only
// the first page of a query is cached - overwhelmingly the common case,
// especially now that one page holds FETCH_BATCH_SIZE results.
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

interface CachedSearchEntry {
  results: YouTubeSearchResult[]
  nextPageToken: string | null
  fetchedAt: number
}

// Firebase keys can't contain ".", "#", "$", "[", "]", "/", or start empty -
// collapse the query down to something safe and stable regardless of
// spacing/case, so "Rick Astley" and "  rick   astley " hit the same entry.
function cacheKeyFor(query: string): string {
  const key = query
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return key.slice(0, 200) || 'blank'
}

async function readCachedSearch(key: string): Promise<CachedSearchEntry | null> {
  try {
    const snap = await dbGet(ref(db, `songSearchCache/${key}`))
    return snap.exists() ? (snap.val() as CachedSearchEntry) : null
  } catch {
    // Most likely: the database rules don't grant access to this path yet
    // (see the "songSearchCache" note in CLAUDE.md) - fails open, exactly
    // like a cache miss, so search still works without it.
    return null
  }
}

function writeCachedSearch(key: string, entry: CachedSearchEntry) {
  // Best-effort - if this write fails (permission denied, offline, ...),
  // the only consequence is that the next search for this exact query
  // costs quota again.
  dbSet(ref(db, `songSearchCache/${key}`), entry).catch(() => {})
}

// The YouTube API returns snippet titles with HTML entities left in
// (&#39; &amp; &quot; ...). Decode them so a stored/shown video title reads
// as plain text - "Rapper's Delight", not "Rapper&#39;s Delight".
export function decodeHtmlEntities(text: string): string {
  if (!text || !text.includes('&')) return text
  if (typeof document === 'undefined') return text
  const el = document.createElement('textarea')
  el.innerHTML = text
  return el.value
}

// Best-effort matches only - the player still has to confirm one (or fall
// back to a direct link via extractYouTubeVideoId) rather than anything
// being submitted silently. Checks songSearchCache first (shared across
// every room, not just this one) and only calls the real API on a miss or
// a stale hit - see CACHE_TTL_MS above. A short list rather than a single
// top match matters most for an ambiguous query (just a title, or just an
// artist), where the single "best" hit is often not the one they meant - pageToken
// (from a previous call's nextPageToken) lets the caller ask YouTube for a
// fresh batch once the current one (see FETCH_BATCH_SIZE) runs out, without
// starting the search over. Returns an empty page rather than throwing on
// any failure (missing key, network error, no results, quota) so a broken
// search never blocks a submission - it just means the manual fallback is
// what's needed; `error` lets the caller tell which kind of failure it was.
export async function searchYouTubeVideos(query: string, pageToken?: string): Promise<YouTubeSearchPage> {
  if (!API_KEY) return EMPTY_PAGE

  const cacheKey = pageToken ? null : cacheKeyFor(query)
  const cached = cacheKey ? await readCachedSearch(cacheKey) : null
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { results: cached.results, nextPageToken: cached.nextPageToken }
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('type', 'video')
  url.searchParams.set('maxResults', String(FETCH_BATCH_SIZE))
  url.searchParams.set('q', query)
  url.searchParams.set('key', API_KEY)
  if (pageToken) url.searchParams.set('pageToken', pageToken)

  try {
    const res = await fetch(url.toString())
    if (!res.ok) {
      let reason: string | undefined
      try {
        const body = await res.json()
        reason = body?.error?.errors?.[0]?.reason
      } catch {
        // body wasn't JSON (or empty) - reason stays undefined -> 'other'
      }
      // The live call failed (quota, most likely) - a stale cached hit for
      // this exact query beats failing outright. This is exactly when the
      // cache matters most: quota runs out under heavy/popular use, which
      // is also when the cache is at its most populated.
      if (cached) return { results: cached.results, nextPageToken: cached.nextPageToken }
      return { results: [], nextPageToken: null, error: reason === 'quotaExceeded' ? 'quota' : 'other' }
    }
    const data = await res.json()
    const items = Array.isArray(data.items) ? data.items : []
    const results: YouTubeSearchResult[] = []
    for (const item of items) {
      const videoId = item?.id?.videoId
      const title = item?.snippet?.title
      const thumbnailUrl = item?.snippet?.thumbnails?.default?.url
      if (typeof videoId === 'string' && typeof title === 'string' && typeof thumbnailUrl === 'string') {
        results.push({ videoId, title: decodeHtmlEntities(title), thumbnailUrl })
      }
    }
    const nextPageToken = typeof data.nextPageToken === 'string' ? data.nextPageToken : null
    if (cacheKey) writeCachedSearch(cacheKey, { results, nextPageToken, fetchedAt: Date.now() })
    return { results, nextPageToken }
  } catch {
    if (cached) return { results: cached.results, nextPageToken: cached.nextPageToken }
    return { results: [], nextPageToken: null, error: 'other' }
  }
}

// @types/youtube declares the YT namespace but not the two globals the
// IFrame API actually hangs off window.
declare global {
  interface Window {
    YT?: typeof YT
    onYouTubeIframeAPIReady?: () => void
  }
}

// The IFrame Player API loads via a global callback (onYouTubeIframeAPIReady)
// and a one-off <script> injection. Memoised so it only happens once no
// matter how many times the Now Playing player mounts across rounds.
let iframeApiPromise: Promise<typeof YT> | null = null

export function loadYouTubeIframeApi(): Promise<typeof YT> {
  if (iframeApiPromise) return iframeApiPromise
  iframeApiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT)
      return
    }
    // YouTube calls this global once the API is ready; chain any existing
    // handler so we don't clobber one another set.
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve(window.YT)
    }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  })
  return iframeApiPromise
}

const YOUTUBE_URL_PATTERNS = [
  /youtube\.com\/watch\?v=([\w-]{11})/,
  /youtu\.be\/([\w-]{11})/,
  /youtube\.com\/embed\/([\w-]{11})/,
  /youtube\.com\/shorts\/([\w-]{11})/,
]

// Manual safety net: a player pastes a plain YouTube link (or just the bare
// video ID) when the automatic search didn't find their song, or found the
// wrong one.
export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim()
  for (const pattern of YOUTUBE_URL_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) return match[1]
  }
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed
  return null
}

// A real YouTube video ID is always exactly 11 characters from this
// alphabet - checked right before handing a stored videoId to the IFrame
// Player API (NowPlayingPlayer.tsx), since the API itself throws an
// uncaught "Invalid video id" exception (seen for real in production,
// breaking playback for everyone) rather than a catchable onError event for
// a malformed one. Whatever produced the bad value (a stray edge case in
// the manual-link fallback, old data, ...) doesn't matter here - this is
// the last line of defense before it reaches YouTube's own code.
export function isValidYouTubeVideoId(id: string): boolean {
  return /^[\w-]{11}$/.test(id)
}
