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
// being submitted silently. A short list rather than a single top match
// matters most for an ambiguous query (just a title, or just an artist),
// where the single "best" hit is often not the one they meant - pageToken
// (from a previous call's nextPageToken) lets the caller ask YouTube for a
// fresh batch once the current one (see FETCH_BATCH_SIZE) runs out, without
// starting the search over. Returns an empty page rather than throwing on
// any failure (missing key, network error, no results, quota) so a broken
// search never blocks a submission - it just means the manual fallback is
// what's needed; `error` lets the caller tell which kind of failure it was.
export async function searchYouTubeVideos(query: string, pageToken?: string): Promise<YouTubeSearchPage> {
  if (!API_KEY) return EMPTY_PAGE
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
    return { results, nextPageToken }
  } catch {
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
