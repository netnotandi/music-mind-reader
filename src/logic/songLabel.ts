import type { Song } from '../types'

// `title` and `artist` are each optional on their own - the submit form only
// needs one of them to run a search, and a manual-link song can arrive with
// neither. The YouTube video title (stored when the player picks a search
// result) is the most reliable "what song is this" string we have, so it
// fills in for a missing/sparse title and always shows as the secondary
// line. Nothing here ever returns an empty string, so a card never renders a
// bare "" where the artist should be.
export function songLabel(song: Pick<Song, 'title' | 'artist' | 'youtubeTitle'>): {
  primary: string
  secondary: string | null
} {
  const title = song.title?.trim() ?? ''
  const artist = song.artist?.trim() ?? ''
  const youtubeTitle = song.youtubeTitle?.trim() ?? ''

  const primary = title || youtubeTitle || artist || 'Untitled song'
  let secondary: string | null = null
  if (youtubeTitle && youtubeTitle !== primary) secondary = youtubeTitle
  else if (artist && artist !== primary) secondary = artist

  return { primary, secondary }
}
