const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined

// Best-effort match only - callers must still let the player fall back to a
// direct link (via extractYouTubeVideoId) when this finds nothing or finds
// the wrong thing. Returns null rather than throwing on any failure (missing
// key, network error, no results) so a broken search never blocks a
// submission - it just means the manual fallback is what's needed.
export async function searchYouTubeVideoId(query: string): Promise<string | null> {
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
    const videoId = data.items?.[0]?.id?.videoId
    return typeof videoId === 'string' ? videoId : null
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
