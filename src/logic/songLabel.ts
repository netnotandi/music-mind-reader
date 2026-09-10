import type { Song } from '../types'
import { decodeHtmlEntities } from './youtube'

// Trim a YouTube video title down to something that fits a chip: drop the
// "(Official Video)" / "[Lyrics]" style decoration and any trailing
// "- Official Audio" tail. Falls back to the untouched title if that would
// leave nothing.
function stripDecoration(title: string): string {
  const cleaned = title
    .replace(/\s*[([][^()[\]]*[)\]]/g, '')
    .replace(/\s*[-–—|:]\s*(official|lyrics?|audio|visuali[sz]er|hd|4k|mv|m\/v|full video).*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return cleaned || title.trim()
}

// `title` and `artist` are what the player typed into the search box - often
// just a lyric, a partial name, or nothing at all. When they went on to
// pick a YouTube result, that video's title IS the song's name and the
// typed text is not shown. Only a manual-link song (no search result) falls
// back to the typed title/artist. Nothing here returns an empty string, so
// a card never renders a bare "" line.
//
// `short` is a compact form for tight spots (the "you guessed them for X"
// chip hint): the typed title if there is one, else the video title with
// its decoration stripped.
export function songLabel(song: Pick<Song, 'title' | 'artist' | 'youtubeTitle'>): {
  primary: string
  secondary: string | null
  short: string
} {
  const title = song.title?.trim() ?? ''
  const artist = song.artist?.trim() ?? ''
  const youtubeTitle = decodeHtmlEntities(song.youtubeTitle?.trim() ?? '')

  if (youtubeTitle) {
    return {
      primary: youtubeTitle,
      secondary: null,
      short: title || stripDecoration(youtubeTitle) || artist || 'Untitled song',
    }
  }

  const primary = title || artist || 'Untitled song'
  const secondary = artist && artist !== primary ? artist : null
  return { primary, secondary, short: primary }
}
