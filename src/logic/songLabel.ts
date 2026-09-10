import type { Song } from '../types'
import { decodeHtmlEntities } from './youtube'

// `title` and `artist` are what the player typed into the search box - often
// just a lyric, a partial name, or nothing at all. When they went on to
// pick a YouTube result, that video's title IS the song's name and the
// typed text is not shown. Only a manual-link song (no search result) falls
// back to the typed title/artist. Nothing here returns an empty string, so
// a card never renders a bare "" line.
export function songLabel(song: Pick<Song, 'title' | 'artist' | 'youtubeTitle'>): {
  primary: string
  secondary: string | null
} {
  const title = song.title?.trim() ?? ''
  const artist = song.artist?.trim() ?? ''
  const youtubeTitle = decodeHtmlEntities(song.youtubeTitle?.trim() ?? '')

  if (youtubeTitle) return { primary: youtubeTitle, secondary: null }

  const primary = title || artist || 'Untitled song'
  const secondary = artist && artist !== primary ? artist : null
  return { primary, secondary }
}
