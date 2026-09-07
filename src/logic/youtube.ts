const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined

export interface YouTubeSearchResult {
  videoId: string
  title: string
  thumbnailUrl: string
}

// Best-effort match only - the player still has to confirm it (or fall back
// to a direct link via extractYouTubeVideoId) rather than it being submitted
// silently. Returns null rather than throwing on any failure (missing key,
// network error, no results) so a broken search never blocks a submission -
// it just means the manual fallback is what's needed.
export async function searchYouTubeVideo(query: string): Promise<YouTubeSearchResult | null> {
  if (!API_KEY) return null
  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('type', 'video')
  url.searchParams.set('maxResults', '1')
  url.searchParams.set('q', query)
  url.searchParams.set('key', API_KEY)

  try {
    const res = await fetch(url.toString())
    if (!res.ok) return null
    const data = await res.json()
    const item = data.items?.[0]
    const videoId = item?.id?.videoId
    const title = item?.snippet?.title
    const thumbnailUrl = item?.snippet?.thumbnails?.default?.url
    if (typeof videoId !== 'string' || typeof title !== 'string' || typeof thumbnailUrl !== 'string') {
      return null
    }
    return { videoId, title, thumbnailUrl }
  } catch {
    return null
  }
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
