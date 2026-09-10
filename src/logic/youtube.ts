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
}

const MAX_SEARCH_RESULTS = 3
const EMPTY_PAGE: YouTubeSearchPage = { results: [], nextPageToken: null }

// Best-effort matches only - the player still has to confirm one (or fall
// back to a direct link via extractYouTubeVideoId) rather than anything
// being submitted silently. A short list rather than a single top match
// matters most for an ambiguous query (just a title, or just an artist),
// where the single "best" hit is often not the one they meant - pageToken
// (from a previous call's nextPageToken) lets the player ask for another
// batch of 3 without starting the search over. Returns an empty page
// rather than throwing on any failure (missing key, network error, no
// results) so a broken search never blocks a submission - it just means
// the manual fallback is what's needed.
export async function searchYouTubeVideos(query: string, pageToken?: string): Promise<YouTubeSearchPage> {
  if (!API_KEY) return EMPTY_PAGE
  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('type', 'video')
  url.searchParams.set('maxResults', String(MAX_SEARCH_RESULTS))
  url.searchParams.set('q', query)
  url.searchParams.set('key', API_KEY)
  if (pageToken) url.searchParams.set('pageToken', pageToken)

  try {
    const res = await fetch(url.toString())
    if (!res.ok) return EMPTY_PAGE
    const data = await res.json()
    const items = Array.isArray(data.items) ? data.items : []
    const results: YouTubeSearchResult[] = []
    for (const item of items) {
      const videoId = item?.id?.videoId
      const title = item?.snippet?.title
      const thumbnailUrl = item?.snippet?.thumbnails?.default?.url
      if (typeof videoId === 'string' && typeof title === 'string' && typeof thumbnailUrl === 'string') {
        results.push({ videoId, title, thumbnailUrl })
      }
    }
    const nextPageToken = typeof data.nextPageToken === 'string' ? data.nextPageToken : null
    return { results, nextPageToken }
  } catch {
    return EMPTY_PAGE
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
